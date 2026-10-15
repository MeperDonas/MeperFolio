import { describe, expect, it } from 'vitest';
import projects from '../src/components/Projects.astro?raw';
import plugins from '../src/components/Plugins.astro?raw';
import siteNav from '../src/components/SiteNav.astro?raw';
import index from '../src/pages/index.astro?raw';
import globalCss from '../src/styles/global.css?raw';
import themesCss from '../src/styles/themes.css?raw';

/**
 * Structural and appearance invariants.
 *
 * This is the regression net for the class of bug that unit tests did not catch
 * this session. Every one of these broke once, was found by hand in a browser,
 * and is invisible to a build: a build log looks identical whether the paged
 * frame overlaps or stacks, whether the nav is centred, or whether an icon points
 * at a file that no longer exists.
 *
 * Assertions run against the sources rather than rendered output on purpose: no
 * browser dependency, no CI cost, and they pin the structural or token decision
 * instead of its pixel result. What they still cannot see is the computed
 * geometry and colour of the built page; that needs a headless browser in the
 * suite and is a dependency decision of its own.
 */
describe('structural invariants', () => {
  it('keeps the paged frames overlapping in one grid cell', () => {
    // Dropping `col-start-1 row-start-1` turns the pages into separate grid rows.
    // Because the inactive page is hidden with `visibility` it still occupies
    // layout, so page 1 hugged the top and page 2 was pushed to the bottom. The
    // frame-stability check passed anyway: page1+page2 is stable too.
    for (const [name, source] of [['Projects', projects], ['Plugins', plugins]] as const) {
      expect(source, `${name} must keep every page in the same grid cell`).toContain('col-start-1 row-start-1');
      expect(source).toContain('data-project-pages');
      expect(source).toContain('data-project-page=');
    }
  });

  it('never hides a page with display:none', () => {
    // `display: none` removes the page from layout, it stops contributing height,
    // and the static frame collapses - which is the jumping the frame exists to
    // prevent. The hiding lives in global.css as visibility + opacity.
    expect(globalCss).toContain(".project-page[data-active='false']");
    expect(globalCss).toMatch(/\[data-active='false'\][\s\S]{0,120}visibility: hidden/);
  });

  it('references project icons by their real extension', () => {
    // The originals are png in the brand pack and the shipped files are webp.
    // Pointing at the wrong extension renders a broken cover with no build error.
    expect(projects).not.toMatch(/\/apps\/\$\{[^}]+\}\/icon\.png/);
    expect(projects).toContain('/icon.webp');
  });

  it('keeps the control cluster reachable while scrolling', () => {
    // Absolute positioning scrolled the theme switch and the back-to-top away
    // with the page, which is exactly when you need them.
    expect(index).toMatch(/fixed[^"]*bottom-4 right-4/);
    expect(index).toContain('data-theme-toggle');
    expect(index).toContain('data-scroll-top');
  });

  it('centres the horizontal section nav instead of leaving it left-aligned', () => {
    // The nav row hugged the left while everything above it was centred.
    expect(siteNav).toMatch(/overflow-x-auto[\s\S]{0,200}mx-auto flex w-max/);
  });

  it('keeps the card buttons the only modal trigger', () => {
    // The palette rows and the cards are activated by delegation, so nothing may
    // nest an interactive element inside a card button.
    expect(projects).toContain('data-card-open');
    expect(projects).not.toMatch(/data-card-open[\s\S]{0,600}<a\s/);
  });
});

describe('appearance invariants', () => {
  it('keeps the radius ladder at zero', () => {
    // Omarchy's hard-edged surfaces are the system's identity. The library radii
    // are zeroed in global.css while rounded-full circles stay available, so a
    // soft radius creeping back into the ladder is a theme regression.
    for (const token of ['sm', 'md', 'lg', 'xl']) {
      expect(globalCss, `--radius-${token} must stay 0px`).toContain(`--radius-${token}: 0px`);
    }
  });

  it('expresses depth as a ring, not a blurred shadow', () => {
    // Depth is a 1px white-alpha ring. The floating panels take the ring token, so
    // a literal blurred shadow would mean the rule was replaced by hand.
    expect(globalCss).toContain('--shadow-elevation: var(--t-elevation)');
    expect(globalCss).toMatch(/\.card-modal-panel[\s\S]{0,300}var\(--shadow-elevation-hover\)/);
    expect(globalCss).not.toMatch(/\.card-modal-panel[\s\S]{0,300}\d+px\s+\d+px\s+rgba/);
  });

  it('keeps both palettes and their selector specificity intact', () => {
    // The cascade bug: a bare `[data-theme=x]` ties with `:root`, so the minifier
    // could pin every theme to the fallback. themes.test.ts owns the detail; this
    // is the cheap tripwire next to the other appearance rules.
    expect(themesCss).toContain('html[data-theme="tokyo-night"]');
    expect(themesCss.match(/^:root\s*\{/gm)?.length).toBe(1);
  });

  it('ships the checkerboard cover for plugins without a screenshot', () => {
    // The registry look depends on the grid field existing as a class, not only on
    // the utility being applied inline.
    expect(globalCss).toContain('.theme-grid');
    expect(plugins).toContain('theme-grid');
  });

  it('keeps the swatch dot and the active check wired to the palette state', () => {
    // The check follows `aria-selected` through CSS rather than a JS-set class, so
    // the rule has to exist for the active palette to be readable.
    expect(globalCss).toContain("[data-theme-option][aria-selected='true'] [data-theme-check]");
  });
});
