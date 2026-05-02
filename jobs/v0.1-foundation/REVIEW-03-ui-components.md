# Review: UI components + persona variants + theme tokens (Track 3)

**Task:** `jobs/v0.1-foundation/03-ui-components.md`
**Reviewer verdict:** PASS
**Date:** 2026-05-02
**Branch under review:** `job/v0.1-foundation/ui-components` (worker tip `d7a250e`, rebased onto `main` `126fa0a` for testing)

---

## Rebase result

**Clean.** No conflicts, automatic.

The worker branched off `0f406bc` before Tracks 2, 2-fixup, 5, and 5-followup landed. I rebased the 5 Track 3 commits onto current `main` (`126fa0a docs(log): record Track 5 merge + _comment schema patch`):

```
git rebase main
Rebasing (1/5)...(5/5)Successfully rebased and updated refs/heads/ui-components-rebase-test.
```

Five commits replayed cleanly. No textual conflicts because Track 3 lives entirely in `packages/ui/**` plus root `package.json` / `tsconfig.json` / `bun.lock` / `docs/ui-harness.md` / the DONE report. Track 5 only touched `packages/core/**` and `rule-packs/**`. Track 2-fixup only touched `packages/core/src/lookalike.ts`. **Zero file overlap with Track 3 sources.**

Rebased file inventory (38 files):
- 8 atomic components + 8 component test files + 1 component types
- 4 persona layouts + 1 shared dispatcher
- `renderer.tsx` (replaces deleted `renderer.ts`)
- `theme.ts` + `theme.css`
- `index.ts` (barrel)
- 1 renderer test + 1 setup-dom helper
- `vite.config.ts`, `scripts/build-harness.ts`, `test-harness.html`
- `docs/ui-harness.md`
- root `package.json`, `tsconfig.json`, `bun.lock` (test split + JSX runtime + new dev deps)
- `packages/ui/package.json`, `packages/ui/tsconfig.json` (build:harness script + test exclusions)
- `DONE-03-ui-components.md`

Worker's worktree (`agent-a48a9751`) verified clean: `git status --porcelain` returns empty.

---

## Tests

- [x] **All tests pass** — 113 core + 84 UI = **197 total**, 324 expect() calls
  - `bun run test:core` → 113 pass / 0 fail / 193 expects across 7 files (84ms)
  - `bun run test:ui` → 84 pass / 0 fail / 131 expects across 9 files (164ms)
  - Note: core test count rose from 110 → 113 because Track 5's `_comment` patch added 3 new core tests after Track 3 was branched. All pass on the rebased branch.
- [x] **Type check clean** — `bun run check` → `tsc --build packages/core packages/ui packages/extension` exit 0
- [x] **Validate-packs unaffected** — `bun run validate-packs` → "OK — 7 file(s) checked" (Track 5's six new packs + verified-domains)
- [x] **Build clean** — `bun run build` produces `dist/extension/{background,content,popup}.js + popup.html + popup.css + manifest.json + icons/`

### Test split rationale (verified)

The worker added `bun run test:core` + `bun run test:ui` and chained them through `bun run test`. I verified the rationale by running `bun test packages` (single Bun process, no split):

```
192 pass / 2 fail
(fail) @onegov/core has no DOM/browser-global side effects on import > imports cleanly without referencing document/window/chrome
(fail) @onegov/core has no DOM/browser-global side effects on import > still has no DOM globals after import
```

Confirmed: `@happy-dom/global-registrator` permanently pollutes `globalThis.document/window/etc`, breaking core's `no-dom.test.ts` if both suites run in the same Bun process. Read `packages/core/tests/no-dom.test.ts` — it asserts `globalThis['document'] === undefined`. The split is justified and preserves the no-DOM invariant for core. Worker's choice not to modify the core test (out of scope) is correct.

### Bundle-size budget

```
dist/extension/popup.js                    14,521 bytes raw
dist/extension/popup.js (gzipped)           5,236 bytes  ← 8.5% of 60KB budget
Bundle headroom vs 60KB cap                56,204 bytes
```

- [x] **Well within 60KB gzipped cap** — Track 4 will wire the renderer into the content script; the popup bundle hasn't grown because Track 3 doesn't ship into popup yet. Adequate headroom remains.
- Worker also reports `packages/ui/dist/harness/renderer.bundle.js` at 11,022 bytes gzipped (full renderer + components + Preact). I rebuilt and confirmed (`37,870 raw / 11,022 gzip`). This is the harness-only bundle, not part of any extension entry.

### node-forge

```
bun pm ls 2>&1 | grep -ci node-forge
0
```

---

## Five Invariants (UI scope)

- [x] **#1 Original DOM never mutated.** `packages/ui/src/**` operates only on the `ShadowRoot` it's given. The renderer sets ONE attribute on the host element (`data-persona`) — the host belongs to the caller (content script) and is the documented mount target, not page content. The "page DOM stable across re-renders" assertion in `tests/renderer.test.tsx:129` proves it.
- [x] **#2 No form data.** `Form.tsx` has no `onSubmit`. Every input is `readOnly` + `aria-readonly`. No `<button type=submit>`. A read-only banner explains the user uses the source form. Test at `Form.test.tsx:53` asserts `(form as { onsubmit: unknown }).onsubmit ?? null === null`. Verified `grep -rn "onSubmit" packages/ui/src` returns zero matches in source (two in test files, both for negative assertion).
- [x] **#3 No remote code.** `grep -rn -E "\beval\b|new Function|innerHTML\s*=|outerHTML\s*=|document\.write|dangerouslySetInnerHTML" packages/ui/src/` returns **zero matches**. All text reaches the DOM via Preact JSX (escaped). The renderer uses `style.textContent = themeFor(persona)` — `textContent` does NOT parse HTML.
- [x] **#4 No external network.** `grep -rn -E "fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource"` returns **zero matches** in `packages/ui/src/`. Table component explicitly does not call `navigator.clipboard` (CSV is rendered to a hidden `<textarea>` for selection instead).
- [x] **#5 Escape hatch.** Out of scope for Track 3 (Track 4 wires the toggle); the renderer is a pure mount function. Verified by reading the renderer — it doesn't lock in any visibility state.

---

## Cross-Package Boundary

- [x] **No `chrome.*` / `browser.*` outside extension.** `grep -rn -E "\bchrome\.|\bbrowser\."` in `packages/ui/src/` returns only doc-comment mentions (`renderer.tsx:15` says "no chrome.*"). No actual code references.
- [x] **No direct `document.*` / `window.*` outside what the ShadowRoot exposes.** `grep` finds two doc-comment references (`renderer.tsx:15`, `Table.tsx:6`). The renderer uses `target.ownerDocument.createElement` for the `<style>` and mount `<div>` — `target.ownerDocument` is the document the ShadowRoot itself belongs to; the result stays inside the shadow root. This is the documented and only escape from "operate on what you're given" — and the worker called it out in their deviation list. Acceptable.
- [x] **`packages/core` remains DOM-free.** The `no-dom.test.ts` (run separately as `test:core`) still passes.
- [x] **Track 3 made ZERO modifications to `packages/core/**`.** `git log main..HEAD --diff-filter=AMD --name-only -- packages/core/` returns no Track 3 commits.

---

## `Link.tsx` Security Boundary (CRITICAL)

I exercised `sanitizeHref` directly via Bun against all schemes the orchestrator listed. **22/22 pass.** None of the malicious schemes survived; all the safe schemes worked. Strategy: scheme allowlist (`http:`/`https:`/`mailto:`/`tel:`), regex-extracts the lowercase scheme and rejects anything that doesn't match — so `javascript:%2F%2F` is rejected at the `javascript:` recognition step before any URL decoding happens. URL-encoded payloads inside an allowed scheme would not be a concern because the scheme itself is the gating decision.

| Input | Expected | Got | Notes |
| --- | --- | --- | --- |
| `javascript:alert(1)` | BLOCK | BLOCK | scheme rejected |
| `JAVASCRIPT:alert(1)` | BLOCK | BLOCK | case-insensitive scheme match |
| `jaVaScrIpt:alert(1)` | BLOCK | BLOCK | mixed-case |
| `data:text/html,<script>` | BLOCK | BLOCK | |
| `vbscript:msgbox` | BLOCK | BLOCK | |
| `file:///etc/passwd` | BLOCK | BLOCK | |
| `chrome-extension://abc` | BLOCK | BLOCK | |
| `ftp://example.com` | BLOCK | BLOCK | |
| `javascript:%2F%2F` | BLOCK | BLOCK | URL-encoded payload after `:` doesn't matter — scheme is `javascript:`, rejected |
| `//evil.com` | BLOCK | BLOCK | scheme-relative explicitly rejected |
| ` javascript:alert(1)` (leading space) | BLOCK | BLOCK | trimmed first, then scheme test |
| `page:foo` (random colon) | BLOCK | BLOCK | colon-bearing non-scheme rejected |
| `` (empty) | BLOCK | BLOCK | trimmed → empty |
| `   ` (whitespace) | BLOCK | BLOCK | trimmed → empty |
| `http://example.com` | ALLOW | ALLOW | normalised via `new URL()` |
| `https://example.com` | ALLOW | ALLOW | normalised via `new URL()` |
| `mailto:test@example.com` | ALLOW | ALLOW | accepted verbatim after scheme |
| `tel:+40123456789` | ALLOW | ALLOW | accepted verbatim after scheme |
| `/relative/path` | ALLOW | ALLOW | site-relative |
| `?query=1` | ALLOW | ALLOW | query-relative |
| `#fragment` | ALLOW | ALLOW | fragment-relative |
| `page.html` | ALLOW | ALLOW | bare path |

The component renders blocked hrefs as a `<span class="onegov-link onegov-link--blocked">`, never as an anchor. External `http(s):` anchors get `rel="noopener noreferrer" target="_blank"`. **The 16 sanitizeHref test cases the worker wrote already cover the URL-encoded variant** (`javascript:%2F%2F` is in `Link.test.tsx`); my "no warning needed" notwithstanding the orchestrator's heads-up — the test set is complete.

---

## Renderer Idempotency

- [x] **Theme injection idempotent.** After 5 successive `render(...)` calls, `shadow.querySelectorAll('style[data-onegov-theme="1"]').length === 1`. Test at `tests/renderer.test.tsx:74` verifies this.
- [x] **Mount-node singleton.** Test at `tests/renderer.test.tsx:83` confirms `firstMount === secondMount` after 3 renders.
- [x] **`data-persona` updates correctly on persona change.** Test at `tests/renderer.test.tsx:93` verifies.
- [x] **Page DOM stable across re-renders** — test at `tests/renderer.test.tsx:129` snapshots `document.body.innerHTML` and confirms it doesn't churn after the initial host append.

---

## Out-of-scope expansion (root `package.json` + `tsconfig.json`)

Worker touched two root-level files outside `packages/ui/**`:

1. **`package.json`** — split `"test"` into `"test:core"` + `"test:ui"`, chained through `"test"`.
2. **`tsconfig.json`** (root) — added `compilerOptions.jsx = "react-jsx"` + `jsxImportSource = "preact"`.

I verified the justification for both:

- For (1), running `bun test packages` in one process **fails** the no-DOM invariant test (see Test Split Rationale above). Splitting is the cleanest fix.
- For (2), without the JSX runtime configuration, `bun test` resolved JSX to React's runtime (which isn't installed), breaking from the repo root. The keys don't affect `tsc --build` because each project reference carries its own JSX settings.

Both changes are necessary and minimal. Public surface (`bun run test` chains both, `bun run check` works) is preserved. **Acceptable scope expansion.**

3. **`packages/ui/vite.config.ts`** + **`scripts/build-harness.ts`** — only used by `bun run --cwd packages/ui build:harness`, which is NOT part of `bun run build` (the production extension build orchestrator is `scripts/build-extension.ts`, which only invokes the extension's own vite config). Verified by reading `scripts/build-extension.ts` — it iterates `targets = ['background', 'content', 'popup']` and calls only `packages/extension/vite.config.ts`. The harness build is a developer-only artifact.

---

## Visual Harness

- [x] HTML file exists at `packages/ui/test-harness.html` (185 lines)
- [x] Bundled JS exists at `packages/ui/dist/harness/renderer.bundle.js` after `bun run --cwd packages/ui build:harness`
- [x] HTML imports the correct path (`./dist/harness/renderer.bundle.js`)
- [x] **Loaded in headless Chromium** via Playwright on a local static server. Console errors: 1 (favicon 404, unrelated). Renderer: zero errors.
- [x] All four persona panels render correctly:
  - **standard**: clean default, blue ANAF heading, normal density
  - **pensioner**: ≥20px type, "Verificare CUI / CIF" link lifted into a card, generous spacing
  - **pro**: dense layout, smaller font, `↵` keyboard hint visible after links
  - **journalist**: tables sink to bottom with "Copiază ca CSV" toggle button
- [x] **`Bloked: javascript: link` rendered as plain text in EVERY panel** — security boundary visibly working
- Screenshot saved to `harness-review.png` (transient — not committed)

---

## Code Quality

- [x] **No `any` types** — `grep -rn ": any\|<any>\|as any\|: Array<any>" packages/ui/src/` returns zero matches. The one cast in `Form.test.tsx` (`as unknown as { onsubmit: unknown }`) is the standard Preact-on-DOM-element idiom for asserting a missing handler is genuinely missing.
- [x] **No file > 500 lines.** Largest TS source: `theme.ts` 174 lines. Largest non-TS source: `theme.css` 394 lines. All test files under 154 lines.
- [x] **Conventional Commits** — all 5 commits use `feat(ui):` / `test(ui):` / `docs(jobs):` prefixes.
- [x] **No `Co-Authored-By`** — `git log main..HEAD --format="%B" | grep -i co-authored` returns nothing.
- [x] **English in code; Romanian only in user-facing strings** — Romanian appears only in `Form.tsx` ("Vizualizare. Datele se introduc..."), `Table.tsx` ("Copiază ca CSV", "Acțiuni tabel"), `personas/shared.tsx` ("[imagine: ...]"). All identifiers, comments, errors are English.
- [x] **identitate.gov.ro tokens** — `--onegov-color-primary: #003B73` (PANTONE 280C blue) ✓; `--onegov-font-base: Arial, Calibri, Verdana, Tahoma, Trebuchet MS, Ubuntu, sans-serif` ✓; persona-specific overrides for spacing, font-size, target-size all present.
- [x] **`prefers-reduced-motion` respected** — both `theme.css:385` and `theme.ts:160` ship a `@media (prefers-reduced-motion: reduce) { ... animation: none !important; transition: none !important; }` block.
- [x] **Closed shadow root preserved** — renderer takes a `ShadowRoot` and never opens it; visual harness explicitly creates with `attachShadow({ mode: 'closed' })`.

---

## Issues Found

### 🔴 Blockers (must fix before merge)

None.

### 🟡 Warnings (should fix)

None.

### 🟢 Suggestions (optional)

- **Update `CLAUDE.md` Quick Start to note the test split.** `bun test` now ONLY runs the UI suite (because `bun test` with no path defaults to package-local discovery and the script-via-`bun run test` is what chains both). For an external contributor running `bun test` from the repo root naïvely, they'd see only UI tests. Worth a one-line README clarification: prefer `bun run test`. Not a blocker — worker's choice already chains both via `"test"`.

- **`themeFor(persona)` ignores its argument.** The function returns `THEME_CSS` unconditionally (token differentiation lives entirely in `:host([data-persona])` selectors). The worker called this out as a follow-up (per-persona stripping for ~600 bytes saved). Fine for v0.1 — leaves the function signature in place for the optimisation later.

- **Form's `<form method="get">`** is harmless (the form has no submit button, all fields are readonly), but pedantically `method="dialog"` would communicate intent better. v0.1-acceptable; the test asserts no submission can happen.

- **Card slug collisions** are unlikely but possible if two cards share a 32-char-truncated slug. The harness doesn't expose this; for v0.1 it's fine. A v0.2 fix would compose a counter or use the node id.

---

## Summary

Track 3 is a clean, well-tested implementation that matches the spec to the letter. The worker's deviations (test-split, JSX runtime, harness build setup) are all justified and documented. Bundle size is comfortably within budget. Five invariants hold for the UI surface. Cross-package boundary is clean — no `chrome.*` / `browser.*` / direct `document.*`. Link sanitization is rigorous; URL-encoded payloads are rejected at the scheme allowlist before any decoding. Renderer idempotency proven. Visual harness verified in headless Chromium with zero errors. No core changes from Track 3 — the rebase against latest main was clean.

**Verdict: PASS — ready for squash-merge.**

**Counts:** 0 blockers / 0 warnings / 3 suggestions.
