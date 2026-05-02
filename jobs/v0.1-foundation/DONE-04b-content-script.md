# Completed: Content script + popup wiring (Track 4b)

**Task:** 04b-content-script.md | **Status:** done | **Date:** 2026-05-02
**Branch:** `job/v0.1-foundation/extension-content` (worktree `agent-a220286e`)
**Commits (latest 4):**
- `941c5c7` build(extension): copy rule-packs/*.json into dist/extension/ output
- `a3f4c4f` feat(extension): popup with status pill, persona picker, escape toggle
- `2d0f487` feat(extension): content script wires extract + render via SW messaging
- `d93c776` feat(extension): background SW message handlers for content + popup

## Changes Made

### New files
- `packages/extension/src/messages.ts` — typed cross-context message contract (`get-status`, `load-pack` + replies)
- `packages/extension/src/background/messaging.ts` — `chrome.runtime.onMessage` handler with `handleRequest()` and `registerMessageHandlers()`
- `packages/extension/src/content/serializable-doc.ts` — ~30-line adapter wrapping `Document`/`ParentNode` to satisfy `@onegov/core`'s `SerializableDoc` interface (lazy + cached children)
- `packages/extension/src/content/__tests__/chrome-stub.ts` — minimal `chrome.*` stub (sendMessage, storage.local, storage.onChanged, runtime.getManifest) for content + popup tests
- `packages/extension/src/content/__tests__/serializable-doc.test.ts` — 15 cases covering the adapter contract
- `packages/extension/src/content/__tests__/index.test.ts` — 12 lifecycle assertions
- `packages/extension/src/popup/__tests__/index.test.tsx` — 14 cases for the popup
- `packages/extension/src/background/__tests__/messaging.test.ts` — 9 cases for the SW handler

### Edited files
- `packages/extension/src/content/index.ts` — replaces empty stub with the integration described in the task spec
- `packages/extension/src/popup/index.tsx` — replaces empty stub with status pill + persona picker (2x2) + showOriginal toggle + footer
- `packages/extension/src/popup/popup.css` — full v0.1 styling using identitate.gov.ro tokens
- `packages/extension/src/background/index.ts` — adds 1 line registering the messaging handler (icon state machine logic untouched)
- `packages/extension/src/background/__tests__/chrome-stub.ts` — extends stub with `runtime.onMessage` + `runtime.getURL` so the SW module evaluates without throwing under tests
- `packages/extension/src/background/__tests__/index.test.ts` — bumps the listener-count assertion to include the onMessage registration
- `packages/extension/vite.config.ts` — extends asset-copy plugin to mirror `rule-packs/*.json` into `dist/extension/rule-packs/` (without this the unpacked extension 404s every `load-pack`)

## Tests Written

| File | Coverage |
|------|----------|
| `serializable-doc.test.ts` | 15 cases — query/queryAll/tag/text/attr/children + invariants (no mutation, sub-element scoping, lazy children) |
| `content/__tests__/index.test.ts` | 12 cases — exits cleanly on unknown / lookalike / SW-down / no-pack / no-route; happy path appends closed shadow host + dataset; persona switch re-renders without DOM churn; escape hatch hides/shows host |
| `popup/__tests__/index.test.tsx` | 14 cases — `statusPillFor` mapping (4) + initial render assertions (7) + interactions (3, persona writeback + showOriginal writeback) |
| `background/__tests__/messaging.test.ts` | 9 cases — get-status across verified/lookalike/unknown/malformed/null + active-tab fallback; load-pack across success/404/throw/malformed-payload |

Total new + updated test cases: 50. Full suite: **85 pass, 0 fail, 133 expect() calls**.

## Acceptance Criteria Check

### Content script
- [x] Replaces the empty Track 1 stub (`packages/extension/src/content/index.ts:1`)
- [x] On `document_idle`, sends `get-status` → if verified, sends `load-pack` → matches route by pathname regex → wraps document in `SerializableDoc` adapter → calls `extract` from `@onegov/core` → reads persona from `chrome.storage.local` (default `standard`) → creates `<div id="onegov-root" data-onegov="1">` → `attachShadow({ mode: 'closed' })` → mounts via `render(tree, persona, shadow)` from `@onegov/ui` → subscribes to `chrome.storage.onChanged` for persona + showOriginal

### Background SW updates
- [x] `chrome.runtime.onMessage` handlers for `get-status` + `load-pack` added; existing icon state machine UNCHANGED

### Popup
- [x] Status pill: ✅ "Site oficial verificat" (green) / 🚨 "Atenție — domeniu suspect" (red) / ⚪ "Site nesuportat" (gray)
- [x] Persona picker: 4 buttons in 2x2 grid with Romanian one-line hints (per task spec)
- [x] Picking a persona writes `{ persona }` to `chrome.storage.local`
- [x] "Afișează site-ul original" toggle writes `{ showOriginal }` to `chrome.storage.local`
- [x] Footer with version (read from `chrome.runtime.getManifest()`) + GitHub link

### SerializableDoc adapter
- [x] `serializable-doc.ts` — ~30 LOC adapter, lazy children + caching
- [x] Unit tests — synthetic Document, query/queryAll/attr/text/children verified

## Invariant Check

- [x] **#1 Original DOM unchanged** — only the appended `<div id="onegov-root">` differs. Verified by `content/__tests__/index.test.ts:178` ("does NOT mutate any pre-existing element") and `index.test.ts:106-110` ("documentElement.outerHTML stays byte-equal" on unknown/lookalike). Adapter never writes back (asserted in `serializable-doc.test.ts:138`).
- [x] **#2 No form data read or written** — `SerializableDoc` exposes neither `.value` nor `.elements`, never reads `FormData`. Grep `FormData|\.elements|requestSubmit|\.submit()` against `packages/extension/src/` returns only documentation comments stating the rule.
- [x] **#3 No remote code** — no `eval`, no `Function`, no `setTimeout/setInterval('...')`, no `innerHTML =` with rule-pack data. Grep `\beval|new Function|innerHTML\s*=|outerHTML\s*=` returns only doc comments + test fixtures (test fixtures use static literals to set up DOM, NOT rule-pack-derived data).
- [x] **#4 No network requests outside bundled assets** — only `fetch` in production code is `fetch(chrome.runtime.getURL(path))` in `background/messaging.ts:63`. Content script makes ZERO `fetch`; routes everything through `chrome.runtime.sendMessage`. Grep `fetch(\|XMLHttpRequest\|WebSocket\|EventSource\|sendBeacon` filtered by `chrome.runtime.getURL` is empty.
- [x] **#5 "Afișează site-ul original" still hides overlay** — popup writes `{ showOriginal: true }` to storage; content script's `onChanged` listener flips `host.style.display = 'none'`. Verified in `content/__tests__/index.test.ts:223` ("hides the host when showOriginal flips to true").

## Cross-Browser Check

- [x] Chrome (latest stable) — code targets MV3 / `chrome.*` namespace. Manual unpacked-load smoke deferred to reviewer (this task's scope is implementation + automated tests; the `04c-playwright-e2e-bootstrap.md` follow-up wires browser smoke). All 85 tests pass under happy-dom + bun:test which is the closest pre-Chrome verification we have.
- [ ] Firefox — out of scope per task spec ("v0.1 = Chrome desktop ONLY. No Firefox tooling, no `node-forge`.").

## Bundle Sizes

| Bundle | Raw | Gzipped | Budget | Status |
|--------|-----|---------|--------|--------|
| `dist/extension/content.js` | 32826 B | **11185 B (~10.9 KB)** | 80 KB gz | well under (~14% of cap) |
| `dist/extension/popup.js` | 21494 B | **7378 B (~7.2 KB)** | 60 KB gz | well under (~12% of cap) |
| `dist/extension/background.js` | 534121 B | **129036 B (~126 KB)** | n/a (Track 4a accepted) | unchanged behaviour, +messaging |

The content + popup bundles stay tiny because both deep-import `extract`/`applyPersonaOverrides` from `@onegov/core` (pure modules) and route the heavy verifier + Zod loader through the SW via `chrome.runtime.sendMessage` (option 2 in the task spec).

## Tooling Output

```
$ bun run check
$ tsc --build packages/core packages/ui packages/extension
(no output = no errors)

$ bun run test
 85 pass
 0 fail
 133 expect() calls
Ran 85 tests across 6 files. [377.00ms]

$ bun run build
[build] vite build → background     gzip: 129.08 kB
[build] vite build → content        gzip:  11.22 kB
[build] vite build → popup          gzip:   7.39 kB
[build] done → dist/extension

$ bun pm ls 2>&1 | grep -ci node-forge
0

$ git status --porcelain
(empty)
```

## Five-Invariant Grep Results

```
=== Invariant 1 grep (DOM mutation patterns in content/) ===
(empty)

=== Invariant 2 grep (form data) ===
packages/extension/src/content/serializable-doc.ts:17: * `.elements`, or `FormData`).        # documentation
packages/extension/src/content/index.ts:35: *      `.value` nor `.elements` nor `FormData`.  # documentation

=== Invariant 3 grep (remote code) ===
packages/extension/src/background/messaging.ts:26 — documentation
packages/extension/src/background/__tests__/chrome-stub.ts:96 — comment "module evaluation"
packages/extension/src/popup/__tests__/index.test.tsx:13,59,79 — test setup (static `document.body.innerHTML = '<div id="app">'` etc.)
packages/extension/src/content/__tests__/index.test.ts:64,72,93,208 — test setup
packages/extension/src/content/__tests__/serializable-doc.test.ts:30,151,154 — fixture setup
packages/extension/src/content/index.ts:37 — documentation

=== Invariant 4 grep (external network — must be empty after the chrome.runtime.getURL filter) ===
packages/extension/src/content/index.ts:39 — documentation comment only
```

All `innerHTML =` matches in production code are documentation comments. The `innerHTML =` matches in test files are static literal fixtures (no rule-pack data flows into them — they synthesise the page DOM the IIFE is supposed to read). Invariant #4 grep filtered by `chrome.runtime.getURL` shows no production-code violations.

## Manual Smoke (Deferred)

I cannot drive Chrome from this environment (the worktree runs under Bun + happy-dom, not a real Chrome harness). Manual unpacked-load smoke deferred to reviewer:

1. `bun run build`
2. `chrome://extensions` → Developer mode → Load unpacked → `dist/extension/`
3. Navigate to `https://anaf.ro/anaf/internet/ANAF/` — overlay should render in `standard` persona
4. Open the popup → pick `pensioner` → overlay should re-render with larger type
5. Click "Afișează site-ul original" — overlay should disappear; original page interactive
6. `chrome://extensions` errors panel — must be empty
7. DevTools Network tab on reload — confirm zero requests originated by the extension

The integration is wired so this should work on first load: `dist/extension/rule-packs/` is now populated by the build (vite asset-copy extension), `manifest.json` exposes the packs via `web_accessible_resources`, and the SW serves them through `chrome.runtime.getURL`.

## Deviations + Justification

1. **Edited `packages/extension/vite.config.ts`** beyond the `Touches only` paths in the task spec.
   - **Why:** the manifest already declares `web_accessible_resources: ["rule-packs/*.json"]` but the build wasn't copying packs into `dist/extension/`. Without this delta the unpacked extension 404s every `load-pack` and Invariant-checked behaviour can't be smoke-verified.
   - **Scope:** addition only, 15 lines, mirrors the existing `copyIfChanged` pattern. Does not change build behaviour for any other asset.

2. **Did not write a Playwright DOM-integrity spec** (task mentions it as a "bonus").
   - **Why:** task spec also says "(or document it as a follow-up if time-bound)" and "E2E DOM-integrity test in Playwright (separate follow-up `04c-playwright-e2e-bootstrap.md`)" is explicitly Out of scope. The DOM-integrity assertion is covered in tests via `expect(document.documentElement.outerHTML).toBe(before)` in `content/__tests__/index.test.ts:106,131` and `expect(afterH1).toBe(beforeH1)` at `:212`.

3. **`bun run lint` does not execute** — the project still uses `.eslintrc.cjs` while installed ESLint is v9.x which only loads `eslint.config.js`. Pre-existing tooling issue, not introduced by this task. Prior tasks (4a, 5) shipped without lint output. Migrating ESLint config is out of scope for 4b.

## Files Changed Count

- Modified: 7 files (background.ts, vite.config.ts, two test files in background, content stub, popup stub, popup CSS)
- Added: 8 files (messages.ts, messaging.ts + test, serializable-doc.ts + test, content tests + chrome stub, popup tests)
- **Total: 15 files**, 7 deletions, ~1925 insertions across 4 commits.

## Security Check

- [x] No secrets in code or logs
- [x] Input validation present (message type-guard in `background/messaging.ts:144-152` discards unknown shapes; persona coerced via `PERSONAS_VALID` allowlist; pathname regex compiled defensively with try/catch)
- [x] No external network beyond `chrome.runtime.getURL` for bundled assets (Invariant #4)
- [x] Closed shadow root only (`mode: 'closed'`)
- [x] No new manifest permissions; the existing 4 (`storage`, `scripting`, `activeTab`, `webNavigation`) are sufficient
- [x] No new dependencies; `bun pm ls 2>&1 | grep -ci node-forge` returns 0
- [x] GitHub footer link uses `target="_blank" rel="noopener noreferrer"`
