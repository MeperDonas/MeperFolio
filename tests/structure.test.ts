import { describe, expect, it } from 'vitest';
import projects from '../src/components/Projects.astro?raw';
import plugins from '../src/components/Plugins.astro?raw';
import siteNav from '../src/components/SiteNav.astro?raw';
import index from '../src/pages/index.astro?raw';
import base from '../src/layouts/Base.astro?raw';
import appTs from '../src/scripts/app.ts?raw';
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
    // with the page, which is exactly when you need them. Below lg the offsets
    // are the content gutter (24px) and a clear lift off the viewport floor
    // (56px): at 16px the cluster read as jammed into the corner, and at 24px it
    // still hugged the bottom edge instead of sitting clear above it.
    expect(index).toMatch(/fixed[^"]*bottom-14 right-6/);
    expect(index).toContain('data-theme-toggle');
    expect(index).toContain('data-scroll-top');
    // One column on the narrow layout, one row on lg: in a row the four controls
    // ate most of a 390px reading width.
    expect(index).toMatch(/fixed[^"]*flex-col[^"]*lg:flex-row/);
  });

  it('centres the horizontal section nav instead of leaving it left-aligned', () => {
    // The nav row hugged the left while everything above it was centred.
    expect(siteNav).toMatch(/overflow-x-auto[\s\S]{0,200}mx-auto flex w-max/);
  });

  it('keeps the palette keyboard-driven with no text input', () => {
    // A text field in the panel made the browser offer its password manager on
    // every open, for a filter that seven fixed rows never needed. Removing it
    // moves the arrow keys off the input, so the two halves are pinned together:
    // no field in the markup, and the key handling bound to the palette itself.
    const palette = index.slice(index.indexOf('data-cmdk hidden'));
    expect(palette).not.toContain('<input');
    expect(appTs).not.toContain('data-cmdk-input');
    expect(appTs).not.toContain('applyFilter');
    // The panel must be focusable, or nothing ever receives the arrows.
    expect(palette).toMatch(/data-cmdk-panel[\s\S]{0,120}tabindex="-1"/);
    expect(appTs).toMatch(/cmdkRoot\.addEventListener\('keydown'/);
    expect(appTs).toContain('panel?.focus()');
  });

  it('keeps every page-level control in the one cluster', () => {
    // The palette trigger and the language switch used to sit at the top of the
    // identity column, which left two control groups on the same band. They belong
    // to the cluster at the top-right of <main>, which is also the only one that
    // escapes the column's overflow clipping.
    const from = index.indexOf('bottom-14 right-6');
    const to = index.indexOf('data-theme-menu');
    expect(from, 'the cluster must exist').toBeGreaterThan(0);
    expect(to, 'the theme menu must exist').toBeGreaterThan(from);

    const cluster = index.slice(from, to);
    expect(cluster).toContain('data-cmdk-open');
    expect(cluster).toMatch(/<LanguageToggle/);

    // And nothing above the cluster - that is, inside the identity column - may
    // hold them again.
    const column = index.slice(index.indexOf('<aside'), from);
    expect(column).not.toMatch(/data-cmdk-open|<LanguageToggle/);
  });

  it('keeps the card buttons the only modal trigger', () => {
    // The palette rows and the cards are activated by delegation, so nothing may
    // nest an interactive element inside a card button.
    expect(projects).toContain('data-card-open');
    expect(projects).not.toMatch(/data-card-open[\s\S]{0,600}<a\s/);
  });

  it('reserves the room every project card needs to be the same height', () => {
    // The measured version of this lives in visual.test.ts. These are the cheap
    // tripwires: a full-height column, a two-row chip gutter, a one-line title
    // and a two-line description floor. Drop one and the grid goes ragged again
    // with nothing in the build log to show it.
    expect(projects).toContain('flex h-full flex-col');
    expect(projects).toContain('min-h-[60px]');
    expect(projects).toContain('line-clamp-1');
    expect(projects).toContain('min-h-[46px]');
  });

  it('keeps a marketplace redirect on the plugin cards', () => {
    // Every plugin is published in the Omarchy Plugin Marketplace, so the card's
    // modal carries the redirect: the payload from the card, the action in the
    // modal, and the wiring that fills its href. assets.test.ts pins the URL
    // format against each entry's own manifest id.
    expect(plugins).toContain('data-card-marketplace');
    expect(index).toContain('data-card-modal-marketplace');
    expect(appTs).toContain('cardMarketplace');
  });

  it('opens the CV preview without the pages panel', () => {
    // The panel is the viewer's own sidebar: it narrows the page and the owner
    // wants the page itself to open, with the panel out of the way. `pagemode`
    // was read the wrong way round once ("oculto" came through as "culto"), so
    // both halves are pinned: no thumbs mode, and navpanes off.
    expect(index.match(/#pagemode=none&navpanes=0/g)?.length).toBe(2);
    expect(index).not.toContain('#pagemode=thumbs');
  });

  it('advertises the browser identity assets in the head', () => {
    // The tab showed a blank globe because nothing in the head pointed at the
    // brand pack's MeperFolio icons; a missing favicon is invisible in a build.
    expect(base).toContain('rel="icon" href="/favicon.ico"');
    expect(base).toContain('/icons/MeperFolio/icon-32.png');
    expect(base).toContain('rel="apple-touch-icon"');
    expect(base).toContain('rel="manifest" href="/site.webmanifest"');
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
