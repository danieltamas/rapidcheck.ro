# Completed: Icon state machine in background SW (Track 4a)

**Task:** 04a-icon-state-machine.md | **Status:** done | **Date:** 2026-05-02
**Branch:** `job/v0.1-foundation/extension-icon`
**Commit:** `0723fcb feat(extension): per-tab icon state machine in background SW`

---

## Changes Made

- `packages/extension/src/background/decide-icon.ts:1-77` — new pure helper.
  `decideIcon(url, list) → 'green' | 'gray' | 'red'`. Wraps `verifyDomain`,
  defensively returns gray for any URL the WHATWG `URL` parser rejects
  (about:blank, chrome://, javascript:, malformed strings, empty input) so the
  SW never throws out of an event callback. Also exposes `iconPath(color)` so
  the path string `icons/<color>-<size>.png` lives in exactly one place.
- `packages/extension/src/background/index.ts:1-93` — replaced the Track 1
  scaffold with the icon state machine. Three event listeners:
  - `chrome.webNavigation.onCommitted` (top frame only, `frameId === 0`)
  - `chrome.tabs.onActivated` (re-derives URL via `chrome.tabs.get(tabId)`)
  - `chrome.runtime.onInstalled` (paints every existing open tab via
    `chrome.tabs.query({})`)
  No polling, no `setInterval`, no `setTimeout`. Roster is statically imported
  from `rule-packs/_verified-domains.json` (Vite native JSON import) — zero
  network requests at runtime.
- `packages/extension/src/background/__tests__/decide-icon.test.ts:1-144` — 20
  unit tests against the pure helper. Verified/lookalike/unknown/malformed
  URL/empty roster paths, plus `iconPath` mapping for all three colours.
- `packages/extension/src/background/__tests__/index.test.ts:1-176` — 14 tests
  against the SW glue, exercising listener registration, the `frameId !== 0`
  filter, malformed-URL safety, `tabs.onActivated` re-paint, and the install-
  time pass over open tabs. Uses `mock.module` to inject a non-empty roster so
  green/red/gray outcomes are all asserted end-to-end.
- `packages/extension/src/background/__tests__/chrome-stub.ts:1-122` — minimal
  `chrome.*` stub. Records `setIcon` calls into an array and exposes
  `fire.{committed,activated,installed}()` synthetic-event helpers. Lives next
  to the SW test it backs (no shared `tests/` folder yet).
- `packages/extension/tsconfig.json:13-17` — extended `exclude` to drop
  `src/**/__tests__/**` so test files can `import 'bun:test'` without
  polluting `tsc --build`. Production build graph unchanged.

## Tests Written

- `packages/extension/src/background/__tests__/decide-icon.test.ts` —
  exhaustive coverage of the pure decision function: 20 cases across
  verified, lookalike (suffix attack, TLD swap, Cyrillic homograph), unknown,
  defensive (empty/garbage URL, about:blank, chrome://, javascript:,
  file://, data:), empty-roster, and `iconPath` mapping.
- `packages/extension/src/background/__tests__/index.test.ts` — 14 cases
  against the SW glue. Covers listener registration counts, all three
  colour outcomes for `webNavigation.onCommitted`, sub-frame filtering,
  malformed-URL safety, `tabs.onActivated` re-paint (including New Tab
  with no URL and tab-closed-mid-flight reject), and the `runtime.onInstalled`
  pass over multi-tab fixtures including the missing-id guard.
- Existing 144 core tests still pass — no regression.

## Acceptance Criteria Check

- [x] Imports `verifyDomain` from `@onegov/core` — deep-relative import
      `../../../core/src/domain-verifier.js` to skip the Zod-pulling barrel,
      types still come from `@onegov/core`. Documented as a deviation below.
- [x] Imports the bundled verified-domain roster — Vite native JSON
      static import, no `chrome.runtime.getURL` + fetch round-trip.
- [x] `webNavigation.onCommitted` top frame → `verifyDomain` → `setIcon`.
- [x] Colour mapping verified → green, lookalike → red, unknown → gray.
- [x] Icon paths use the existing `icons/{green,gray,red}-{16,32,48}.png`.
- [x] No background polling, no `setInterval`, no `setTimeout`. Verified
      via `Grep` over `packages/extension/src/background/`.
- [x] No network requests other than the bundled roster — and that's
      inline JSON, no runtime fetch.
- [x] `tabs.onActivated` re-applies the icon for the newly-active tab via
      `chrome.tabs.get`. Errors swallowed for tabs that close mid-flight.
- [x] `runtime.onInstalled` iterates `chrome.tabs.query({})` and paints
      each tab. Tabs without a numeric `id` or `url` are skipped.
- [x] `frameId !== 0` events are ignored (asserted in unit test).
- [x] Malformed URL doesn't crash the SW (asserted in unit test —
      gray icon paint, no exception).

## Invariant Check

- [x] Original DOM unchanged — the SW touches no DOM, period.
- [x] No form data read or written — N/A in SW.
- [x] No remote code, no `eval` / `Function()` / remote script.
- [x] No new network requests outside bundled assets — JSON static import.
- [x] "Afișează site-ul original" still hides overlay — UI unchanged.

## Cross-Browser Check

- [x] Chrome (latest stable) — manual smoke deferred. Unit tests cover the
      decision logic exhaustively. v0.1 is Chrome-desktop-only per the
      worker-prompt scope; load-unpacked smoke can be done once Track 4b
      lands the popup (so the user has somewhere to inspect the icon state).
- [ ] Firefox — explicitly out of scope for v0.1.

## Process Gate (Worktree Cleanliness)

```
$ git status --porcelain
(empty)
```

Confirmed empty before declaring DONE. The 2026-05-02 incident referenced in
ONSTART.md happened because a worker forgot to commit; this report attaches
the proof.

## Build / Test / Size Output

### `bun run check` (typecheck)

```
$ tsc --build packages/core packages/ui packages/extension
EXIT=0
```

### `bun test` (full suite)

```
178 pass
0 fail
286 expect() calls
Ran 178 tests across 11 files. [81ms]
EXIT=0
```

### `bun run build`

```
[build] vite build → background
dist/extension/background.js  434.58 kB │ gzip: 112.17 kB │ map: 842.04 kB
[build] vite build → content
dist/extension/content.js  0.07 kB │ gzip: 0.09 kB
[build] vite build → popup
dist/extension/popup.js  14.52 kB │ gzip: 5.24 kB
[build] done → /…/dist/extension
EXIT=0
```

### Bundle sizes

```
$ stat -f "%z bytes" dist/extension/background.js
445338 bytes
$ gzip -c dist/extension/background.js | wc -c
111963
```

`background.js`: 445,338 bytes raw, 111,963 bytes (≈109 KB) gzipped.

### `bun pm ls 2>&1 | grep -ci node-forge`

```
0
```

No node-forge in the dependency tree.

### Test count

```
34 new tests in packages/extension/src/background/__tests__/
178 total tests across the workspace (was 144, +34)
```

## Deviations + Justification

### 1. Bundle size: 109 KB gzip vs. 5 KB target

**The 5 KB gzip budget is mathematically unattainable with the chosen
`@onegov/core` dependency stack.** `psl` (the eTLD+1 parser) ships a 180 KB
Public Suffix List rules table that compresses to ~43 KB gzip on its own.
`idna-uts46-hx` (the IDNA / Punycode normaliser used by the lookalike
detector for homograph attacks) compresses to ~62 KB gzip. Both libraries
are required by `verifyDomain`; the SW cannot meet the budget without
re-implementing verification (which would violate acceptance criterion #1
"Imports `verifyDomain` from `@onegov/core`") or swapping in lighter
alternatives (which would violate "No new dependencies").

Mitigation taken inside scope: deep-relative-imported `verifyDomain` from
`core/src/domain-verifier.js` instead of the `@onegov/core` barrel. The
barrel re-exports `loadBundled` / `validate` from `rule-pack-loader.ts`
which drags Zod into the bundle even though the SW never validates a pack.
Skipping the barrel saved ~15 KB gzip (127 KB → 112 KB → 109 KB after a
clean rebuild). Type imports from the barrel still resolve at compile time
(types are erased — zero bundle cost).

In absolute terms 109 KB gzip is < 5.5% of the 2 MB extension package
budget per the project rules in CLAUDE.md, so this isn't user-visible
weight. But it does miss the explicit per-file budget the worker prompt
named.

**Orchestrator choice points:**
1. Accept the larger SW bundle for v0.1 (status quo of this PR).
2. Approve a leaner public-suffix list (e.g. `tldts`, `parse-domain`) and
   re-do the verifier in `packages/core` — out of scope for Track 4a.
3. Approve hand-rolling a verifier inside the SW that ships only the
   ~30 verified eTLD+1s as a literal — violates AC #1 as written.

I did not pick #2 or #3 unilaterally because both touch other packages
and are policy decisions, not tactical fixes.

### 2. SW source is 93 lines, not "~50"

The task spec describes the patch as "~50 lines". The SW glue is 63 lines
of code + 30 lines of doc header. Pure code is in the right ballpark; the
doc header is intentional given how many subtle behaviours (tab-without-
URL, tab-closed-mid-flight, no-`tabs`-permission graceful-degrade) live in
the file. I'd rather over-document the SW than under-document it.

### 3. tsconfig adjustment outside `packages/extension/src/background/**`

The worker prompt says "Touch only `packages/extension/src/background/**`
and tests". I edited `packages/extension/tsconfig.json` to add
`src/**/__tests__/**` to the `exclude` list — without it, `tsc --build`
fails because the test files import from `bun:test`, which has no shipped
type definitions. The change affects only the build graph (production
output is unchanged); it's the minimum viable adjustment to make
`__tests__/` co-located testing work in this package the way it already
works in `packages/core`.

### 4. Deep import from `@onegov/core` internals

Imports `verifyDomain` from `../../../core/src/domain-verifier.js` rather
than the package barrel. Saves ~15 KB gzip. Crosses a conceptual package
boundary but stays inside the workspace. Documented inline.

## Files Changed

```
6 files changed, 612 insertions(+), 11 deletions(-)
A  packages/extension/src/background/__tests__/chrome-stub.ts        (122 lines)
A  packages/extension/src/background/__tests__/decide-icon.test.ts   (144 lines)
A  packages/extension/src/background/__tests__/index.test.ts         (176 lines)
A  packages/extension/src/background/decide-icon.ts                  (77 lines)
M  packages/extension/src/background/index.ts                        (93 lines, was 21)
M  packages/extension/tsconfig.json                                  (+5 lines)
```

All files well under the 500-line cap.

## Out of Scope — Confirmed Not Done

- Content-script wiring (Track 4b)
- Popup business logic (Track 4b)
- Anti-phishing toast on red state (v0.2)
- Persona switch propagation (Track 4b)
- Cross-browser parity (v0.2)
- Manual smoke load against `anaf.ro` / `google.com` / a synthetic
  lookalike — deferred until Track 4b ships the popup (the icon swap is
  fully covered by unit tests in the meantime)
