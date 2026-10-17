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
    'keeps every project card the same size, with a large undistorted cover',
    async () => {
      const page = await openSite();
      await page.evaluate(() => document.getElementById('projects')?.scrollIntoView());
      // One, not both: the other locale's copy sits in the DOM behind `hidden`,
      // has no layout and never loads its lazy covers. `[data-locale="es"]` is the
      // copy on screen by default.
      // Scoped to `#projects` on purpose: the plugins section uses the same
      // `data-project-page` pager, so an unscoped selector mixes both sections.
      const cardsIn = '#projects [data-locale="es"] [data-project-page="0"] [data-card-open]';
      // The reveal choreography scales cards down until they enter view, and the
      // second row never enters the observed viewport inside the snap deck, so
      // the test reveals them itself and then measures the resting geometry.
      await page.evaluate((selector) => {
        for (const card of document.querySelectorAll(selector)) {
          card.classList.add('is-visible');
        }
      }, cardsIn);
      await page.waitForFunction(
        (selector) => {
          const cards = Array.from(document.querySelectorAll(selector));
          return (
            cards.length === 4 &&
            cards.every((card) => {
              const img = card.querySelector('img');
              return (
                !!img &&
                img.complete &&
                img.naturalWidth > 0 &&
                getComputedStyle(card).transform === 'none'
              );
            })
          );
        },
        { timeout: 20_000 },
        cardsIn,
      );

      const cards = await page.$$eval(
        '#projects [data-locale="es"] [data-project-page="0"] [data-card-open]',
        (nodes) =>
          nodes.map((node) => {
            const card = node.getBoundingClientRect();
            const cover = node.querySelector(':scope > div')!.getBoundingClientRect();
            const img = node.querySelector('img');
            const art = img?.getBoundingClientRect();
            return {
              title: (node as HTMLElement).dataset.cardTitle ?? '',
              height: card.height,
              cover: { top: cover.top, height: cover.height, width: cover.width },
              art: art
                ? {
                    height: art.height,
                    width: art.width,
                    left: art.left - cover.left,
                    right: cover.right - art.right,
                    top: art.top - cover.top,
                    bottom: cover.bottom - art.bottom,
                  }
                : null,
              natural: img ? { width: img.naturalWidth, height: img.naturalHeight } : null,
            };
          }),
      );

      // BrokerApp took VidMetrics Pulse's slot on the first page.
      expect(cards.map((card) => card.title)).toEqual([
        'MeperSoft',
        'Meper-Pos',
        'MeperBoard',
        'BrokerApp',
      ]);

      const span = (values: number[]) => Math.max(...values) - Math.min(...values);
      // A one-row chip stack or a short description used to shorten its card and
      // leave the row ragged, so the whole page is checked, not just one row.
      expect(span(cards.map((card) => card.height)), 'every card must be the same height').toBeLessThanOrEqual(1);
      for (const row of [
        [cards[0], cards[1]],
        [cards[2], cards[3]],
      ]) {
        expect(span(row.map((card) => card.cover.height))).toBeLessThanOrEqual(1);
        expect(span(row.map((card) => card.cover.top))).toBeLessThanOrEqual(1);
      }

      for (const card of cards) {
        expect(card.art, `${card.title} must render its cover art`).not.toBeNull();
        if (!card.art || !card.natural) continue;
        // "se pierde en el centro": the tile used to be 58% of the box height,
        // then 76%; the owner asked for more both times, so this pins 92%.
        const share = card.art.height / card.cover.height;
        expect(share, `${card.title} cover art is too small`).toBeGreaterThanOrEqual(0.85);
        // Never stretched: the rendered ratio has to match the file's own.
        const rendered = card.art.width / card.art.height;
        const file = card.natural.width / card.natural.height;
        expect(Math.abs(rendered - file), `${card.title} cover art is distorted`).toBeLessThan(0.02);
        expect(Math.abs(card.art.left - card.art.right), `${card.title} art is off-centre`).toBeLessThanOrEqual(1);
        expect(Math.abs(card.art.top - card.art.bottom), `${card.title} art is off-centre`).toBeLessThanOrEqual(1);
      }

      await page.close();
    },
    TEST_TIMEOUT,
  );

  it(
    'lists Look\'n\'Feel as the first plugin',
    async () => {
      const page = await openSite();
      const titles = await page.$$eval(
        '#plugins [data-locale="es"] [data-project-page="0"] [data-card-open]',
        (cards) => cards.map((card) => (card as HTMLElement).dataset.cardTitle ?? ''),
      );
      expect(titles).toEqual(["Look'n'Feel", 'devstack', 'Work connection']);
      await page.close();
    },
    TEST_TIMEOUT,
  );

  it(
    'renders every project cover opaque, corners included, with no keyed holes',
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
            const data = ctx?.getImageData(0, 0, canvas.width, canvas.height).data ?? new Uint8ClampedArray();
            const alphaAt = (x: number, y: number) => data[(y * canvas.width + x) * 4 + 3];
            // Two bugs live here. A transparent corner is the frame showing through
            // (the tile's rounded edge or the pack's white ring), and a transparent
            // patch inside is a keyed hole where the light fur was. The covers are
            // full-bleed squares, so both are wrong now.
            const inset = Math.round(canvas.width * 0.12);
            let holes = 0;
            for (let y = inset; y < canvas.height - inset; y += 1) {
              for (let x = inset; x < canvas.width - inset; x += 1) {
                if (alphaAt(x, y) < 255) holes += 1;
              }
            }
            return {
              src: img.getAttribute('src') ?? '',
              holes,
              corners: {
                'top-left': alphaAt(0, 0),
                'top-right': alphaAt(canvas.width - 1, 0),
                'bottom-left': alphaAt(0, canvas.height - 1),
                'bottom-right': alphaAt(canvas.width - 1, canvas.height - 1),
              },
            };
          }),
      );

      expect(covers.length, 'at least one cover must be measurable').toBeGreaterThan(0);
      for (const cover of covers) {
        expect(cover.holes, `${cover.src} has transparent pixels inside it`).toBe(0);
        for (const [corner, alpha] of Object.entries(cover.corners)) {
          expect(alpha, `${cover.src} ${corner} alpha`).toBe(255);
        }
      }
      await page.close();
    },
    TEST_TIMEOUT,
  );

  it(
    'animates the experience timeline and stops under reduced motion',
    async () => {
      const page = await openSite();
      await page.evaluate(() => document.getElementById('experience')?.scrollIntoView());
      await new Promise((resolve) => setTimeout(resolve, 800));

      const sheen = () =>
        page.evaluate(() => {
          const line = document.querySelector('.timeline-line');
          return line ? getComputedStyle(line, '::after').animationName : null;
        });

      expect(await sheen(), 'the rail must carry its sheen').toBe('timeline-sheen');

      await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      expect(await sheen(), 'reduced motion must stop the sheen').toBe('none');
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

      for (const selector of [
        '[data-cmdk-open]',
        '[data-locale-toggle]',
        '[data-theme-toggle]',
        '[data-scroll-top]',
      ]) {
        const box = await page.$eval(selector, (el) => {
          const rect = el.getBoundingClientRect();
          return { top: rect.top, bottom: rect.bottom, height: rect.height };
        });
        // Absolute positioning sent these away with the page, exactly when needed.
        expect(box.height, `${selector} must be renderable`).toBeGreaterThan(0);
        expect(box.top, `${selector} scrolled off the top`).toBeGreaterThanOrEqual(0);
        expect(box.bottom, `${selector} scrolled off the bottom`).toBeLessThanOrEqual(DESKTOP.height + 1);
      }

      // One cluster, not two: the reading of this check is a shared parent, which
      // fails if any control drifts back to the identity column.
      expect(
        await page.evaluate(() => {
          const anchor = document.querySelector('[data-theme-toggle]')?.parentElement;
          const others = ['[data-cmdk-open]', '[data-locale-toggle]', '[data-scroll-top]'].map(
            (selector) => document.querySelector(selector)?.parentElement,
          );
          return !!anchor && others.every((parent) => parent === anchor);
        }),
        'every page-level control must share one cluster',
      ).toBe(true);
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

      // The cluster sits on the reading column's gutter, lifted clear of the
      // viewport floor: 16px read as jammed into the corner, 24px still hugged
      // the bottom edge.
      const cluster = await page.$eval('[data-cmdk-open]', (el) => {
        const rect = el.parentElement!.getBoundingClientRect();
        return { left: rect.left, right: rect.right, bottom: rect.bottom };
      });
      expect(Math.round(MOBILE.width - cluster.right), 'cluster right offset').toBe(4);
      expect(Math.round(MOBILE.height - cluster.bottom), 'cluster bottom offset').toBe(56);

      // The point of that offset: the cluster lives in the strip the content
      // leaves free, so it never sits over a card or a line of text.
      const widestContent = await page.evaluate(() =>
        Math.max(
          ...Array.from(
            document.querySelectorAll(
              '#projects [data-locale="es"] [data-card-open], #plugins [data-locale="es"] [data-card-open]',
            ),
          ).map((el) => el.getBoundingClientRect().right),
        ),
      );
      expect(cluster.left, 'the cluster must clear the content it floats over').toBeGreaterThanOrEqual(
        Math.round(widestContent),
      );

      // And it is a column, not a row: the four controls share one centre line and
      // stack downward, in DOM order. In a row they consumed most of the width.
      const stack = await page.evaluate(() =>
        ['[data-cmdk-open]', '[data-locale-toggle]', '[data-scroll-top]', '[data-theme-toggle]'].map(
          (selector) => {
            const rect = document.querySelector(selector)!.getBoundingClientRect();
            return { centre: rect.left + rect.width / 2, top: Math.round(rect.top) };
          },
        ),
      );
      const centres = stack.map((item) => item.centre);
      expect(
        Math.max(...centres) - Math.min(...centres),
        'the controls must share one column',
      ).toBeLessThanOrEqual(1);
      for (let i = 1; i < stack.length; i += 1) {
        expect(stack[i].top, `${i} stacks below ${i - 1}`).toBeGreaterThan(stack[i - 1].top);
      }

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
