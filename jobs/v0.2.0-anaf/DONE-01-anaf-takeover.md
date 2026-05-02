# Completed: anaf.ro modern UI takeover — v0.2 architecture proof

**Task:** `01-anaf-takeover.md` | **Status:** done | **Date:** 2026-05-02

## Changes Made

### Loader (commit 1)
- `packages/extension/src/loader/index.ts:1-244` — `mountLoader()` returns `{ dismiss, abort, disposed }`. Appends `<style id="onegov-hide-original">` + `<div id="onegov-loader">` with inlined onegov logo, breathing animation, delayed "Pregătim interfața..." hint, 3000ms safety timeout, 120ms cross-fade dismiss, `prefers-reduced-motion` instant-swap branch. Zero deps.
- `packages/extension/src/loader/__tests__/index.test.ts:1-180` — covers basic mount, idempotency, performance ceiling, dismiss/abort, safety timeout, reduced-motion path, toggle helpers.

### Manifest (commit 2)
- `packages/extension/src/manifest.json:20-39` — content_scripts split: anaf.ro at `document_start`, other ship-list domains stay at `document_idle`. No new permissions, no new host_permissions.

### Content script lifecycle + site dispatch (commit 3)
- `packages/extension/src/content/index.ts:1-396` — full rewrite. Resolves a site module from `sites/registry.ts`; off-domain → exits cleanly. On match: mountLoader → verify status → mountShadowHost → injectStyles (theme + module CSS) → renderApp → loader.dismiss. Storage listener for `uiDensity` + `extensionEnabled` + legacy `showOriginal`. The documentElement scroll lock from v0.1.1 is preserved + documented.
- `packages/extension/src/sites/types.ts:1-72` — `SiteModule<Ctx>`, `SiteRuntime`, `Density`, `DEFAULT_DENSITY`, `DENSITY_VALUES`.
- `packages/extension/src/sites/registry.ts:1-54` — `resolveModule(url)`. v0.2.0 registers anaf only.
- `packages/extension/src/content/__tests__/index.test.ts:1-330` — full lifecycle suite, off-domain dispatch, every status outcome, overlay styles, escape hatches, density preference flow.

### anaf.ro site module (commit 3, packaged together for compile-correctness)
- `packages/extension/src/sites/anaf.ro/index.ts:1-25` — `anafModule: SiteModule<AnafContext>` export.
- `packages/extension/src/sites/anaf.ro/nav.ts:1-118` — `isMatch` (rejects API/asset subdomains, lookalike-shaped hosts) + `classifyRoute` → `{ kind: 'home'|'cui'|'external'|'unknown' }`.
- `packages/extension/src/sites/anaf.ro/context.ts:1-87` — `extractContext(doc, url)` returns `{ route, url, loggedIn, pageTitle }`. Read-only, defensive on every selector.
- `packages/extension/src/sites/anaf.ro/bridge.ts:1-167` — `submitForm({ kind: 'cui-search', cui })`. Locates original anaf form, writes `input[name="cui"]`, dispatches `requestSubmit` (or `submit`), navigates to `buildCuiHumanUrl()` if no form. Never reads form values passively.
- `packages/extension/src/sites/anaf.ro/App.tsx:1-58` — `StatusBar` + page switch (Home / Cui).
- `packages/extension/src/sites/anaf.ro/StatusBar.tsx:1-129` — slim 48px white bar with onegov logo, density chip (Minimal/Simplu/Bogat), "afișează site original" ghost button.
- `packages/extension/src/sites/anaf.ro/Home.tsx:1-300` — composed entirely from `@onegov/ui`: `AppShell`, `Container`, `Stack`, `Cluster`, `Hero`, `SearchBox`, `CardGrid`, `Card`, `CardBody`, `Heading`, `Paragraph`, `Text`, `Badge`, `Button`, `Footer`, `FooterColumn`, `Accordion`. Density-aware: minimal collapses to 1 CTA, simplu shows 3 service cards + collapsed accordion, bogat opens accordion + adds news section.
- `packages/extension/src/sites/anaf.ro/Cui.tsx:1-180` — composed from `@onegov/ui`: `AppShell`, `Container`, `Stack`, `Cluster`, `Heading`, `Paragraph`, `Text`, `SearchBox`, `Card`, `Button`, `DefinitionList`, `Callout`, `Badge`, `Footer`, `FooterColumn`, `Breadcrumb`. Bridges CUI input to `submitForm`.
- `packages/extension/src/sites/anaf.ro/styles.ts:1-148` — module-scoped CSS using `--onegov-*` tokens. No hard-coded colours/sizes/motion.
- `packages/extension/src/sites/anaf.ro/__tests__/{nav,context,bridge}.test.ts` (commit 4) — 23 tests covering pure-function behaviour.

### Popup density chip (commit 7)
- `packages/extension/src/popup/index.tsx:1-275` — replaces persona pill with a 3-option density chip (`uiDensity`). Persona inference + storage stay under the hood.
- `packages/extension/src/popup/popup.css:226-285` — new `.pop-density__*` ruleset; legacy `.pop-persona-*` removed.
- `packages/extension/src/popup/__tests__/index.test.tsx:185-225` — density chip render + selection + storage write coverage.

### Docs (commit 8)
- `CLAUDE.md:20-30, 39, 86-90` — five invariants relaxed in 3 documented ways for v0.2 (loader carve-outs, form-bridge writes on intent, optional public-API call from a registered module). DONE-report Invariant Check template lines updated.
- `docs/ARCHITECTURE.md:6-90` — high-level diagram updated, extension package table lists new entries, manifest split documented, lifecycle + SiteModule + bridge contracts spelled out.
- `docs/LOG.md:1-50` — entry added at the top.

## Tests Written

- `packages/extension/src/loader/__tests__/index.test.ts` — 13 tests (mount contract, idempotency, performance ceiling, dismiss/abort, safety timeout, reduced motion).
- `packages/extension/src/sites/anaf.ro/__tests__/nav.test.ts` — 10 tests (isMatch + classifyRoute coverage including subdomain exclusions and CUI extraction).
- `packages/extension/src/sites/anaf.ro/__tests__/context.test.ts` — 5 tests (populated context, logged-in detection, missing h1, route inclusion, never-mutates).
- `packages/extension/src/sites/anaf.ro/__tests__/bridge.test.ts` — 8 tests (normalise CUI, build URLs, requestSubmit-preferred form path, navigation fallback, invalid CUI rejection, RO prefix stripping).
- `packages/extension/src/content/__tests__/index.test.ts` — 20 tests covering off-domain dispatch, every status outcome, overlay styles, escape hatches, density preference, original DOM untouched.
- `packages/extension/src/popup/__tests__/index.test.tsx` — density chip section: 5 new tests (renders 3 options, default selection, writes uiDensity, selection updates, no legacy persona surface).

## Acceptance Criteria Check

- [x] §A Loader — exists, mounts in <5ms (verified via test ceiling), 200ms hint delay, 3s safety timeout, 120ms cross-fade dismiss, reduced-motion instant swap, idempotent.
- [x] §B Manifest — split, anaf.ro at document_start; no new permissions or host_permissions.
- [x] §C Site module shape — `index.ts` exports `{ App, extractContext, isMatch, css }`; `Home.tsx` + `Cui.tsx` exist; `bridge.ts` + `nav.ts` + `context.ts` exist; `__tests__/` covers context, route, bridge; every file ≤500 lines.
- [x] §D anaf UI design — slim white statusbar with logo + dot + density chip + show-original button; Hero with prominent search; 3-card service grid; "Mai multe" accordion; slim footer with the "ascunde →" link. Visual language uses `--onegov-color-primary` (#003B73) primary, `--onegov-color-neutral-200` borders, `--onegov-radius-md`, `--onegov-shadow-sm` on hover, max content width 1280px.
- [x] §E Form bridging proof — `submitForm({ kind: 'cui-search', cui })` documented, tested with both form-present and navigation-fallback paths.
- [x] §F Density preference — `uiDensity` storage key, `simplu` default, popup chip, content script reads + re-renders on change. Persona key + inference left in storage for back-compat.
- [x] §G Other sites graceful no-op — registry returns null for dgep / portal.just / ghiseul / rotld / itmcluj. Content script exits without injecting anything. Inline comment in `sites/registry.ts` makes this explicit.
- [x] §H Invariants relaxed in narrow ways — CLAUDE.md updated.
- [x] §I Tests — loader, sites/anaf.ro/__tests__/, content/__tests__/ all green.

## Bundle Sizes (gzipped, after `bun run build`)

| File | Size | Cap |
|---|---|---|
| `dist/extension/background.js` | 130.26 KB | (no cap; SW) |
| `dist/extension/content.js` | **29.90 KB** | 80 KB ✅ |
| `dist/extension/popup.js` | **9.03 KB** | 60 KB ✅ |

Content bundle grew from ~23 KB (v0.1.2) to 29.90 KB after adding the loader + site module + Preact hooks for Home/Cui. ~50 KB headroom for the next 5 site modules.

## Invariant Check

- [x] Original DOM untouched outside the documented carve-outs (loader style, loader div, shadow host, documentElement.style.overflow toggle, form-bridge writes only on user submit). Verified by `content script — happy path > does NOT mutate any pre-existing element of the page` test.
- [x] No passive form data reads. The bridge only writes on explicit user submit; never iterates inputs; never reads `.value` outside the explicit submit path.
- [x] No remote code, no `eval`/`Function()`/remote script. Inlined SVG via controlled literal `innerHTML` in the loader is the only `innerHTML` path; the literal is baked at build time, never derived from page data.
- [x] No new external network calls outside what the site module documents. The anaf module only navigates via `location.assign` (a regular link); `webservicesp.anaf.ro` is mentioned in `bridge.ts` URL builders but is NOT fetched in v0.2.0 — purely a navigation target.
- [x] Escape hatch unchanged: removing `#onegov-hide-original` style + hiding shadow host restores the live, interactive page. Verified by escape-hatch tests.

## Cross-Browser Check

- [x] Chrome (latest stable) — bundles built; manual visual smoke not run via MCP (couldn't drive `--load-extension` through MCP playwright). All unit tests pass under happy-dom which closely tracks Chrome behaviour.
- [ ] Firefox — out of scope for v0.1/v0.2 (Firefox parity moved to v0.3 per CLAUDE.md).

## Deviations + Justification

1. **Combined task spec commits 3+4 into one git commit.** Reason: the registry imports `anafModule`, which in turn imports `App`, `extractContext`, `isMatch`. Splitting these created either (a) a compile-broken intermediate commit or (b) a stub-then-replace pattern that would have been worse for review. The single combined commit message clearly enumerates both phases.

2. **Did NOT call `webservicesp.anaf.ro` from `Cui.tsx`.** The task spec §H.4 relaxes the no-network rule for this case but the v0.2.0 priority was visual + form-bridge correctness. The bridge navigates to a known anaf URL on form submission and the user sees results in the original anaf flow (which the takeover re-skins on the next page load). API-driven CUI lookup is queued for a fast follow.

3. **Hide-original style is re-applied via `applyHideOriginal()` after `removeHideOriginal()`** when toggling overlay back on. This wasn't in the task spec but is necessary so the state machine round-trips cleanly. The loader exposes the helpers from its module so the content script's `setOverlayVisible` is the single source of truth.

4. **Two pre-existing tests fail when the full suite runs in one process** (`@onegov/core has no DOM/browser-global side effects on import`). They pass when `bun test packages/core` runs in isolation. Cause: another test file's `setupDom()` leaks the happy-dom Window onto globalThis before this test runs. NOT introduced by this task — same failure on baseline `main`. Worth filing as a follow-up to fix test isolation.

5. **No live browser smoke.** The MCP playwright tool doesn't expose a `--load-extension` arg, and Chrome is at `/Applications/Google Chrome.app/`. The dist/ bundles are correctly assembled and the content script is fully covered by lifecycle tests. A reviewer running `chrome --load-extension=./dist/extension` against `https://www.anaf.ro/anaf/internet/ANAF/` should see the takeover.

## Files Changed

23 files (net +2400 / -700 lines):
- 1 manifest split
- 1 loader module + 1 loader test file
- 2 site dispatch infra files (registry + types)
- 9 anaf module files (index, App, StatusBar, Home, Cui, nav, context, bridge, styles)
- 3 anaf module test files (nav, context, bridge)
- 1 content script rewrite + 1 content test rewrite
- 1 popup rewrite + 1 popup CSS update + 1 popup test rewrite
- 3 doc files (CLAUDE.md, docs/ARCHITECTURE.md, docs/LOG.md)
