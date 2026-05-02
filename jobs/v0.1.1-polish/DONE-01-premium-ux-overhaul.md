# Completed: Premium UX overhaul — popup redesign, auto-persona, full overlay take-over
**Task:** 01-premium-ux-overhaul.md | **Status:** done | **Date:** 2026-05-02

## Branch
`job/v0.1.1-polish/premium-ux` (off `main`)

## Commit hashes (oldest → newest)
- `6da4a48` feat(ui): add premium theme tokens (additive — fs/sp/neutral/shadow/radius/duration)
- `b88ba22` feat(popup): premium redesign with auto-persona surface and primary toggle
- `0dae2af` feat(ui): premium persona shells + sparse-extraction diagnostic fallback
- `1058728` feat(content): full-viewport overlay take-over + escape-hatch hardening
- `50cfb31` feat(ext): persona-inference signal collection + classifier rules

## Changes Made

### A. Premium popup (`packages/extension/src/popup/`)
- `popup.css` — full rewrite. Premium visual language: branded blue header strip, large primary on/off switch, persona pill, current-tab status row, subtle footer. Hand-rolled CSS, no UI library, premium tokens (4px spacing scale, neutral ramp, motion + radius scales).
- `popup.html` — width bumped to 340px (was 320px).
- `index.tsx` — full rewrite. New components: `Header`, `PrimaryToggle`, `PersonaCard` (auto-inferred + inline override), `SiteStatus`, `Footer`. Default persona override picker is HIDDEN; "schimbă" reveals it. Primary toggle writes `extensionEnabled` AND legacy `showOriginal` for back-compat.

### B. Theme tokens (`packages/ui/src/theme.{css,ts}`)
- Added (no breaking changes):
  - `--onegov-font-display` (system-ui first)
  - `--onegov-fs-{xs,sm,md,lg,xl,2xl}` type scale
  - `--onegov-sp-{1..12}` 4px-base spacing scale
  - `--onegov-color-neutral-{50..900}` 9-step gray ramp
  - `--onegov-shadow-{sm,md,lg}` elevation scale
  - `--onegov-radius-{sm,md,lg,full}` radius scale
  - `--onegov-duration-{fast,base,slow}` + ease tokens
  - Premium chrome classes: `.onegov-shell`, `.onegov-shell__topbar/main/footer`, `.onegov-card--premium`, `.onegov-diag*`, `.onegov-pro-grid`
- All gated by `prefers-reduced-motion`.

### C. Persona variants (`packages/ui/src/personas/`)
- New `shell.tsx` — `AppShell` premium frame (branded topbar + main + persona-attributed footer; `wide` flag for journalist).
- New `diagnostic.tsx` — `DiagnosticBanner` + `isSparse()` helper. Renders when `tree.nodes.length < 3`.
- `standard.tsx`, `pensioner.tsx`, `pro.tsx`, `journalist.tsx` — all rewrapped in `AppShell`. Card-candidate nodes get `.onegov-card--premium`. Sparse-extraction guard in every persona.

### D. Content script (`packages/extension/src/content/index.ts`)
- `applyOverlayStyles()` — sets `position: fixed; inset: 0; z-index: 2147483647; isolation: isolate; background: #fff`, all `!important`. Full-viewport take-over.
- Document scroll lock (the documented exception): `documentElement.style.overflow = 'hidden'` on visible, restored exactly on toggle off. Cached in `previousDocumentOverflow`.
- `setOverlayVisible()` keeps host display + scroll lock in sync.
- New `extensionEnabled` storage key honored alongside legacy `showOriginal`. Storage-change handler folds events directly (no race with popup writes).
- Sparse-extraction guard: overlay still mounts when `tree.nodes.length === 0`; persona layout's diagnostic banner becomes the visible UI.

### E. Auto-persona inference
- `packages/extension/src/background/persona-inference.ts` — rules-based classifier:
  - `pro` if Tab usage > 30% OR avg dwell < 30s
  - `pensioner` if avg dwell > 120s AND scroll velocity < 100 px/s
  - `journalist` if dwell ∈ [30s..120s] AND tab usage ∈ [15%..30%]
  - `standard` otherwise
  - All Romanian reasons; bounded rolling window (`MAX_SAMPLES = 32`); tab-usage cap; in-process fallback when `chrome.storage.session` is missing.
- `packages/extension/src/content/signals.ts` — passive listeners (keydown / scroll / visibilitychange / pagehide). Bounded scroll window. Defensive against missing `chrome.runtime`.
- `packages/extension/src/messages.ts` — extended contract: `record-signal` (fire-and-forget), `get-persona-inference`, plus `hostname` on `get-status:reply`.
- `packages/extension/src/background/messaging.ts` — wired the new request types, `fallbackReply()` for catch path.

## Tests Written
- `packages/ui/src/personas/__tests__/personas.test.tsx` — 22 tests covering shell wrapping, sparse fallback for all four personas, signature affordance retention.
- `packages/extension/src/popup/__tests__/index.test.tsx` — full rewrite, covers branded header, primary toggle (writes both keys), persona pill default-hidden picker + reveal + override, current-tab status, footer.
- `packages/extension/src/content/__tests__/index.test.ts` — extended for full-viewport positioning (`position`, `inset`, `z-index`, `isolation`, `background`), document scroll lock + restore, `extensionEnabled` key (default true), sparse extraction guard, legacy `showOriginal` back-compat.
- `packages/extension/src/content/__tests__/signals.test.ts` — 6 tests covering idempotency, tab-usage flush threshold, dwell on visibilityhidden, defensive against missing chrome.runtime.
- `packages/extension/src/background/__tests__/persona-inference.test.ts` — 16 tests covering each rule, bounded window, invalid signal handling, round-trip storage.

## Acceptance Criteria Check
- [x] Premium popup redesign — branded header / primary toggle / auto-persona pill with reason / site status / subtle footer
- [x] Premium typography + design tokens (additive, all original tokens preserved byte-equal)
- [x] Persona variants rewrap in premium app shell
- [x] Sparse-extraction guard renders DiagnosticBanner when `nodes < 3`
- [x] Full-viewport overlay (`position: fixed; inset: 0; z-index: 2147483647; isolation: isolate`) with opaque background
- [x] Document scroll lock (the one narrowly-scoped exception, restored on toggle off)
- [x] Auto-persona inference module + content-script signal collection
- [x] Persona-inference reason surfaces in popup; "schimbă" override one click away
- [x] Tests for every new behavior

## Invariant Check
- [x] **#1 Original DOM untouched.** The ONLY structural mutation is appending `<div id="onegov-root">`. The ONLY style mutation outside that host is `documentElement.style.overflow` (toggled while overlay is shown, restored exactly on toggle off — this is the explicitly-authorized v0.1.1 exception, documented loudly in `content/index.ts:30-46`).
- [x] **#2 No form data read or written.** `SerializableDoc` adapter still exposes neither `.value` nor `.elements`. Signal collector reads only `KeyboardEvent.key` (Tab vs other), `window.scrollY` deltas, `document.visibilityState` — never form contents, never URLs, never timestamps.
- [x] **#3 No remote code, no `eval`/`Function()`/remote script.** All rendering through Preact JSX. No `innerHTML` writes in production code.
- [x] **#4 No new network requests outside bundled assets.** Signal messaging is intra-extension via `chrome.runtime.sendMessage`. No `fetch()` to external origins added.
- [x] **#5 Escape works.** Primary toggle in popup hides overlay AND restores `documentElement.style.overflow`. Legacy `showOriginal` key still works.

## Cross-Browser Check
- [x] Chrome (latest stable) — manual smoke deferred to orchestrator (Playwright MCP doesn't support `--load-extension`); all unit + integration tests pass against happy-dom.
- [ ] Firefox — out of v0.1 scope (Chrome desktop only per task spec).

## Process gates
- `git status --porcelain`: empty (verified)
- `bun pm ls 2>&1 | grep -ci node-forge`: **0**
- `bun run check`: clean (typecheck passes, no errors)
- `bun run test`: **375 tests pass** (113 core + 106 ui + 156 extension), 0 fail
- `bun run build`: clean

## Bundle sizes (from `bun run build` final pass)
| Bundle | Raw | Gzipped | Cap | Status |
|---|---|---|---|---|
| `dist/extension/background.js` | 538 KB | 130 KB | (no cap) | OK |
| `dist/extension/content.js` | 43 KB | **13.8 KB** | 80 KB | ✓ 17% of cap |
| `dist/extension/popup.js` | 25 KB | **8.2 KB** | 60 KB | ✓ 14% of cap |

## Files changed (count)
- 18 files changed across 5 commits
- 4 new files: `packages/ui/src/personas/shell.tsx`, `packages/ui/src/personas/diagnostic.tsx`, `packages/extension/src/background/persona-inference.ts`, `packages/extension/src/content/signals.ts`
- 3 new test files: `packages/ui/src/personas/__tests__/personas.test.tsx`, `packages/extension/src/background/__tests__/persona-inference.test.ts`, `packages/extension/src/content/__tests__/signals.test.ts`

## Manual smoke result
**Deferred to orchestrator.** The Playwright MCP available in this worker environment does not support Chrome's `--load-extension` flag (a non-headless context with `--disable-extensions-except` is needed). All visible behavior is covered by the integration test suite running against happy-dom (full-viewport positioning, scroll lock, persona switching, sparse-extraction fallback, primary toggle visibility flips). The orchestrator should perform the demo-grade smoke per the task spec's checklist (load unpacked → visit anaf.ro → confirm overlay visible / popup looks designed / persona pill shows reason / toggle works / "schimbă" expands picker).

## Deviations
- **Popup test for `Footer` separator**: the visible glyph in the rendered DOM differs from the literal source (HTML entity escape + JSX behaviour). Tests assert version + GitHub link, not the separator glyph. Non-issue.
- **`personaInference.overridden` field is always `false` in the SW reply** — the override decision is owned by the popup (which reads `persona` from `chrome.storage.local`), not the SW. Documented in messaging.ts.
- **Manual smoke deferred** (above).

## Persona inference — privacy note
All signals (tab keystrokes, dwell time, scroll velocity) are aggregated to numerical counts and stored in `chrome.storage.session` only (in-memory, cleared on browser restart). No URLs, no PII, no timestamps. No signals leave the device — the only outbound traffic from this codepath is `chrome.runtime.sendMessage` from content script to SW, which is intra-extension. Documented in `persona-inference.ts` header.
