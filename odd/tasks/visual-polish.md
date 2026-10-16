---
objective: Seven visual/content corrections to the portfolio: bigger project cover art, uniform project cards, BrokerApp on projects page 1, the Look'n'Feel plugin card, a marketplace redirect on plugin cards, a better narrow-width control cluster, and a CV preview that opens with the pages panel.
branch: fix/visual-polish (from origin/main @ 58cebbd)
delivery: ask-on-risk (single PR expected: forecast under 400 authored changed lines)
runner: vitest (npm test) + npx astro check + npm run build; rendered checks in tests/visual.test.ts need /usr/bin/chromium
---

## Specs

S1 — The project cover logo reads bigger inside its box.
Quote: "muestrame el logo mas grande, se pierde en el centro. Que no quede estirada, pero lo suficiente hasta done de para que ocuep mas espacio, con un centrado coherente"
Acceptance: the cover icon renders at 76% of the cover box height, keeps its own aspect ratio (never stretched), and stays centred in the box. Measured in a real browser: rendered image height / cover height >= 0.7, rendered aspect ratio equals the file's natural aspect ratio, and the left/right and top/bottom margins match within 1px.

S2 — Every project card has the same size.
Quote: "INtenta hacer algo para que los componentes de cards siempre tengan el mismo tamaño"
Acceptance: within one project page all four cards render the same height (<= 1px difference), the two covers of a row share the same top and the same height, and the tag list reserves two rows so a one-row stack no longer shortens its card. Measured in a real browser.

S3 — BrokerApp replaces VidMetrics Pulse on projects page 1.
Quote: "En la pagina 1 de projects esta vidmetrics, cambialo por brokerapp"
Acceptance: page 1 is MeperSoft, Meper-Pos, MeperBoard, BrokerApp; page 2 is Personal Portfolio, VidMetrics Pulse. Identical order in `es` and `en`.

S4 — The Look'n'Feel plugin is published on the plug-ins section.
Quote: "falta añdir un plugin el de look'n'feel"
Acceptance: a third plugin card exists in both locales with the data the marketplace and the plugin's own manifest carry: id `meperdonas.looknfeel`, title `Look'n'Feel`, version `1.1.0`, kind `bar-widget`, license MIT, repo `https://github.com/MeperDonas/omarchy-looknfeel`, preview `/plugins/looknfeel.webp` (a square cover with no white tile corners).

S5 — A plugin card redirects to its own marketplace page.
Quote: "Las cards de plugins siguen sin tener la redireccion a la pagina de marketplace de plugins de oamrchy donde estan"
Acceptance: each plugin entry carries `marketplace: https://plugins.omarchy.org/plugin.html?id=<its own id>` and the shared card modal renders a `Marketplace` action with that href (never nested inside the card button, which must stay the only modal trigger). Every marketplace URL resolves in the marketplace catalog (`catalog.json`, checked 2026-10-16) and the id in the URL equals the entry's own `id`.

S6 — At reduced width the control cluster sits better against the edge.
Quote: "haz que cunado se reduce el ancho quede mejor sobre el borde hacia arriba"
Acceptance: below `lg` the cluster is raised from 16px to 24px off the bottom and aligned to the content gutter (`right-6`) instead of the viewport corner; `lg` keeps the top-right placement. Measured in a real browser at 390px: the gap to the viewport bottom and to the right edge is 24px.

S7 — The CV preview opens with the pages panel.
Quote: "que la forma predetermiada de mostrarla sea con el administrados de paginas culto"
Acceptance: both CV iframes load `<cv>#pagemode=thumbs&navpanes=1&view=FitH`, and a real-browser render of that URL shows the viewer's pages/thumbnails panel open by default. If the engine in use ignores the fragment, that is reported as the actual result instead of claimed.

S8 — Plugin versions match the published marketplace data. Assumption, not asked for: the owner's ask is a truthful plugins section, and two of the three cards currently publish an older version than the marketplace and their own manifests. Flagged in the report; revertable on its own.
Acceptance: `devstack` shows `1.10.4` and `Work connection` shows `1.2.0`, each equal to its manifest and to its `catalog.json` entry.

## Tasks

T1 (S1) Projects: cover icon from 58% to 76% of the box, aspect preserved — inline — done, `19320bf`. Measured: art 126x126 inside a 251x168 cover (share 0.751), margins 63/63 horizontally and 21/21 vertically.
T2 (S2) Projects: `h-full` card column, 60px two-row chip gutter, one-line title, 46px description floor — inline — done, `19320bf`. Measured: all four cards 338px high on the first page.
T3 (S3) Content: swap the numeric prefixes of `03-vidmetrics` and `05-brokerapp` in `es` and `en` — inline — done, `19320bf`. Rendered order: MeperSoft, Meper-Pos, MeperBoard, BrokerApp; page 2: Personal Portfolio, VidMetrics Pulse.
T4 (S4) Content + asset: `content/plugins/{es,en}/03-looknfeel.md` and `public/plugins/looknfeel.webp` — inline — done, `19320bf`. Cover is an 80% centred crop of the plugin's own logo; no white tile corners.
T5 (S5) Marketplace redirect: `marketplace` in `pluginsSchema`, plugin content, `data-card-marketplace` on the plugin cards, the modal action and its app.ts wiring — inline — done, `19320bf`. `tests/assets.test.ts` now fails if any entry's URL stops carrying its own manifest id.
T6 (S6) Cluster: `bottom-6 right-6` below lg, the structural tripwire updated, and a measured assertion at 390px — inline — done, `19320bf`. Measured at 390x844: right gap 24, bottom gap 24.
T7 (S7) CV preview: `#pagemode=thumbs&navpanes=1&view=FitH` on both iframes — inline — done, `19320bf`. Verified in a headless Chromium render: the viewer opens with its pages panel showing the thumbnails.
T8 (S8) Content: refresh the two stale plugin versions — inline — done, `19320bf`. The plugins section now shows 1.10.4 / 1.2.0 / 1.1.0.
T9 (S1/S2/S6/S7) Rendered checks in `tests/visual.test.ts`, structural tripwires in `tests/structure.test.ts`, content integrity in `tests/assets.test.ts` — inline — done, `19320bf`. Suite 66/66, `astro check` 0 errors, `tsc --noEmit` exit 0, `astro build` exit 0.
T10 Defect found while writing T9: the card entrance animation never resolved (`.js [data-reveal].reveal-card` tied on specificity with `.is-visible` and, being later, won), leaving every project and plugin card permanently at `scale(0.97)` and 38px below its grid cell — inline — done, `19320bf`. Fixed with `:not(.is-visible)`; the rendered test now waits for `transform: none`, so it pins the fix.

## Log

L1 (verbatim, owner):
> Cambios visuales si:
> 1. [Image 1] muestrame el logo mas grande, se pierde en el centro. Que no quede estirada, pero lo suficiente hasta done de para que ocuep mas espacio, con un centrado coherente
> 2. [Image 2]  INtenta hacer algo para que los componentes de cards siempre tengan el mismo tamaño
> 3. En la pagina 1 de projects esta vidmetrics, cambialo por brokerapp
> 4. [Image 3] falta añdir un plugin el de look'n'feel
> 5. Las cards de plugins siguen sin tener la redireccion a la pagina de marketplace de plugins de oamrchy donde estan
> 6. [Image 4] haz que cunado se reduce el ancho quede mejor sobre el borde hacia arriba [Image 5]
> 7. [Image 6] que la forma predetermiada de mostrarla sea con el administrados de paginas culto

L2 — Reading of each image, since the screenshots do not survive a compaction: 1 = projects grid, mascot tiles small inside their boxes; 2 = same grid in a light palette, cards in one row of different heights; 3 = plugins section with devstack and Work connection and no external link; 4 = control cluster at the bottom-right under a hairline; 5 = narrow viewport with the same cluster jammed in the corner, covering the reading column; 6 = the CV modal with the PDF viewer's pages panel open by hand.

L3 — Evidence gathered before planning: `plugins.omarchy.org/catalog.json` (5606 entries, fetched 2026-10-16) is the marketplace's own data and lists all three plugins, verified, with versions 1.10.4 / 1.2.0 / 1.1.0 — so the per-plugin page format is `https://plugins.omarchy.org/plugin.html?id=<id>` and the two older cards were publishing stale versions. Earlier sessions could not confirm this format (`/plugins/<id>` 404s); the catalog settles it.

L4 — Asset decision: the plugin covers are square close-ups of the plugin's `assets/logo.png`, cropped to lose the white tile corners (the class of bug from PRs #9 and #10). Each plugin logo is 512x512, so the Look'n'Feel cover is an 80% centred crop of `meperdonas.looknfeel/assets/logo.png`, resized to 512x512 webp to match `devstack.webp` and `work-connection.webp`.

L5 — Item 6 needed a reading, not a guess: the cluster is `fixed bottom-4 right-4` below `lg` (16px from the viewport corner) and `lg:top-6 lg:right-6` above it. "sobre el borde hacia arriba" is read as: raise it and align it with the content gutter, so it stops sitting in the corner; the rendered before/after at 390px goes to the owner with the report.

L6 — Route: seven corrections that share `Projects.astro`, `Plugins.astro`, `index.astro`, `global.css` and the content collections. Shared edit surfaces rule out parallel writers, and nothing here needs a writer for size, so the whole feature is written inline, per task.

L7 — Verification (2026-10-16): `npm test` 66/66 (the rendered suite included, from 6 before), `npx astro check` 0 errors / 6 pre-existing deprecation hints, `npx tsc --noEmit` exit 0, `npm run build` exit 0. Rendered evidence gathered with a throwaway puppeteer script outside the repo: card geometry, cluster gaps, the CV modal and the plugin rows, all photographed before reporting.

L8 — Differential check on the one code path the request did not ask to change: `Plugins.astro` used to map `data-card-repo={url ?? repo}` and `data-card-site={url ? repo : ''}`; it now maps repo and site to their own fields and marketplace separately. No plugin entry has ever defined `url` (`grep -c '^url:'` over `content/plugins/**` is 0, before and after), so the two existing cards ship the same payload as before. Everything else that changed is the requested difference.

L9 — Extra beyond the ask, flagged for the owner: S8 (the two stale plugin versions) is a factual correction, not a request, and it is the only part of this commit the owner did not ask for. Reverting it is one field per file.

L10 — Open with the owner: S6's reading. The cluster is now 24px off the floor and 24px off the right edge below `lg`, which is the content gutter; if "sobre el borde hacia arriba" meant higher still, that is one class on the cluster div. Pushing the branch and opening the PR stay the owner's decisions.
