import { describe, expect, it } from 'vitest';

/**
 * Content-to-asset integrity.
 *
 * This is the regression net for the bug class the owner hit twice: a card that
 * silently renders its monogram because the cover asset it names does not exist,
 * or is named differently. Nothing in the unit suite would have caught it, and
 * the failure is invisible in a build log because a missing image is not an
 * error. A glob is used instead of `node:fs` so the suite keeps working without
 * pulling in `@types/node`.
 */
const appAssets = Object.keys(
  import.meta.glob('../public/apps/**/*.png', { eager: true, query: '?url' }),
);
const pluginAssets = Object.keys(
  import.meta.glob('../public/plugins/**/*', { eager: true, query: '?url' }),
);
const projectFiles = import.meta.glob('../content/projects/*/*.md', {
  eager: true,
  query: '?raw',
  // `?raw` through a glob hands back the module namespace, so the string lives on
  // `default`. A direct `import x from 'f.md?raw'` resolves that for you; a glob
  // does not, which is why this option is required here.
  import: 'default',
}) as Record<string, string>;
const pluginFiles = import.meta.glob('../content/plugins/*/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

/** Reads the flat `key: value` lines of a markdown frontmatter block. */
function frontmatter(raw: string): Record<string, string> {
  const body = raw.split(/^---\s*$/m)[1] ?? '';
  const out: Record<string, string> = {};
  for (const line of body.split('\n')) {
    const match = /^([a-z-]+):\s*(.+?)\s*$/.exec(line);
    if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

const entries = (files: Record<string, string>): [string, Record<string, string>][] =>
  Object.entries(files).map(([path, raw]) => [path, frontmatter(raw)]);

describe('content assets', () => {
  it('resolves every project logo to a real dark and light lockup', () => {
    const missing: string[] = [];
    for (const [path, fm] of entries(projectFiles)) {
      if (!fm.logo) continue;
      for (const variant of ['lockup-dark.png', 'lockup-light.png']) {
        const wanted = `public/apps/${fm.logo}/${variant}`;
        if (!appAssets.some((key) => key.endsWith(wanted))) missing.push(`${path} -> ${wanted}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('resolves every plugin preview to a real file', () => {
    const missing: string[] = [];
    for (const [path, fm] of entries(pluginFiles)) {
      if (!fm.preview) continue;
      const wanted = `public${fm.preview}`;
      if (!pluginAssets.some((key) => key.endsWith(wanted))) missing.push(`${path} -> ${wanted}`);
    }
    expect(missing).toEqual([]);
  });

  it('points every repository at a real github url and never at a private one without a repo key', () => {
    const bad: string[] = [];
    for (const [path, fm] of entries(projectFiles)) {
      if (fm.repo && !fm.repo.startsWith('https://github.com/')) bad.push(`${path}: ${fm.repo}`);
      if (fm.url && !fm.url.startsWith('http')) bad.push(`${path}: ${fm.url}`);
    }
    for (const [path, fm] of entries(pluginFiles)) {
      if (!fm.repo || !fm.repo.startsWith('https://github.com/')) bad.push(`${path}: ${fm.repo}`);
    }
    expect(bad).toEqual([]);
  });

  it('points every plugin at its own page in the omarchy marketplace', () => {
    // The owner hit the dead-link class twice. The marketplace's per-plugin
    // page is `plugin.html?id=<manifest id>`, so the entry's own id has to
    // appear in its own redirect; a mismatched id is a 404 in production.
    const bad: string[] = [];
    for (const [path, fm] of entries(pluginFiles)) {
      if (!fm.id) {
        bad.push(`${path}: no manifest id`);
        continue;
      }
      const wanted = `https://plugins.omarchy.org/plugin.html?id=${fm.id}`;
      if (fm.marketplace !== wanted) bad.push(`${path}: ${fm.marketplace ?? 'no marketplace url'}`);
    }
    expect(bad).toEqual([]);
  });

  it('gives every entry a title and a description', () => {
    const bad: string[] = [];
    for (const [path, fm] of [...entries(projectFiles), ...entries(pluginFiles)]) {
      if (!fm.title) bad.push(`${path}: title`);
      if (!fm.description) bad.push(`${path}: description`);
    }
    expect(bad).toEqual([]);
  });

  it('keeps both locales in step for every collection', () => {
    for (const files of [projectFiles, pluginFiles]) {
      const keys = Object.keys(files);
      const es = keys.filter((key) => key.includes('/es/')).length;
      const en = keys.filter((key) => key.includes('/en/')).length;
      expect(es).toBeGreaterThan(0);
      expect(es).toBe(en);
      // Same file names in both locales, or a locale is missing an entry.
      const names = (locale: string) =>
        keys
          .filter((key) => key.includes(`/${locale}/`))
          .map((key) => key.split('/').pop())
          .sort();
      expect(names('es')).toEqual(names('en'));
    }
  });
});
