import { execFile } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import puppeteer, { type Browser, type Page } from 'puppeteer-core';

/**
 * Computed geometry and colour, measured in a real browser over the built site.
 *
 * The rest of the suite reads sources, so it pins intent; this file pins pixels.
 * Every case below reproduces something that shipped wrong and was only found by
 * looking at the rendered page: the paged frame stacking, covers with white
 * corners or transparent holes, the theme switch not applying, the control
 * cluster scrolled out of reach, and a palette whose arrows did nothing.
 *
 * It runs Chromium from the system, so there is no browser download. With no
 * browser present the suite is skipped with a named reason instead of failing on
 * a machine that cannot run it.
 */
const run = promisify(execFile);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const CHROMIUM = process.env.CHROMIUM_PATH ?? '/usr/bin/chromium';
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 900 };
const TEST_TIMEOUT = 60_000;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
};

const hasBrowser = await stat(CHROMIUM).then(
  (stats) => stats.isFile(),
  () => false,
);

let server: Server | undefined;
let browser: Browser | undefined;
let base = '';

/** Serves dist/ over http. Built artifacts, not sources: this measures output. */
function serveDist(root: string): Promise<string> {
  server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
      let file = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ''));
      try {
        if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      } catch {
        file = join(root, 'index.html');
      }
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => {
    server?.listen(0, '127.0.0.1', () => {
      const address = server?.address();
      resolve(`http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`);
    });
  });
}

describe.runIf(hasBrowser)('rendered appearance', () => {
  beforeAll(async () => {
    await run('npx', ['astro', 'build'], { cwd: ROOT });
    base = await serveDist(DIST);
    browser = await puppeteer.launch({
      executablePath: CHROMIUM,
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
  }, 180_000);

  afterAll(async () => {
    await browser?.close();
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
  });

  async function openSite(viewport = DESKTOP): Promise<Page> {
    const page = await browser!.newPage();
    await page.setViewport(viewport);
    await page.goto(base, { waitUntil: 'load' });
    return page;
  }

  const scrollToBottom = (page: Page) =>
    page.evaluate(() => {
      const root = document.querySelector<HTMLElement>('[data-scroll-root]');
      if (root) root.scrollTop = root.scrollHeight;
      else window.scrollTo(0, document.body.scrollHeight);
    });

  it(
    'opens the palette with no text field, taking focus on the panel',
    async () => {
      const page = await openSite();

      // The password manager was offered because a text field existed at all.
      expect(await page.$$eval('[data-cmdk] input', (nodes) => nodes.length)).toBe(0);

      await page.keyboard.down('Control');
      await page.keyboard.press('KeyK');
      await page.keyboard.up('Control');
      await page.waitForFunction(
        () => (document.querySelector('[data-cmdk]') as HTMLElement)?.hidden === false,
      );

      // Without focus landing on the panel, the arrows reach nothing at all.
      expect(
        await page.evaluate(() => document.activeElement?.hasAttribute('data-cmdk-panel') ?? false),
        'the panel must take focus',
      ).toBe(true);

      const selected = () =>
        page.evaluate(
          () =>
            document.querySelector('[data-cmdk-item][aria-selected="true"]')?.textContent?.trim() ?? '',
        );
      const first = await selected();
      expect(first, 'the palette opens with a row already selected').not.toBe('');

      await page.keyboard.press('ArrowDown');
      expect(await selected(), 'ArrowDown moves the selection').not.toBe(first);
      await page.keyboard.press('ArrowUp');
      expect(await selected(), 'ArrowUp moves it back').toBe(first);

      await page.keyboard.press('Escape');
      await page.waitForFunction(
        () => (document.querySelector('[data-cmdk]') as HTMLElement)?.hidden === true,
      );
      await page.close();
    },
    TEST_TIMEOUT,
  );

  it(
    'keeps the paged frame the same height on every page',
    async () => {
      const page = await openSite();
      const frame = () =>
        page.$eval('[data-project-pages]', (el) => Math.round(el.getBoundingClientRect().height));
      const counter = () => page.$eval('[data-project-counter]', (el) => el.textContent?.trim() ?? '');

      const before = await frame();
      const counterBefore = await counter();
      await page.click('[data-project-next]');
      await page.waitForFunction(
        (previous) =>
          document.querySelector('[data-project-counter]')?.textContent?.trim() !== previous,
        {},
        counterBefore,
      );

      // The inactive page is hidden with visibility, so it still contributes height.
      // Dropping the shared grid cell pushed page 2 below page 1 instead.
      expect(await frame(), 'the frame must not resize when paging').toBe(before);
      await page.close();
    },
    TEST_TIMEOUT,
  );

  it(
    'renders every loaded project cover opaque, corners included',
    async () => {
      const page = await openSite();
      // Covers are lazy, so they only fetch once the section is in view. Waiting on
      // every image on the page would wait forever for the ones never scrolled to.
      await page.evaluate(() => document.getElementById('projects')?.scrollIntoView());
      await page.waitForFunction(
        () =>
          Array.from(document.images).some(
            (img) => img.src.includes('/apps/') && img.complete && img.naturalWidth > 0,
          ),
        { timeout: 20_000 },
      );

      const covers = await page.$$eval('img[src*="/apps/"]', (imgs) =>
        imgs
          .filter((img) => img.complete && img.naturalWidth > 0)
          .map((img) => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const px = (x: number, y: number) => Array.from(ctx?.getImageData(x, y, 1, 1).data ?? []);
            return {
              src: img.getAttribute('src') ?? '',
              corners: {
                'top-left': px(0, 0),
                'top-right': px(canvas.width - 1, 0),
                'bottom-left': px(0, canvas.height - 1),
                'bottom-right': px(canvas.width - 1, canvas.height - 1),
              },
            };
          }),
      );

      expect(covers.length, 'at least one cover must be measurable').toBeGreaterThan(0);
      for (const cover of covers) {
        for (const [corner, pixel] of Object.entries(cover.corners)) {
          // A transparent or black corner is the bug that shipped twice: keying the
          // art's light background punched the mascots' white fur into holes.
          expect(pixel[3], `${cover.src} ${corner} alpha`).toBe(255);
        }
      }
      await page.close();
    },
    TEST_TIMEOUT,
  );

  it(
    'applies a different computed background per palette',
    async () => {
      const page = await openSite();
      const names = await page.$$eval('[data-theme-option]', (options) =>
        options
          .map((option) => option.getAttribute('data-theme-option'))
          .filter((name): name is string => !!name),
      );
      expect(names.length, 'the switcher must offer several palettes').toBeGreaterThan(1);

      // The cascade bug: a bare [data-theme=x] ties with :root, so a minifier that
      // reorders the blocks pins every palette to the fallback colour.
      const sampled = names.slice(0, 6);
      const backgrounds = new Set<string>();
      for (const name of sampled) {
        backgrounds.add(
          await page.evaluate((theme) => {
            document.documentElement.dataset.theme = theme;
            return getComputedStyle(document.documentElement).getPropertyValue('--t-bg').trim();
          }, name),
        );
      }
      expect(backgrounds.size, 'palettes must not collapse onto one colour').toBeGreaterThanOrEqual(
        Math.min(4, sampled.length),
      );
      await page.close();
    },
    TEST_TIMEOUT,
  );

  it(
    'keeps the control cluster inside the viewport after scrolling',
    async () => {
      const page = await openSite();
      await scrollToBottom(page);
      await new Promise((resolve) => setTimeout(resolve, 400));

      for (const selector of ['[data-theme-toggle]', '[data-scroll-top]']) {
        const box = await page.$eval(selector, (el) => {
          const rect = el.getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom, height: rect.height };
        });
        // Absolute positioning sent these away with the page, exactly when needed.
        expect(box.height, `${selector} must be renderable`).toBeGreaterThan(0);
        expect(box.top, `${selector} scrolled off the top`).toBeGreaterThanOrEqual(0);
        expect(box.bottom, `${selector} scrolled off the bottom`).toBeLessThanOrEqual(DESKTOP.height + 1);
      }
      await page.close();
    },
    TEST_TIMEOUT,
  );

  it(
    'keeps the control cluster inside a mobile viewport too',
    async () => {
      const page = await openSite(MOBILE);
      await scrollToBottom(page);
      await new Promise((resolve) => setTimeout(resolve, 400));

      const box = await page.$eval('[data-theme-toggle]', (el) => {
        const rect = el.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(MOBILE.height + 1);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(MOBILE.width + 1);
      await page.close();
    },
    TEST_TIMEOUT,
  );
});

if (!hasBrowser) {
  describe('rendered appearance', () => {
    it.skip(`no browser at ${CHROMIUM}: set CHROMIUM_PATH to run the rendered checks`, () => {});
  });
}
