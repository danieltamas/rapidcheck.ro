# Completed: Monorepo scaffold + core types (Track 1 — Foundation)

**Task:** `jobs/v0.1-foundation/01-monorepo-scaffold.md`
**Status:** done
**Date:** 2026-05-02
**Branch:** `job/v0.1-foundation/scaffold-monorepo`
**Mode:** Worker (single-task scaffold)

---

## Changes Made

### Root tooling
- `package.json:1` — Bun workspaces (`packages/*`), v0.1 dev-dep allow-list (no `web-ext`, no `addons-linter`, no `@types/firefox-webext-browser`), engines pin Bun ≥ 1.2 / Node ≥ 24. Scripts: `check`, `build`, `dev`, `validate-packs`, `test`, `lint`, `format`.
- `tsconfig.base.json:1` — strict everywhere, `noUncheckedIndexedAccess`, declaration maps, project-references-ready.
- `tsconfig.json:1` — root project-references manifest pointing at the three packages.
- `.prettierrc.json:1` / `.prettierignore:1` — 100-col, single-quote, trailing-comma.
- `.eslintrc.cjs:1` / `.eslintignore:1` — TypeScript recommended + cross-package boundary overrides forbidding `chrome.*` / `browser.*` in `packages/core` and `packages/ui`. Custom `eval` / `Function` / string-based-timer bans scaffolded; full `innerHTML` AST checks deferred to follow-up.

### `@onegov/core` (the unblocking event)
- `packages/core/src/types.ts:1-195` — **complete SPEC §5.1 type surface verbatim**: `VerifiedDomain`, `VerifiedDomainList`, `DomainStatus`, `Persona`, `RulePack`, `Route`, `PersonaOverride`, `ExtractRule`, `SerializableDoc`, `SerializableEl`, `SemanticTree`, `SemanticNode`. Every type carries its SPEC-pinned doc comment so downstream tracks can read the contract without grepping SPEC.md.
- `packages/core/src/index.ts:1` — barrel re-exports types and engine surface.
- `packages/core/src/{domain-verifier,lookalike,rule-pack-loader,semantic-extractor,persona}.ts` — typed stubs with safe defaults (`unknown` status, empty tree, identity persona, `null` lookalike, minimal validator that still rejects garbage). Each carries a TODO pointing at the owning Track 2 job.
- `packages/core/package.json:1` — runtime deps `psl`, `idna-uts46-hx`, `zod`. Dev dep `@types/psl`. Nothing else.
- `packages/core/tsconfig.json:1` — extends base, no DOM lib, `types: []` to keep the package DOM-free at the type level.

### `@onegov/ui`
- `packages/ui/package.json:1` — Preact + workspace dep on `@onegov/core`.
- `packages/ui/src/renderer.ts:1` — typed `render(tree, persona, target: ShadowRoot): void` stub. No-op; invariant 1 holds trivially because no shadow host is created until Track 3+4 land.
- `packages/ui/tsconfig.json:1` — extends base, includes DOM lib for `ShadowRoot`, JSX `react-jsx` with `jsxImportSource: 'preact'`, project reference to `@onegov/core`.

### `@onegov/extension` (the only chrome.* package)
- `packages/extension/src/manifest.json:1` — MV3, minimal permissions (`storage`, `scripting`, `activeTab`, `webNavigation`), `host_permissions` and `content_scripts.matches` pinned to the SITES_COVERAGE.md §8 v0.1 ship list (anaf, dgep, depabd legacy, portal.just, ghiseul, rotld, itmcluj). `web_accessible_resources` exposes only `rule-packs/*.json`. `browser_specific_settings.gecko` intentionally **omitted**.
- `packages/extension/src/background/index.ts:1` — ESM service worker. Stub registers `onInstalled` + idles; no fetch, no eval, no remote code.
- `packages/extension/src/content/index.ts:1` — IIFE content script. No-op stub; never appends a shadow host until Track 4.
- `packages/extension/src/popup/{popup.html,popup.css,index.tsx}` — Preact placeholder UI with one Romanian sentence (allowed in user-facing UI text per CLAUDE.md). Uses identitate.gov.ro PANTONE 280C blue token.
- `packages/extension/vite.config.ts:1` — three-target multi-entry config selected by `ONEGOV_TARGET` env var. Custom `onegov:copy-extension-assets` plugin copies manifest, popup HTML/CSS, and icons into `dist/extension/` idempotently (sandbox-tolerant: read+write fallback when `copyFileSync` EPERMs on overwrite).
- `packages/extension/tsconfig.json:1` — extends base, includes DOM, `types: ['chrome']`, project references to `core` + `ui`.
- `packages/extension/package.json:1` — workspace deps on `@onegov/core` + `@onegov/ui`, plus Preact.

### Scripts and rule-pack placeholder
- `scripts/build-extension.ts:1` — orchestrates the three Vite builds via the Vite Node API (driven by Bun, which uses the right native Rollup binary). Pre-clean step is fault-tolerant under sandboxes that block broad `rm -rf` on `dist/`.
- `scripts/validate-packs.ts:1` — JSON-parses every file in `rule-packs/`. Stub validator until Track 2 ships the Zod schema.
- `scripts/gen-placeholder-icons.ts:1` — writes 9 minimal-but-valid PNGs (gray/green/red × 16/32/48) so the manifest references resolve. Real brand-mark generator is a follow-up task.
- `rule-packs/_verified-domains.json:1` — empty roster placeholder so `bun run validate-packs` exits 0 before Track 5.

### Docs
- `docs/ARCHITECTURE.md:1` — covers the live state of the v0.1 scaffold, package responsibilities + engine status table, manifest posture, build pipeline, cross-package boundary table, named follow-ups.
- `docs/LOG.md:1` — opening 2026-05-02 entry; 4 follow-ups named.

### Tests written
- `packages/core/tests/types.test.ts` — 12 cases: constructs every public type, exercises every barrel re-export, verifies the engine stubs return their documented safe defaults.
- `packages/core/tests/no-dom.test.ts` — 2 cases: confirms `globalThis.document/window/chrome` are undefined before AND after importing the barrel; confirms the import does not throw (would fail if any module made a top-level reference to a missing browser global).

---

## Acceptance Criteria Check

- [x] Root `package.json` declares Bun workspaces: `packages/*`
- [x] `tsconfig.base.json` with strict mode + project references
- [x] Three workspace packages exist with their own `package.json` + `tsconfig.json`
  - [x] `@onegov/core` — pure TS, no DOM, no browser globals; deps only `psl`, `idna-uts46-hx`, `zod`
  - [x] `@onegov/ui` — depends on Preact + `@onegov/core`
  - [x] `@onegov/extension` — depends on `@onegov/core`, `@onegov/ui`; the only package allowed `chrome.*`
- [x] **`packages/core/src/types.ts` is complete** per SPEC §5.1 (all 12 types: `VerifiedDomain`, `VerifiedDomainList`, `DomainStatus`, `Persona`, `RulePack`, `Route`, `PersonaOverride`, `ExtractRule`, `SerializableDoc`, `SerializableEl`, `SemanticTree`, `SemanticNode`). All exported via `packages/core/src/index.ts` barrel.
- [x] Each package's `src/index.ts` exists; engine modules are well-typed stubs.
- [x] `packages/extension/vite.config.ts` configured for three entries (`background`, `content`, `popup`) outputting to root `dist/extension/`.
- [x] `packages/extension/src/manifest.json` matches SPEC §5.3 skeleton with v0.1 deviations: `browser_specific_settings.gecko` omitted; `host_permissions` and `content_scripts.matches` set from SITES_COVERAGE.md §8 ship list.
- [x] Root `package.json` scripts:
  - [x] `bun run check` — typechecks all packages
  - [x] `bun run build` — produces `dist/extension/`
  - [x] `bun run validate-packs` — exits 0 cleanly (passes on the placeholder roster)
- [x] `bun install` succeeds on a clean clone
- [x] `bun run check` succeeds (exit 0)
- [x] `bun run build` produces `dist/extension/manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js` (and `popup.css`, source maps, 9 placeholder icons)
- [⚠️] The unpacked `dist/extension/` loads in Chrome without error — **deferred to reviewer.** See "Chrome load status" below.
- [x] `.eslintrc.cjs` and `.prettierrc.json` committed at root
- [x] `scripts/validate-packs.ts` stub committed
- [x] `rule-packs/_verified-domains.json` placeholder committed
- [x] `docs/ARCHITECTURE.md` initialized with the architecture diagram from CLAUDE.md
- [x] `docs/LOG.md` initialized with one entry for this task

### Required tests
- [x] `packages/core/tests/types.test.ts` — type-level + runtime barrel test (12 cases)
- [x] `packages/core/tests/no-dom.test.ts` — DOM/browser-global isolation smoke (2 cases)
- [x] Root `bun test` passes (14 / 14, 30 expects, 15ms)

---

## Invariant Check

- [x] **Original DOM unchanged.** No content script mutation in v0.1 scaffold (content stub is a no-op IIFE that adds nothing to the DOM). Invariant 1 trivially holds.
- [x] **No form data read or written.** Nothing reads forms anywhere in the codebase yet.
- [x] **No remote code, no `eval` / `Function()` / remote script.** Confirmed via `Grep` for `\b(eval|Function|innerHTML)\b` across `packages/` — only documentation mentions, no actual usage.
- [x] **No new network requests outside bundled assets.** Only `chrome.runtime.onInstalled.addListener` is wired in the background. No `fetch`, no XHR.
- [x] **"Afișează site-ul original" still hides overlay.** N/A in v0.1 scaffold (no overlay yet); Track 4 wires the toggle.

---

## Chrome load status

**Browser load deferred to the reviewer.**

I attempted a headless Chrome smoke (`chrome --headless=new --load-extension=dist/extension/`) but Chrome stable on macOS refuses unsigned extensions in headless mode — stderr line:

```
WARNING:chrome/browser/extensions/extension_service.cc:416] --load-extension is not allowed in Google Chrome, ignoring.
```

The interactive `chrome://extensions → Load unpacked` flow requires a UI session that the worker harness cannot drive. Static manifest validation is clean, however:

- `manifest_version: 3` ✓
- `permissions` exactly the minimal allowed set: `["storage", "scripting", "activeTab", "webNavigation"]` ✓
- `host_permissions` exactly 7 entries matching SITES_COVERAGE.md §8 ✓
- `browser_specific_settings.gecko` absent ✓
- All referenced files exist in `dist/extension/`: `background.js`, `content.js`, `popup.html`, `popup.js`, `popup.css`, `icons/{gray,green,red}-{16,32,48}.png` ✓

Reviewer should run: `chrome://extensions → Developer mode → Load unpacked → select <repo>/dist/extension/`. Service worker console (Inspect views: service worker) should show one info line: `[onegov] background installed (v0.1 scaffold — Track 4 not yet wired)`. No errors, no warnings beyond Chrome's own.

---

## Pipeline output (latest run)

```
=== bun run check ===
$ tsc --build packages/core packages/ui packages/extension
exit: 0

=== bun test ===
 14 pass
 0 fail
 30 expect() calls
Ran 14 tests across 2 files. [15.00ms]

=== bun run validate-packs ===
[validate-packs] OK — 1 file(s) checked

=== bun run build (tail) ===
[build] vite build → background  ✓ built in 36ms (background.js 0.18 kB)
[build] vite build → content     ✓ built in 9ms  (content.js 0.07 kB)
[build] vite build → popup       ✓ built in 51ms (popup.js 14.52 kB / 5.24 kB gzipped)
[build] done → dist/extension

=== bun pm ls 2>&1 | grep -ci node-forge ===
0
```

Bundle sizes are well under the 80KB content.js gzipped budget (will tighten in later tracks).

---

## Deviations from the task spec

1. **Vite Node API rather than CLI for the build orchestrator.** Task spec is silent on how to drive Vite; I tried `bunx vite build` first and hit a Node/Rosetta + Rollup native-binary mismatch on this Apple-Silicon-via-Rosetta box. Switching `scripts/build-extension.ts` to `import { build } from 'vite'` and running it directly under Bun avoids the Node arch detection issue entirely. No effect on output.

2. **Added `scripts/gen-placeholder-icons.ts` (9 PNGs) up-front.** The task spec lists icon generation as a follow-up. I shipped a minimal placeholder generator + the 9 PNGs anyway, because:
   - The manifest references `icons/gray-{16,32,48}.png` and Chrome logs `Could not load icon` warnings without them, which would muddy the reviewer's "no console errors" check.
   - The placeholder script is ~110 lines, isolated in `scripts/`, and trivial to delete when the real `gen-icons.ts` arrives.
   - The PNGs are flat-colour 8-bit RGB, generated programmatically — no external dependency, no design work claimed.
   The full follow-up still stands: rasterise an SVG source into the proper brand marks.

3. **Added `scripts/build-extension.ts` cleanup is fault-tolerant.** The worker harness runs in a sandbox that blocks `rm -rf` on broad paths (it caught my pre-clean of `dist/extension/icons`). I made the pre-clean tolerant: any file that can't be removed is logged and skipped. Vite then overwrites its own outputs and the asset-copy step is idempotent. On a normal dev box the pre-clean works fine; the warning never appears.

4. **`scripts/validate-packs.ts` is a JSON-parse-only stub.** Task spec says "may be a no-op stub for now since no packs exist yet, but must exit 0 cleanly." I did slightly more than the minimum — actually JSON-parse the placeholder file — so a malformed file in `rule-packs/` fails the build immediately even before the real Zod schema lands.

No other deviations.

---

## Security Check

- [x] No secrets in code or logs
- [x] Input validation: N/A in scaffold (no inputs accepted yet)
- [x] No `eval` / `Function()` / `innerHTML` with rule-pack data
- [x] No `chrome.*` outside `packages/extension`
- [x] No new host_permissions beyond the SITES_COVERAGE.md §8 v0.1 ship list
- [x] No new runtime dependencies beyond the v0.1 allow-list (`preact`, `psl`, `idna-uts46-hx`, `zod`)
- [x] `node-forge` not in the dep tree (`bun pm ls 2>&1 | grep -ci node-forge` = `0`)
- [x] `web-ext` / `addons-linter` not in the dep tree
- [x] All files under 500 lines (largest source: `packages/extension/vite.config.ts` at 198)

---

## Follow-up tasks worth filing

The orchestrator should consider creating these as separate jobs:

1. **`02-invariant-lint-rules.md`** — full custom ESLint rules: AST checks for `innerHTML` with rule-pack data, `chrome.runtime.connect` outside background, `MutationObserver` outside content script, `attachShadow` with `mode: 'open'`. The current `.eslintrc.cjs` has the easy wins (eval/Function/string timers/cross-package globals); the deeper checks need a custom plugin.

2. **`03-icon-generation.md`** — replace `scripts/gen-placeholder-icons.ts` with `scripts/gen-icons.ts` rasterising an SVG source (identitate.gov.ro PANTONE 280C blue + green/gray/red state badges) at 16/32/48 px.

3. **`04-package-script.md`** — `scripts/package.ts` producing `dist/onegov-chrome.zip` for the Web Store. Bundle-size assertion (`content.js.gz ≤ 80KB`, total ≤ 2MB) belongs here too.

4. **`05-playwright-e2e-bootstrap.md`** — Playwright Chromium project, fixtures for the unpacked extension, the DOM-integrity test, and the network-audit test from TESTING.md. Firefox project explicitly deferred.

5. **`v0.2/firefox-parity.md`** — re-introduce `browser_specific_settings.gecko`, `web-ext` dev loop, `addons-linter` in CI, Playwright Firefox project, `.xpi` packaging. AV-exclusion guidance for `node-forge/flash/SocketPool.swf`.

6. **`tracks-2-3-4-5/`** — implementations of the four spec'd tracks (core engine logic, UI components/personas/theme, full extension shell wiring, six rule packs + verified roster). The scaffold is unblocked, so these can be filed and parallelised now.

---

## Files changed: 47

(8 root config + 11 core + 4 ui + 9 extension + 4 scripts + 1 rule-pack + 2 docs + 8 dist artifacts that are gitignored — gitignored ones not counted; commits show 47 tracked files added across 6 commits.)

Latest 6 commits on this branch:

```
0142760 docs: initialize ARCHITECTURE.md and LOG.md
ffd9907 feat(scripts): add build orchestrator, pack validator, placeholder icons
2bc8d63 feat(extension): scaffold @onegov/extension MV3 manifest + Vite build
830abf8 feat(ui): scaffold @onegov/ui with stub renderer
5c5cdb3 feat(core): scaffold @onegov/core with complete SPEC §5.1 type contract
fbcb33b chore: scaffold Bun workspaces monorepo root
```
