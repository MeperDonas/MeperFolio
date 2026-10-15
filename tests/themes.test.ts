import { describe, expect, it } from 'vitest';
import themesCss from '../src/styles/themes.css?raw';
import { THEMES } from '../src/lib/themes';

const css = themesCss;

/**
 * These guard a cascade bug that shipped once and was invisible to every check
 * that only looked at `data-theme` or at a screenshot.
 *
 * `:root` and `[data-theme="x"]` both have specificity (0,1,0), so between them
 * the *later* rule wins. The generated palettes are sorted by name, which puts
 * the fallback block's own palette (tokyo-night) after seventeen others — and
 * the CSS minifier is free to move duplicated `:root` rules too. The result was
 * that picking catppuccin, nord or everforest set the attribute while the custom
 * properties stayed at tokyo-night's values, because the late `:root` block
 * outranked every palette declared before it.
 *
 * The fix is to stop relying on source order: palettes are selected by element
 * plus attribute, which is (0,1,1) and therefore beats `:root` wherever the
 * minifier decides to place things. `--t-bg` reaching the page is then a real
 * cascade fact rather than a coincidence of emission order.
 */
describe('theme palette cascade contract', () => {
  it('selects every palette with element+attribute so it outranks the :root fallback', () => {
    const weak = THEMES.filter((theme) => !css.includes(`html[data-theme="${theme.name}"]`));
    expect(weak.map((theme) => theme.name)).toEqual([]);
  });

  it('never selects a palette with a bare attribute selector that ties with :root', () => {
    // A bare `[data-theme="x"] {` is the bug: equal specificity to :root.
    const bare = THEMES.filter((theme) => new RegExp(`(^|[,}])\\s*\\[data-theme="${theme.name}"\\]\\s*\\{`).test(css));
    expect(bare.map((theme) => theme.name)).toEqual([]);
  });

  it('keeps exactly one :root fallback block', () => {
    // A second one placed later silently wins over every earlier palette.
    expect(css.match(/^:root\s*\{/gm)?.length).toBe(1);
  });

  it('declares the whole palette set, not a subset', () => {
    const blocks = css.match(/html\[data-theme="[a-z0-9-]+"\]\s*\{/g) ?? [];
    expect(blocks.length).toBe(THEMES.length);
    expect(THEMES.length).toBe(22);
  });

  it('gives every palette at least the fallback role coverage', () => {
    // A palette MISSING a role silently inherits whatever value the cascade left
    // behind, which reads as "the theme half-applied". Extra roles are fine: the
    // four sponsor palettes legitimately carry the `--t-partner-*` marks that the
    // fallback does not.
    const roles = (selector: string): string[] => {
      const start = css.indexOf(selector);
      expect(start).toBeGreaterThan(-1);
      const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
      return [...body.matchAll(/(--t-[a-z0-9-]+)\s*:/g)].map((m) => m[1]);
    };
    const fallbackRoles = roles(':root {');
    const missing: string[] = [];
    for (const theme of THEMES) {
      const paletteRoles = roles(`html[data-theme="${theme.name}"]`);
      for (const role of fallbackRoles) {
        if (!paletteRoles.includes(role)) missing.push(`${theme.name}:${role}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
