---
version: alpha
name: Omarchy-design-analysis
description: "A pixel-dithered, monospace, sharp-cornered Linux-distro canvas reverse-engineered from https://omarchy.org/. The visual base is a near-black canvas with a four-step surface ladder, 1px white-alpha ring elevation instead of shadows, and a single chromatic accent (--t-brand) that drives buttons, links, focus rings and the dithered ornament field. Nothing is rounded except circles: the entire radius scale is zeroed and only avatars and pills use rounded-full. Type is Geist Variable for prose and JetBrains Mono Variable for essentially every headline, label and UI string, which gives the whole page a terminal voice. The single most distinctive decision is that the palette is not fixed: the site ships 22 complete `[data-theme]` palettes behind one token contract, picks one at random on first load, persists it, and re-points every color role at once."

colors:
  canvas: "#1a1b26"
  canvas-deep: "#13141c"
  surface-1: "#1f2230"
  surface-2: "#24283b"
  border-subtle: "#24283b"
  border-strong: "#414868"
  ink: "#c0caf5"
  ink-secondary: "#a9b1d6"
  ink-muted: "#8b93b8"
  brand: "#9ece6a"
  brand-soft: "#9ece6a1f"
  on-brand: "#0c0e10"
  selection: "#292e42"
  field-bg: "#0e0e14"
  field-dim: "#39482e"
  field-mid: "#678549"
  field-lit: "#9ece6a"
  field-hover: "#bbdd97"
  field-crest: "#daecc6"
  header-ink: "#1a1c24"
  header-surface: "#2d3044"
  header-surface-2: "#32364f"
  header-ink-secondary: "#b7bfea"
  header-ink-primary: "#ced8ff"
  header-brand: "#acdc7e"
  img-outline: "#ffffff1a"
  scroll-thumb: "#ffffff24"

typography:
  display-xl:
    fontFamily: JetBrains Mono Variable
    fontSize: 60px
    fontWeight: 600
    lineHeight: 1.00
    letterSpacing: -0.025em
  display-lg:
    fontFamily: JetBrains Mono Variable
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.025em
  headline:
    fontFamily: JetBrains Mono Variable
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.20
    letterSpacing: -0.025em
  section-title:
    fontFamily: JetBrains Mono Variable
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.025em
  card-title:
    fontFamily: JetBrains Mono Variable
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.30
    letterSpacing: -0.01em
  body:
    fontFamily: Geist Variable
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  body-sm:
    fontFamily: Geist Variable
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: 0
  label:
    fontFamily: JetBrains Mono Variable
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.20
    letterSpacing: 0
  eyebrow:
    fontFamily: JetBrains Mono Variable
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.30
    letterSpacing: 0.1em
  mono:
    fontFamily: JetBrains Mono Variable
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0

rounded:
  sm: 0px
  md: 0px
  lg: 0px
  xl: 0px
  xxl: 0px
  pill: 9999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 96px

components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.on-brand}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: 8px 20px
    height: 40px
  button-secondary:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: 8px 20px
    height: 40px
  button-icon:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: 40px
    width: 40px
  announcement-pill:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.lg}"
    padding: 6px 12px
  content-card:
    backgroundColor: "{colors.canvas-deep}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 24px
  meetup-card:
    backgroundColor: "{colors.canvas-deep}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 16px
  theme-swatch:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.mono}"
    rounded: "{rounded.lg}"
    padding: 12px
  popover:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 16px
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: 61px
  footer:
    backgroundColor: "{colors.canvas-deep}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.mono}"
    rounded: "{rounded.lg}"
    padding: 48px 16px
---

## Overview

Omarchy's canvas is near-black and almost achromatic. In the reference palette
(`{colors.canvas}` #1a1b26) the only saturated color on the page is
`{colors.brand}` — a single accent that shows up on the primary button, on
link hover, on focus rings, and in the dithered ornament field. Everything else
is a ladder of near-black surfaces (`{colors.canvas-deep}`, `{colors.surface-1}`,
`{colors.surface-2}`) separated by 1px borders and 1px white-alpha rings.

Two decisions define the identity more than any color choice:

1. **The radius scale is zero.** `--radius-sm|md|lg|xl|4xl` all resolve to `0px`,
   so cards, panels, buttons, inputs and popovers are hard-edged rectangles.
   The only circles in the system are `rounded-full` avatars and pills. This is
   what makes the page read as a terminal/TUI surface rather than a SaaS canvas.
2. **The palette is a runtime variable, not a brand constant.** The site ships
   22 complete palettes behind one token contract and swaps all of them by
   changing a single `data-theme` attribute on `<html>`.

## Theme architecture (the signature mechanic)

The color contract is a flat set of `--t-*` custom properties. Tailwind v4
`@theme` tokens are *aliases* onto them, so no component ever names a raw color:

```css
:root, :host {
  --font-sans: "Geist Variable", sans-serif;
  --font-mono: "JetBrains Mono Variable", monospace;
  --spacing: .25rem;
  --radius-sm: 0px; --radius-md: 0px; --radius-lg: 0px; --radius-xl: 0px;
}
:root, [data-theme=tokyo-night] { --t-bg: #1a1b26; --t-brand: #9ece6a; /* …29 tokens */ }
:root {
  --color-bg: var(--t-bg);
  --color-surface: var(--t-surface);
  --color-text: var(--t-text);
  --color-brand: var(--t-brand);
  --color-primary: var(--t-brand);
  --color-primary-foreground: var(--t-brand-ink);
}
```

Each `[data-theme=<name>]` block re-points the same ~29–33 variables. Adding a
theme means adding one block; no component changes.

Theme selection is an inline `<head>` script that runs before first paint:

```js
var t = localStorage.getItem("omarchy-site-theme");
if (ok.indexOf(t) < 0) {
  var pool = matchMedia('(prefers-color-scheme: light)').matches ? light : dark;
  t = pool[Math.floor(Math.random() * pool.length)];
  localStorage.setItem("omarchy-site-theme", t);
}
document.documentElement.dataset.theme = t;   // fallback: "tokyo-night"
```

Shipped palettes: `catppuccin`, `catppuccin-latte`, `ethereal`, `everforest`,
`flexoki-light`, `gruvbox`, `hackerman`, `kanagawa`, `last-horizon`, `lumon`,
`lupine`, `matte-black`, `miasma`, `nord`, `osaka-jade`, `retro-82`,
`ristretto`, `rose-pine`, `solitude`, `tokyo-night`, `vantablack`, `white`.
Dark pool: 17 palettes. Light pool: `catppuccin-latte`, `flexoki-light`,
`lupine`, `rose-pine`, `white`.

Because the palette is random on a cold visit, the site looks different on two
fresh loads. Both captures taken for this analysis agreed on structure and
disagreed on color: one rendered warm/rose on near-black (consistent with
`last-horizon`, `--t-bg` #0c0b0c, `--t-brand` #b59790), the other jade/cream on
dark green-black (consistent with `osaka-jade`, `--t-bg` #111c18,
`--t-brand` #509475). That is the mechanism working, not a defect.

## Colors

Token roles, in the order they matter:

| Role | Token | Reference value | Use |
| --- | --- | --- | --- |
| Canvas | `--t-bg` | #1a1b26 | page background, top nav |
| Canvas deep | `--t-bg-deep` | #13141c | section bands, footer |
| Surface 1 | `--t-surface` | #1f2230 | secondary buttons, popovers |
| Surface 2 | `--t-surface-2` | #24283b | hover state of surfaces |
| Border subtle | `--t-border-subtle` | #24283b | section dividers (`border-t`) |
| Border strong | `--t-border-strong` | #414868 | button outlines |
| Ink | `--t-text` | #c0caf5 | headlines, primary text |
| Ink secondary | `--t-text-secondary` | #a9b1d6 | section descriptions |
| Ink muted | `--t-text-muted` | #8b93b8 | captions, footer |
| Brand | `--t-brand` | #9ece6a | primary button, link hover, focus ring |
| Brand soft | `--t-brand-soft` | #9ece6a1f | tinted fills (~12% alpha) |
| On brand | `--t-brand-ink` | #0c0e10 | text on the brand fill |
| Selection | `--t-selection` | #292e42 | `::selection` |
| Image outline | `--t-img-outline` | #ffffff1a | 10% white ring around media |
| Scroll thumb | `--t-scroll-thumb` | #ffffff24 | ~14% white scrollbar |

### Depth is a ring, not a shadow

```css
--t-elevation:       0 0 0 1px oklch(100% 0 0 / .07);
--t-elevation-hover: 0 0 0 1px oklch(100% 0 0 / .13);
```

There is no blur, no spread, no black shadow anywhere. Lifting a surface means
drawing one more 1px white ring at 7% and then 13%.

### The ornament field

`--t-field-*` is a six-step ramp from `--t-field-bg` → `--t-field-dim` →
`--t-field-mid` → `--t-field-lit` → `--t-field-hover` → `--t-field-crest`. It
is used by the dithered pixel cloud behind the hero: thousands of small squares
whose tone follows the ramp outward from the subject, tinted toward the brand.
It is the only place where the brand color is used decoratively, and it is
always geometric, never a gradient wash.

### The header ramp

`--t-hdr-text`, `--t-hdr-text-2`, `--t-hdr-brand`, `--t-hdr-ink`,
`--t-hdr-surface`, `--t-hdr-surface-2` provide a second, brighter set of the
same roles for the dark overlay panels and the pixel wordmark, where the
standard ink ladder would not hold enough contrast.

## Typography

Two self-hosted variable fonts, latin + latin-ext subsets, roman and italic:

- `Geist Variable` (`--font-sans`) — prose paragraphs.
- `JetBrains Mono Variable` (`--font-mono`) — headlines, nav items, buttons,
  labels, captions, and the pixel wordmark's supporting text.

The mono/sans split is inverted relative to most marketing sites: mono is the
*loud* voice. Section titles, card titles and buttons are all monospace, which
is the single biggest contributor to the "terminal" reading.

Tailwind's default scale is kept: `--text-xs` .75rem → `--text-6xl` 3.75rem,
weights 400/500/600/700, `--tracking-tight` -.025em, `--tracking-wide` .025em,
`--tracking-widest` .1em. Display sizes are set with arbitrary values
(`text-[1.75rem]`) rather than a custom scale, so the scale is deliberately
shallow and the page leans on weight and letterspacing instead.

The hero wordmark is not text at all: it is a bitmap glyph rendered as an SVG
mask filled with a three-tone vertical gradient, so it can be tinted per theme
via `--t-brand-mask` / `--brand-mask`.

## Layout

- Base unit `--spacing: .25rem` (4px), Tailwind default.
- Containers: `--container-xs` 20rem → `--container-sm` 24rem → `--container-md`
  28rem → `--container-xl` 36rem → `--container-2xl` 42rem → `--container-3xl`
  48rem → `--container-4xl` 56rem → `--container-6xl` 72rem. The page body is
  capped at `max-w-6xl` (72rem) with `px-4 sm:px-6`.
- Sections are `id`-anchored and separated by a 1px top border rather than by
  background change alone: `border-t border-border-subtle bg-bg-deep py-12 lg:py-24`.
  That doubling (border **and** `bg-deep`) is the sectioning primitive.
- Vertical rhythm is 48px mobile / 96px desktop per section band.
- Header rows are consistently: title block on the left (`h2` + one or two
  sentence description), an action cluster on the right (text link with arrow,
  then 40px icon buttons), then the content grid or rail below.
- Horizontal content uses a snap rail (`snap-x snap-mandatory`, `cursor-grab`,
  cards at `w-[42.5%]` mobile → 1/3 desktop) with explicit previous/next 40px
  buttons whose `disabled` state is part of the design.

## Elevation & Depth

| Level | Treatment |
| --- | --- |
| 0 | `{colors.canvas}` — page |
| 1 | `{colors.canvas-deep}` + `border-t border-border-subtle` — section band |
| 2 | `{colors.surface-1}` + `border border-border-strong` — buttons, popovers |
| 3 | `box-shadow: {colors... } --t-elevation` — 1px white ring at 7% |
| 3 hover | `--t-elevation-hover` — the same ring at 13% |

Depth is communicated by *border contrast*, not by shadow. Any implementation
that adds `box-shadow` blur has broken the system.

## Shapes

- Every radius token is `0px`. Cards, buttons, inputs, popovers, pills-as-rects:
  hard rectangles.
- `rounded-full` is reserved for avatars, the team face grid, and circular
  status chips.
- Media carries a 1px `--t-img-outline` ring rather than a radius.
- Ornament is square too: the dithered field is made of axis-aligned squares.
- The sub-pixel hairline uses `--pxr: calc(var(--pxc) * 50 / 51)` so a 2px
  rhythm can be drawn at 1/51 scale — a pixel-art trick, not a design token.

## Signature devices

These are the moves that make the page recognizably Omarchy. They are cheap to
reproduce and expensive to imitate convincingly.

1. **Dithered pixel field.** A bitmap cloud of squares in the `--t-field-*` ramp
   behind the hero, tinted to the active brand.
2. **Pixel bitmap wordmark.** SVG mask + gradient fill, theme-tinted, non-text.
3. **Sharp everything.** Zero radius on all containers and controls.
4. **1px ring elevation.** No shadows, ever.
5. **Mono-first typography.** Headlines, labels and buttons in JetBrains Mono.
6. **Terminal ornamentation.** `→` inline in links ("All meetups →"), ASCII-ish
   separators, and a `kybd`-style hint ("Press T, or tap here.").
7. **Random theme on first visit + persistent switcher.** Colour is a user
   preference with a sensible random default.
8. **Corner chrome.** A now-playing widget pinned bottom-left, a dismissible
   theme-switcher popover top-right, an announcement pill centered above the
   hero — the page edges are used, not left empty.
9. **"Etch" intro.** `<html class="etch-pending" data-etch-held>` holds paint
   until the first frame, then reveals — skipped entirely under
   `prefers-reduced-motion: reduce`.

## Page hierarchy

The homepage is a long single-page argument with `id`-anchored bands. Its
information architecture, top to bottom:

| Band | `id` | Role |
| --- | --- | --- |
| Hero | `#home` | `h1` + tagline + two CTAs + announcement pill |
| Install | `#about` | `h2` "We can fix everything" + `h4` install paths |
| Hardware | `#hardware` | `h2` "It runs on almost anything" + `h3` device classes |
| Plugins | `#plugins` | `h2` "A plugin for every dream…" + card grid of `h3`s |
| Agents | `#agents` | `h2` "The agentic OS for the age of agents" |
| Themes | `#themes` | `h2` "Pick a theme, change everything" + swatch grid |
| Developers | `#developers` | `h2` + editor/stack/terminal `h3`s |
| Gaming | `#gaming` | `h2` "All work and all play is all good" |
| Windows | `#windows` | `h2` "It even runs Windows!" |
| News | `#news` | `h2` "What's been happening" — latest items |
| Figures | `#figures` | `h2` "Momentum by the numbers" — stat row |
| Voices | `#voices` | `h2` "People love Omarchy" — testimonials |
| Teams | `#teams` | `h2` "It takes a village…" — avatar grid |
| Patrons | `#patrons` | `h2` "Backed by the oligarchy" — partner logos |
| Meetups | `#meetups` | `h2` "Share the love…" — snap rail of event cards |
| Community | `#community` | Discord / Meetups / Contribute / Donate cards |

Nav is four words — News, Manual, Plugins, Themes — then a right cluster of
icon links (community, language, RSS, GitHub) and the primary Install button.
The footer is a dense multi-column link map plus a 40-entry language selector
and the trademark line.

### The meetup card (reference for project cards)

The meetup band is the closest existing analogue to what MeperFolio wants for
projects, so its anatomy is recorded precisely:

- Band: `border-t border-border-subtle bg-bg-deep py-12 lg:py-24`.
- Header: `h2` (linked to `#meetups`, `text-inherit no-underline`) + a 15px
  `text-text-secondary` description with `[text-wrap:pretty]`, split so the
  second sentence starts a new block at `md:`.
- Header action: an underlined text link with a trailing arrow SVG before the
  prev/next pair, not after the grid.
- Rail: `<ul aria-label="Upcoming Omarchy meetups">` with
  `snap-x snap-mandatory`, gap-6, `cursor-grab`/`active:cursor-grabbing`,
  `motion-reduce:scroll-auto`.
- Card width: `w-[42.5%]` mobile → `sm:w-[calc((100%-3rem)/3)]` → `lg:` a
  further step. Cards are `li` with `data-slide` index and `snap-start`.
- Card body: event title as `h3`, then date and location in the muted ink tier.

The transferable pattern for MeperFolio: **event-card = logo/visual block +
title (`h3`) + two metadata lines in muted ink + brand accent on hover**, laid
out in a snap rail with explicit 40px prev/next controls.

## Do's and Don'ts

### Do

- Keep one accent. Every additional hue costs the system its identity.
- Use `border-t border-border-subtle` **plus** `bg-bg-deep` to start a band.
- Lift with 1px white-alpha rings at 7% / 13%.
- Set headlines and controls in mono, prose in sans.
- Square every container and control.
- Let the brand color appear on hover and focus before it appears at rest.
- Gate every motion behind `prefers-reduced-motion`.

### Don't

- Don't add `border-radius` to cards or buttons — the zero radius is the system.
- Don't add shadows, blurs or gradients as elevation.
- Don't introduce a second accent for "secondary" actions; use
  `{colors.surface-1}` with a `{colors.border-strong}` outline.
- Don't set body copy in mono at length; the mono voice is for headlines and
  controls, where it is short and loud.
- Don't use the brand as a large flat fill. `--t-brand-soft` at ~12% is the
  largest acceptable brand area besides the primary button.
- Don't hard-code a palette into a component; alias through tokens so the
  theme attribute keeps working.

## Responsive Behavior

- Breakpoints follow Tailwind defaults; the page uses `sm:` (640), `md:` (768),
  `lg:` (1024) as its real hinges.
- Nav collapses the four text links behind a menu button; the 100×100 wordmark
  mark stays.
- The rail's card width steps from `42.5%` → one third → one wider third.
- Descriptions that run long at mobile are split with `md:block` spans rather
  than being clamped.
- Section padding halves at mobile: `py-12 lg:py-24`.
- Touch targets are 40px (`size-10`) for icon buttons, `min-h-10` for text links.

## Applying this to MeperFolio

MeperFolio already shares the stack (Astro, static output, Tailwind v4, Geist
Variable, a `--token` custom-property layer, and a `DESIGN.md` in this same
format). What has to change to carry the Omarchy theme:

| Area | MeperFolio today | Omarchy-derived target |
| --- | --- | --- |
| Canvas | Linear near-black `#010102` + lavender `#5e6ad2` | theme `--t-bg` + a single brand accent |
| Radius | soft (`4–24px`, pills) | all container radii `0px`; `rounded-full` only for circles |
| Accent use | lavender on brand mark, focus, CTAs | one accent driving button, focus, link hover, ornament |
| Elevation | shadows / layered surfaces | 1px white-alpha rings at 7% / 13%, no blur |
| Headline face | Linear Display (sans) | JetBrains Mono Variable |
| Sectioning | surface change | `border-t` + `bg-deep` band |
| Motion | eased scroll, reveal | reveal gated on `prefers-reduced-motion` |
| Theme | fixed | token contract + `[data-theme]` + persisted switcher (the "plus") |

The theme switcher is the natural "plus que se acomode más": it is the one
Omarchy mechanic that makes the site feel alive on repeat visits, it costs one
token contract and one popover, and it does not disturb the hierarchy.

## Evidence and limitations

Captured 2026-10-14 with REA 6.5.0 over CDP against a dedicated headless
Chromium profile at 1440×813 and 430×932 (reported viewport 500×845).

Evidence used: CDP page inspection (`inspect_web_page`), two viewport
screenshots (`capture_web_screenshot`), the built stylesheet
`/_astro/page-seo.fIUHMMP-.css` (138 KB), and the server-rendered HTML.

Limitations:

- Computed styles were not sampled. Type sizes, weights and paddings are read
  from the built CSS and the template markup, not measured in the live layout.
- Component tokens are derived from Tailwind utility usage; they are faithful
  to class composition, not to a published design system.
- The dithered field's geometry is described from the rendering and the token
  names; no canvas/bitmap source was extracted.
- Only two of the 22 palettes were observed rendered. The reference values in
  the frontmatter are the `tokyo-night` block that sits in `:root`.

## Known Gaps

- The pixel-wordmark SVG mask source was located but not extracted; the hero
  glyph is decorative and would need a MeperFolio-specific mark anyway.
- `--t-partner-*` tokens (37signals, Basecamp, Cloudflare, Hey, sponsor marks)
  are named in the stylesheet but were not exercised on the homepage capture.
- The exact font-feature settings of `Geist Variable` in headings were not
  resolved from the built CSS.
