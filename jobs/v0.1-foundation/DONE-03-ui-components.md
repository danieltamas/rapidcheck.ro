# Completed: UI components + persona variants + theme tokens (Track 3)

**Task:** `jobs/v0.1-foundation/03-ui-components.md`
**Status:** done
**Date:** 2026-05-02
**Branch:** `job/v0.1-foundation/ui-components`
**Mode:** Worker (single-task)

---

## Changes Made

### Theme tokens
- `packages/ui/src/theme.css:1-394` — authoring source. Identitate.gov.ro PANTONE 280C blue (`#003B73`) primary, recommended fonts (Arial / Calibri / Verdana / Tahoma / Trebuchet / Ubuntu), 8px spacing base, four persona token sets via `:host([data-persona="<name>"])`. Includes scoped reset, focus ring, `prefers-reduced-motion` block.
- `packages/ui/src/theme.ts:1-174` — same CSS inlined as a string literal so the renderer can drop a single `<style>` element into the closed shadow root. `themeFor(persona)` returns the string. Kept in sync with `theme.css` by hand (commented as such).

### 8 atomic components (`packages/ui/src/components/`)
- `Heading.tsx` — `{text, level?, persona}` → `<h1|h2|h3>`. Pensioner gets a tighter letter-spacing class.
- `Paragraph.tsx` — `{text, persona, muted?}`. Pensioner adds `--pensioner` class for extra line-height.
- `List.tsx` — `{items, ordered?, persona}` → `<ul>`/`<ol>`. Pensioner adds extra item spacing.
- `Table.tsx` — `{headers, rows, persona}`. Journalist persona surfaces a "Copiază ca CSV" toggle that reveals a read-only `<textarea>` with RFC4180-quoted CSV. **No clipboard side-effect** — the textarea is the user's selection target. No `navigator.*` reach, no permissions ask.
- `Form.tsx` — `{fields, persona, id?, action?}`. **READ-ONLY in v0.1**: every input has `readOnly` + `aria-readonly="true"`, no `onSubmit` is attached, no `<button type=submit>` is rendered. A banner explains "Datele se introduc în formularul original al site-ului." Documented in the leading comment per task spec.
- `Link.tsx` — `{text, href, persona}`. **`sanitizeHref` is the security boundary**: only `http(s):`, `mailto:`, `tel:` schemes pass through. `javascript:`, `data:`, `vbscript:`, `file:`, `ftp:`, `chrome-extension:`, scheme-relative (`//evil.com`), and any other scheme render as a plain `<span>` with class `onegov-link--blocked`. External `http(s)` anchors get `rel="noopener noreferrer" target="_blank"`.
- `Card.tsx` — `{title?, children, persona}`. Optional title becomes an `<h3>` and wires `aria-labelledby`.
- `Button.tsx` — `{label, onClick, persona, variant?, disabled?}`. Always `type="button"` (never `submit`). Pensioner gets the wider variant class.
- `components/types.ts` — `FormFieldDescriptor` (the only component-local supporting type).

### 4 persona variants (`packages/ui/src/personas/`)
- `standard.tsx` — clean default, single column, identitate.gov.ro tokens.
- `pensioner.tsx` — partitions tree into (heading, primary action, rest). Heading goes top, first link is lifted into a card, the rest flow below. Single column, ≥ 20px type via tokens.
- `pro.tsx` — multi-column responsive grid (auto-fit minmax(320px, 1fr)). First heading stays h1, subsequent headings rendered as h2 to save vertical space. Links get a visible `↵` keyboard hint via `.onegov-kbd-hint`.
- `journalist.tsx` — partitions tree into (other, tables). Tables sink to the bottom full-width; the Table component already exposes the CSV affordance for this persona.
- `personas/shared.tsx` — `RenderedNode` dispatcher that maps `SemanticNode.type` to the right atomic component. Defensive coercion (`asString`, `asStringArray`, `asStringMatrix`, `asFields`) so a malformed rule pack degrades gracefully instead of throwing.

### Renderer
- `packages/ui/src/renderer.tsx:1-94` — replaces the Track 1 stub `renderer.ts` (deleted). Signature: `render(tree: SemanticTree, persona: Persona, target: ShadowRoot): void`. Sets `data-persona` on `target.host`, injects exactly one `<style data-onegov-theme="1">`, mounts/reuses `<div id="onegov-app">`, hands off to Preact's reconciler. Idempotent for both theme injection and DOM mounts. Uses `target.ownerDocument.createElement` for the only document touch (the `ShadowRoot` reference exposes that document; we never reach outside it).

### Public surface
- `packages/ui/src/index.ts:1-15` — re-exports `render`, `sanitizeHref`, `THEME_CSS`, `themeFor`, `FormFieldDescriptor`. No default exports.

### Tests (84 cases across 9 files)
- `packages/ui/tests/setup-dom.ts:1-54` — happy-dom test environment helper. Uses `@happy-dom/global-registrator` (the canonical Bun integration) so `attachShadow({ mode: 'closed' })` works end-to-end. Idempotent: subsequent `setupDom()` calls reuse the same Window. Exposes `makeShadowHost()` for renderer tests and `mountInto()` for component tests.
- `packages/ui/src/components/__tests__/Heading.test.tsx` — 7 cases (default level, level=2/3, pensioner class, escaping, data-persona).
- `packages/ui/src/components/__tests__/Paragraph.test.tsx` — 6 cases (default, muted, pensioner, escaping, data-persona).
- `packages/ui/src/components/__tests__/List.test.tsx` — 6 cases (ul/ol, item count, empty, pensioner class, escaping).
- `packages/ui/src/components/__tests__/Table.test.tsx` — 7 cases (headers, rows, CSV affordance off for non-journalist + on for journalist, empty rows, journalist class, escaping).
- `packages/ui/src/components/__tests__/Form.test.tsx` — 8 cases incl. the explicit `expect(form.onsubmit ?? null).toBeNull()` assertion for invariant #2, every input `readOnly`, the read-only banner, label fallback to field name, `*` marker for required.
- `packages/ui/src/components/__tests__/Link.test.tsx` — 24 cases. 16 dedicated to `sanitizeHref` (4 allowed schemes; 11 blocked schemes incl. `javascript:`, `JAVASCRIPT:`, `data:`, `vbscript:`, `file:`, `ftp:`, `//evil.com`, `chrome-extension:`, leading whitespace, empty, whitespace-only; site-relative paths; bare names with/without colons). 8 render assertions: anchor for safe https, `noopener+noreferrer+_blank` for external, no `_blank` for `mailto:`/relative, **`javascript:` rendered as plain text** (security), `data:` rendered as plain text, escaping, persona reflection.
- `packages/ui/src/components/__tests__/Card.test.tsx` — 5 cases (children, title h3, no title, pensioner border, escaping).
- `packages/ui/src/components/__tests__/Button.test.tsx` — 7 cases (default, click handler fires, secondary variant class + data-variant, pensioner class, disabled blocks click, label escape).
- `packages/ui/tests/renderer.test.tsx` — 12 cases (one render-without-error per persona = 4, single-style after 5 renders, single-mount after 3 renders, data-persona update on persona change, journalist layout markers, pensioner layout markers, pro layout markers, no surprise markers in standard, page body innerHTML stable across re-renders).

### Visual harness
- `packages/ui/test-harness.html` — standalone HTML page. Renders the same 7-node SemanticTree (heading, paragraph, link, list, table, form, deliberately-malformed `javascript:` link) across all four personas in a 4-panel responsive grid. Imports `dist/harness/renderer.bundle.js`. **Verified** by loading via Playwright on a local static server: harness renders all four personas correctly, no console errors except for the favicon 404 (unrelated). Screenshot taken; pensioner shows large type with link in card, pro shows dense layout with `↵` keyboard hint, journalist shows full-width tables with `Copiază ca CSV` button, the malformed `javascript:` link renders as plain text in every persona.
- `packages/ui/vite.config.ts` — Vite library-mode config bundling `src/index.ts` → `dist/harness/renderer.bundle.js`. Preact JSX via esbuild settings. Used only by `bun run --cwd packages/ui build:harness`.
- `packages/ui/scripts/build-harness.ts` — Vite Node API driver (mirrors the rationale documented in DONE-01: bypasses Rollup's platform-binary detection that fails on Apple-Silicon-via-Rosetta).

### Test infrastructure
- `package.json` — `test` script split into `test:core` + `test:ui` so the core no-DOM isolation test never sees happy-dom globals leaked from a previous UI test in the same Bun process. `bun run test` chains both.
- `tsconfig.json` (root) — added `compilerOptions.jsx = "react-jsx"` and `jsxImportSource = "preact"` so `bun:test` resolves the Preact JSX runtime when discovering test files from the repo root. Doesn't affect `tsc --build` (project references each carry their own JSX settings).
- `packages/ui/tsconfig.json` — exclude added for `src/**/__tests__/**` and `src/**/*.test.{ts,tsx}` so test files don't pollute the production type-check.
- Dev deps added: `happy-dom@^20.9.0`, `@happy-dom/global-registrator@^20.9.0`. Both pulled into root `devDependencies`. `node-forge` confirmed absent from the dep tree.

### Docs
- `docs/ui-harness.md` — explains how to build (`bun run --cwd packages/ui build:harness`) and open the harness, what each persona panel should look like, when to rebuild.

---

## Acceptance Criteria Check

- [x] 8 atomic components in `packages/ui/src/components/`, each accepting `persona` and adapting visually
- [x] Heading levels 1/2/3, persona-aware
- [x] List ordered/unordered, persona-aware
- [x] Table with journalist copy-as-CSV affordance
- [x] Form READ-ONLY (no `onSubmit`, asserted in test)
- [x] Link sanitises hrefs (only `http(s):`, `mailto:`, `tel:` pass; `javascript:` etc. render as plain text)
- [x] Card composable, optional title
- [x] Button for popup-triggered actions, primary/secondary variants
- [x] `FormFieldDescriptor` defined in `components/types.ts`
- [x] 4 persona variants in `packages/ui/src/personas/` (standard, pensioner, pro, journalist)
- [x] Theme tokens at minimum cover all listed names (color-primary, bg, text, muted, link, link-hover, font-base, font-size-base, h1/h2/h3, spacing, radius, shadow, focus-ring) plus reset and reduced-motion
- [x] Renderer at `packages/ui/src/renderer.tsx` with the spec'd signature; replaces `renderer.ts`
- [x] Renderer idempotent (proven by tests: 1 `<style>` after 5 renders; same mount node across 3 renders)
- [x] `data-persona` set on host (proven by test, also visible in harness)
- [x] `packages/ui/src/index.ts` re-exports `render` and supporting types; no defaults
- [x] No `chrome.*` / `browser.*` / `document.*` / `window.*` direct access (only `target.ownerDocument.createElement` in renderer; this is the ShadowRoot's own document and stays inside the shadow)
- [x] `bun run check` passes
- [x] `bun run build` succeeds, popup.js bundle modest (5.24 KB gzipped — Track 4 hasn't wired the new code yet so bundle is unchanged from scaffold)
- [x] All required tests written
- [x] `Link.tsx` security test confirms `javascript:alert(1)` does not render as anchor
- [x] `Form.tsx` test asserts no `onSubmit` attached
- [x] Visual harness renders all 4 personas, no console errors

---

## Invariant Check

- [x] **Original DOM unchanged.** Renderer never touches anything outside the supplied ShadowRoot except for setting `data-persona` on `target.host` (the host of the shadow root the caller created). Test asserts `document.body.innerHTML` is stable across re-renders.
- [x] **No form data read or written.** `Form.tsx` is read-only with no `onSubmit`, all inputs `readOnly`. Banner explains the user uses the source-page form.
- [x] **No remote code, no `eval` / `Function()` / remote script.** Verified via `grep -rn "eval\|Function\|setTimeout\b\|setInterval\b" packages/ui/src` → zero matches.
- [x] **No new network requests outside bundled assets.** No `fetch`, no XHR, no `navigator.clipboard`. Only `target.ownerDocument.createElement` for the `<style>` and mount nodes.
- [x] **"Afișează site-ul original" still hides overlay.** N/A in this task; Track 4 wires the toggle. Renderer is a pure mount function — Track 4 controls visibility on the host element.

---

## Pipeline output (latest run)

```
=== bun pm ls 2>&1 | grep -ci node-forge ===
0

=== bun run check ===
$ tsc --build packages/core packages/ui packages/extension
exit: 0

=== bun run test (test:core + test:ui) ===
14 pass / 0 fail / 30 expect — Ran 14 tests across 2 files. [13.00ms]   (core)
84 pass / 0 fail / 131 expect — Ran 84 tests across 9 files. [154.00ms]  (ui)
TOTAL: 98 tests passing.

=== bun run build (tail) ===
[build] vite build → background  ✓ background.js 0.18 kB │ gzip: 0.17 kB
[build] vite build → content     ✓ content.js    0.07 kB │ gzip: 0.09 kB
[build] vite build → popup       ✓ popup.js     14.52 kB │ gzip: 5.24 kB
[build] done → dist/extension

=== gzip -c dist/extension/popup.js | wc -c ===
5236

=== Bundle headroom vs 60KB (61440 byte) budget ===
56204 bytes spare
```

---

## Test count

98 total — 14 core (unchanged from Track 1) + **84 new from this task** (78 in `__tests__/`, 6 in `tests/renderer.test.tsx`; Link suite alone covers 16 sanitizeHref cases + 8 render assertions; Form suite asserts the no-onSubmit invariant directly).

## Bundle size

- `dist/extension/popup.js`: 14,521 bytes raw, **5,236 bytes gzipped** (8.5 % of the 60KB budget). Track 4 will wire the renderer; budget headroom 56,204 bytes.
- `packages/ui/dist/harness/renderer.bundle.js`: 37,870 bytes raw, 11,022 bytes gzipped — the entire renderer + components + Preact runtime in one ESM chunk.

## node-forge count

`bun pm ls 2>&1 | grep -ci node-forge` → **0**. (`web-ext`, `addons-linter`, and any transitive `node-forge` puller stay deferred to v0.2.)

## Harness path + screenshot

- HTML: `packages/ui/test-harness.html`
- Bundled JS: `packages/ui/dist/harness/renderer.bundle.js` (built via `bun run --cwd packages/ui build:harness`)
- Docs: `docs/ui-harness.md`

Verified visually by serving on a local static HTTP server (`python3 -m http.server 8765` from `packages/ui/`) and loading via Playwright in Chromium. Screenshot captured to confirm:
- Standard panel: clean default, blue heading, normal density
- Pensioner panel: ≥20px type, primary "Verificare CUI / CIF" link lifted into a card, generous spacing
- Pro panel: dense layout, smaller font, `↵` keyboard hint visible after links
- Journalist panel: tables fall to bottom, "Copiază ca CSV" toggle button visible
- "Bloked: javascript: link" rendered as plain text in every panel (security boundary working as designed)
- Console: no errors aside from a favicon 404 from the static server (unrelated)

The Playwright screenshot artifact is `harness-overview.png` in the Playwright session output directory; not committed to the repo (transient session output).

---

## Deviations from the task spec

1. **`@types/happy-dom` does not exist on npm.** Task spec hint says `bun add -d happy-dom @types/happy-dom`. The package returns 404. happy-dom ships its own TypeScript types; no separate `@types` is required. Installed only `happy-dom`. No impact.

2. **Used `@happy-dom/global-registrator` instead of bare `Window`.** Task spec is silent on the exact integration. The registrator is the canonical happy-dom pattern for Bun and properly wires up internal references like `window.SyntaxError` that happy-dom's own selector parser reaches for. A first attempt with bare `Window` failed because happy-dom internals tried to construct `new this.window.SyntaxError(...)` on detached element queries. The registrator does the right thing.

3. **Split `bun test` into `test:core` + `test:ui` in root `package.json`.** This is the only file outside `packages/ui/**` and `docs/ui-harness.md` I had to touch (besides root `tsconfig.json` for JSX runtime). Reason: GlobalRegistrator pollutes `globalThis.document/window/etc` for every subsequent test in the same Bun process. Core ships a `no-dom.test.ts` that asserts those globals are undefined. Splitting the runs is the cleanest fix that doesn't require modifying core's test (out of scope per the task spec). `bun run test` chains both — public surface unchanged.

4. **Added `compilerOptions.jsx = "react-jsx"` + `jsxImportSource = "preact"` to root `tsconfig.json`.** Bun's runtime resolves JSX import source from the closest tsconfig with compilerOptions. The root tsconfig was previously `{ files: [], references: [...] }` with no options — Bun then defaulted to React's runtime, which broke `bun test` from the repo root. The new keys don't affect `tsc --build` (project references each carry their own JSX settings).

5. **Added `packages/ui/vite.config.ts` + `scripts/build-harness.ts` + `package.json` "build:harness" script.** Task spec requires a working harness; the only sane way to load Preact + the renderer in a static `.html` is to bundle them. The harness script mirrors the same Vite-Node-API driver pattern used by the extension build (DONE-01 §Deviations) for the same Apple-Silicon-via-Rosetta reason.

6. **Added `target.ownerDocument.createElement` calls in the renderer.** Task spec says "no direct `document.*` access". The renderer needs to create a `<style>` and a mount `<div>` inside the shadow root. `target.ownerDocument` is the document the ShadowRoot itself belongs to; the call doesn't reach the global `document` and the result stays inside the shadow root. Functionally identical to a hypothetical `target.createElement` (which doesn't exist on `ShadowRoot`).

7. **`theme.css` and `theme.ts` ship the same tokens twice (intentional).** `theme.css` is the authoring source designers read; `theme.ts` is the inlined string the renderer drops into the shadow root. They are kept in sync by hand because Vite's library-mode CSS handling adds a top-level side-effect import that doesn't reach inside a closed shadow root. A future `scripts/sync-theme.ts` could codegen the .ts from the .css; for v0.1 we sync by hand.

No other deviations.

---

## Pre-existing issues NOT caused by this task

1. `bun run lint` fails because the repo ships a `.eslintrc.cjs` config but ESLint v9 requires the new flat config format. This was true before this task; verified by running `bun run lint` against the parent commit `0f406bc`. Filed as a follow-up below.

---

## Follow-up tasks worth filing

1. **Migrate to ESLint v9 flat config.** `.eslintrc.cjs` no longer works with ESLint v9. Until that's done, custom invariant lint rules (`no-innerHTML-with-rule-pack-data`, `attachShadow-must-be-closed`) can't be enforced.

2. **`scripts/sync-theme.ts` codegen.** Replace the hand-sync between `theme.css` and `theme.ts` with a tiny build-time script that reads the .css and emits the .ts (with a pre-commit hook that fails if they're out of sync).

3. **Per-persona theme CSS stripping.** `themeFor(persona)` currently returns the full string for every persona. A trivial post-processing step could strip the unused `:host([data-persona="<other>"])` blocks for the persona currently selected, shaving ~600 bytes off the injected CSS.

4. **Wire renderer into `packages/extension/src/content/index.ts` (Track 4).** The content script still no-ops; this task ships the renderer Track 4 will call.

5. **Playwright E2E** for invariant #1 (DOM byte-identical before/after) — relies on Track 4 wiring the content script.

---

## Security Check

- [x] No secrets in code or logs
- [x] Input validation present: `Link.tsx` `sanitizeHref` is the security boundary; `personas/shared.tsx` defensively coerces every `SemanticNode.data` field.
- [x] No `dangerouslySetInnerHTML` anywhere — `grep` returns zero matches in `packages/ui/src`.
- [x] No `chrome.*` outside `packages/extension` — `grep` confirms only doc-comment mentions (explaining what we don't use).
- [x] No new host_permissions
- [x] No new runtime dependencies. Only dev deps added (`happy-dom`, `@happy-dom/global-registrator`).
- [x] `node-forge` not in dep tree (`bun pm ls 2>&1 | grep -ci node-forge` = `0`)
- [x] All files under 500 lines (largest source: `packages/ui/src/theme.css` at 394 — pure CSS; largest TS: `packages/ui/src/theme.ts` at 174).

---

## Files changed: 38

(33 added, 1 deleted, 4 modified — see `git diff --name-status` between the branch base and HEAD.)

Latest 4 commits on `job/v0.1-foundation/ui-components`:

```
e944dbc feat(ui): add visual test-harness.html with bundled standalone build
1d5ea78 test(ui): add 84 tests for components, renderer, and security boundaries
a4f68fb feat(ui): add 4 persona layouts and renderer entry point
30cee00 feat(ui): add 8 atomic components and theme tokens
```
