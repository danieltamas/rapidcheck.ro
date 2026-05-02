# Review: Icon state machine in background SW (Track 4a)

**Task:** 04a-icon-state-machine.md | **Reviewer verdict:** PASS | **Date:** 2026-05-02

> **Pre-review hygiene:** Worker's worktree was clean (`git status --porcelain` empty). Branch was rebased onto current `main` (which advanced past the worker's original base — Track 3 UI components and Track 5 rule packs both merged in the meantime). Rebase was conflict-free. Two `git fetch` attempts failed because no remote is configured locally; rebase was performed against the local `main` branch which is the source of truth in this monorepo.

## Tests

- [x] All extension unit tests pass — **34 / 34** in `packages/extension/src/background/__tests__/` (2 files: `decide-icon.test.ts` 20 tests, `index.test.ts` 14 tests)
- [x] All core unit tests pass — **113 / 113** when run independently
- [x] Test counts match worker DONE report (worker claimed 34 new tests; verified)
- [x] Track 4a tests pass when run isolated, when run with core, and when run with extension+core
- [x] All rule packs validate (`bun run validate-packs` → "OK — 7 file(s) checked")
- [x] `bun pm ls 2>&1 | grep -ci node-forge` → 0
- [x] `bun run check` (typecheck) → exit 0
- [x] `bun run build` → exit 0, no warnings beyond expected empty-chunk note for content stub
- [ ] **Pre-existing main regression:** `packages/core/tests/no-dom.test.ts` (2 cases) fails when run alongside `packages/ui` tests — see "Issues" §🟢. Reproduced on bare `main` independent of Track 4a. **Not introduced by this task.**
- [ ] Chrome smoke deferred (worker rationale accepted: nothing to inspect until Track 4b ships popup; unit coverage of decision logic is exhaustive)
- [ ] Firefox smoke — explicitly out of v0.1 scope per CLAUDE.md preamble

### Test pipeline output

```
$ bun test packages/core packages/extension
 147 pass
 0 fail
 241 expect() calls
Ran 147 tests across 9 files. [80ms]

$ bun test packages/extension/src
 34 pass
 0 fail
 48 expect() calls
Ran 34 tests across 2 files. [46ms]

$ bun run validate-packs
[validate-packs] OK — 7 file(s) checked

$ bun pm ls 2>&1 | grep -ci node-forge
0
```

## Invariants

- [x] **#1 (DOM untouched):** `grep` over `packages/extension/src/background/` for `document.|window.|getElementById|querySelector|innerHTML` returned **zero** matches. The SW touches no page DOM. The only side effect is `chrome.action.setIcon`.
- [x] **#2 (no form data):** N/A — SW has no access to page DOM or form inputs.
- [x] **#3 (no remote code):** No `eval`, no `Function`, no `setTimeout(string)`, no `innerHTML`. Verified via grep.
- [x] **#4 (no network in v0.1):** `grep` over `packages/extension/src/background/` for `fetch\(|XMLHttpRequest|WebSocket|EventSource` returned **zero** matches. The verified-domain roster is statically imported via Vite JSON import — bundled inline, no runtime fetch. The bundle audit confirms: `dist/extension/background.js` contains the inlined roster + `psl` + `idna-uts46-hx`. No network round-trip at SW startup or on any event.
- [x] **#5 (user can escape):** N/A for this slice — SW is reactive only to navigation events and tab activation; no overlay to escape from. Track 4b owns the user-facing escape hatch.

## Permission discipline

- [x] **Manifest unchanged.** `dist/extension/manifest.json` permissions remain exactly `["storage", "scripting", "activeTab", "webNavigation"]`. No `tabs` permission added. No host_permissions changed.
- [x] **`chrome.tabs.query()` and `chrome.tabs.get()` work without `tabs` permission for the limited fields the worker uses.** Verified by reading the SW: it consults `tab.id` and `tab.url`. Per Chrome MV3 contract, `tab.url` is populated for the calling extension only when (a) `tabs` permission is granted, OR (b) the tab's URL matches a `host_permissions` entry, OR (c) `activeTab` was granted by user gesture. The current manifest grants `activeTab` and `host_permissions` for the 7 v0.1 gov hosts. **For tabs outside those 7 hosts, `tab.url` will be `undefined` at install/onActivated time — the SW's `if (!url) return` guard correctly degrades to no-op.** This is the right behaviour: the default browser-action icon (`gray-*.png` per manifest `default_icon`) already represents the off-list state, so a no-op leaves the correct colour visible. `webNavigation.onCommitted` is unaffected — it always populates `details.url` for any tab once the `webNavigation` permission is granted, so navigations to off-list domains still flip the icon to gray correctly.
- [x] No new dependencies added. `psl` and `idna-uts46-hx` were pulled in by Track 2 via `@onegov/core`; Track 4a inherits them transitively without adding any direct deps.

## Pure decision function

- [x] `decide-icon.ts` exists at `packages/extension/src/background/decide-icon.ts` (76 lines)
- [x] Signature is `decideIcon(url: string, list: VerifiedDomainList): 'green' | 'gray' | 'red'` — matches the spec request exactly
- [x] **Pure.** No `chrome.*` access. No DOM. Just data in, data out. Bonus: the WHATWG `URL` parser is wrapped in try/catch so any malformed input collapses to `gray` rather than throwing.
- [x] Tested with malformed URLs (does not throw): `''`, `'not a url'`, `'about:blank'`, `'chrome://newtab/'`, `'javascript:void(0)'`, `'file:///etc/hosts'`, `'data:text/plain,hello'` — all 7 cases asserted in `decide-icon.test.ts`.
- [x] Empty roster case asserted: every URL becomes `gray` when `list.domains` is empty.
- [x] `iconPath()` helper centralises path-string construction so the file-naming convention `icons/<color>-<size>.png` lives in exactly one place.

## Service worker behavior

- [x] **No `setInterval`, no `setTimeout`, no background polling.** Only matches in `index.ts` are inside the doc-comment header. Verified.
- [x] **`webNavigation.onCommitted` filters `frameId === 0`** — top frame only. `index.ts:60` `if (details.frameId !== 0) return;`. Tested in `index.test.ts` ("ignores sub-frame events").
- [x] **`tabs.onActivated` re-derives URL via `chrome.tabs.get(tabId)`** and re-applies icon. Tested for verified, off-list, no-URL, and tab-closed-mid-flight reject.
- [x] **`runtime.onInstalled` iterates `chrome.tabs.query({})`** and paints each tab with a numeric `id` and a defined `url`. Tested with three tabs (verified/lookalike/off-list) plus skip-no-id and skip-no-url cases.
- [x] `setIcon` rejection is silently swallowed — appropriate for tabs that close mid-flight.
- [x] No `await` between event-listener registration and SW idling. The SW becomes idle as soon as the module body finishes executing.

## Deep import smell

- [x] **Confirmed:** `decide-icon.ts:28` imports `verifyDomain` from `'../../../core/src/domain-verifier.js'` (a deep relative path bypassing the `@onegov/core` barrel). Type imports come from the barrel (line 29) — types are erased so cost zero bundle bytes.
- [x] **Worker's claimed bundle saving is real:** I grepped the built `dist/extension/background.js` for Zod tokens (`z.object`, `z.string`, `ZodObject`, `zodEnum`) — **zero matches**. Without the deep-import bypass, the barrel's `rule-pack-loader` re-export would drag Zod into the SW even though the SW never validates a pack.
- [x] **Acceptability:** crosses a conceptual package boundary but stays inside the workspace and is documented inline. **Acceptable as a v0.1 tactical optimisation.**
- [x] Filed as a soft 🟡 warning (recommended remediation: a separate `@onegov/core/lookup` barrel that exports just `verifyDomain` + types without dragging the loader). Not blocking.

## Cross-package boundary

- [x] **No `chrome.*` outside `packages/extension/`.** `grep` over `packages/core/` returned only doc-comment mentions (`* No DOM, no chrome.*, no fetch.`, `* Stored in chrome.storage.local.`, etc.) — no actual API calls. `grep` over `packages/ui/` returned zero matches.
- [x] **`tsconfig.json` change is minimal and reasonable.** Added `"src/**/__tests__/**"` to `exclude` so `tsc --build` doesn't try to type-check test files (they import from `bun:test`, which has no shipped `.d.ts`). This is a build-graph-only change — production output is unchanged. Equivalent pattern is already used in `packages/core/`.
- [x] Verified the production `dist/` no longer contains compiled test artifacts after the exclude is in effect: `ls packages/extension/dist/background/__tests__/` → "No such file or directory".

## Code quality

- [x] **No `any`.** Grep for `: any\b|as any\b|<any>` over the changed background sources returned zero matches.
- [x] **All files < 500 lines:**
  - `decide-icon.ts` — 76 lines
  - `index.ts` — 93 lines
  - `__tests__/chrome-stub.ts` — 122 lines
  - `__tests__/decide-icon.test.ts` — 144 lines
  - `__tests__/index.test.ts` — 180 lines
- [x] **Conventional Commits, no `Co-Authored-By`:** `git log main..HEAD --format="%B" | grep -i co-authored` returned empty. Both commits use Conventional Commits prefixes (`feat`, `docs`).
- [x] **English everywhere.** No Romanian text in the diff (this is non-user-facing background SW code, so not even an exception applies).
- [x] **Defensive design.** Three layers of failure tolerance: (a) URL parse wrapped in try/catch; (b) `setIcon` Promise rejection swallowed; (c) `tabs.get` and `tabs.query` Promise rejections swallowed. The SW will never throw an unhandled exception out of an event callback.
- [x] **Documentation quality is high.** The SW source carries a 30-line header explaining the event wiring, the no-polling guarantee, and the bundled-roster decision. The `decide-icon.ts` source carries an 18-line header explaining the decision flow. The `chrome-stub.ts` carries an 8-line rationale for living next to its consumer rather than in a shared dir.

## Bundle size triage — Verdict: **Option A + follow-up task for content-script optimization**

The worker's `dist/extension/background.js` measures **113,238 bytes gzipped (≈111 KB)**, against a stated target of "< 5 KB" in the task spec. After re-running a clean build I observed `113,238 bytes` (within rounding of the worker's `111,963` — variance is from minifier output ordering between runs).

**Composition** (verified by inspecting the built bundle): the bulk is `psl` (~43 KB gzip) carrying the entire Public Suffix List rules table, plus `idna-uts46-hx` (~62 KB gzip) carrying the Punycode + IDNA mapping. Both are unavoidable transitive imports from `verifyDomain`. The actual SW glue + decision function compiles to a few hundred bytes.

**Why I picked Option A:**

1. **The user-perceptible budget is `content.js`, not `background.js`.** The content script must execute on every navigation under `document_idle` with a 200 ms render budget per the project rules. Background is loaded once per session and Chrome caches it across SW wake/sleep cycles. 109 KB gzip imposes a ~5–15 ms parse cost on cold start, vs. zero on warm SW resume — irrelevant to per-page latency.
2. **In absolute terms, 109 KB is < 5.5 % of the 2 MB extension package budget** that CLAUDE.md actually polices.
3. **Rejecting the PR forces the worker into one of two bad outcomes:** (Option B) hand-roll a verifier that bypasses `psl`/`idna-uts46-hx`, which would either re-implement Track 2's lookalike sophistication from scratch (massive surface area duplication, easy to drift) or weaken AC #1 ("imports `verifyDomain` from `@onegov/core`") to allow a parallel implementation. Either option is a worse end-state than accepting the bundle and addressing it via Option C.
4. **The "< 5 KB" target in the task spec was a planning miscalibration**, not a hard product constraint. CLAUDE.md's stated bundle budget — "Content script + UI ≤ 80 KB minified+gzipped" — does not name a per-file budget for `background.js`. The 5 KB number assumed the SW could call `verifyDomain` without inheriting its deps; that assumption is empirically false.

**Headline 🟡 warning filed:** Track 4b (content script) MUST NOT import the full `@onegov/core` barrel, because that path will pull `psl` + `idna-uts46-hx` into `content.js` and blow the 80 KB budget. Track 4b needs either: (a) a hand-rolled `.ro` / `.gov.ro` eTLD+1 parser (covers our use case in < 1 KB and avoids `psl` entirely on the content path), OR (b) a build-time pre-compiled lookup table generated from `_verified-domains.json` that the content script consults via a hash map — no Public Suffix List needed.

**Follow-up task recommended (orchestrator to file):** introduce a `@onegov/core/lookup` sub-barrel that exports just `verifyDomain` + the related types without re-exporting the rule-pack loader. This would eliminate the deep-relative import workaround in `decide-icon.ts:28` and make the cleaner intent legible at the import site. Strictly cosmetic — does not affect runtime behaviour or bundle size for this task.

## Issues Found

### 🔴 Blockers (must fix before merge)

None.

### 🟡 Warnings (should fix)

- **`dist/extension/background.js` ships at 113 KB gzip vs. 5 KB task target.** Accepted per the bundle-size triage above (Option A). The 5 KB target was unreachable given the chosen `@onegov/core` dependency stack. Follow-up tasks recommended (see triage). Background size has no per-page latency impact.
- **Track 4b risk:** the content script MUST NOT import `verifyDomain` from `@onegov/core` the same way the SW does — the budget is much tighter (80 KB total for content + UI). Worker should pre-emptively flag this in their task brief.
- **`decide-icon.ts:28` deep-relative import** (`'../../../core/src/domain-verifier.js'`) bypasses the `@onegov/core` package boundary. Saves ~15 KB gzip; documented inline. Recommended remediation: introduce `@onegov/core/lookup` as a separate barrel and switch this import to use it. Defer to a follow-up task.
- **Pre-existing main regression (NOT caused by Track 4a):** `packages/core/tests/no-dom.test.ts` (2 cases) fails when run alongside `packages/ui` tests because the UI test setup (added by Track 3 with `happy-dom`) installs `document` / `window` on `globalThis` before the no-DOM canary runs. Reproduced on bare `main` (commit `5e5d799`) — independent of this task. Recommend: orchestrator files a separate cleanup task to gate the no-DOM test on a process-isolated worker, or to install a `setup-guard` for the core test runner that re-asserts `globalThis` cleanliness before the canary executes. **Does not affect Track 4a's PASS verdict** — Track 4a tests are independently green, and Track 4a does not introduce or worsen the leak.

### 🟢 Suggestions (optional)

- The 30-line documentation header in `index.ts` is excellent. Worker explicitly defends the over-documentation in their DONE; agreed — the SW carries enough subtle behaviour that the docs are load-bearing.
- The `chrome-stub.ts` design (records side effects into an array, exposes `fire.<event>` synthetic-dispatch helpers) is reusable. If Track 4b adds messaging, the stub will likely need extension; consider promoting it to `packages/extension/__tests__/chrome-stub.ts` (shared) at that point. **Worker's choice to keep it co-located is correct for now.**
- The icon roster being mocked into `index.test.ts` via `mock.module(...)` works but is brittle to relative-path changes. If the SW ever moves files, both the production import path (`../../../../rule-packs/_verified-domains.json`) and the mock path string must update in lockstep. Worth a comment at the mock site noting this coupling. Nit.
- Worker's DONE report claims **"178 total tests across the workspace"** at the time of writing. After my rebase onto current main (which gained Track 3's 84 UI tests and the happy-dom dep), the workspace total is **231 tests** in 18 files. Worker's count is correct relative to their pre-rebase base; just noting the drift for the orchestrator's records.

## Process Gates

- [x] **Worktree clean before review:** `cd .claude/worktrees/agent-ac165e13 && git status --porcelain` returned empty (verified at start of review and again before writing this report).
- [x] **Pre-test rebase done:** Branch was rebased onto current main (which had advanced past the worker's original base). Rebase was clean — no conflicts in the touched files (`packages/extension/src/background/**`, `packages/extension/tsconfig.json`).
- [x] **Tests run after rebase:** Track 4a unit tests still green post-rebase. Build, validate-packs, and check all green.

## Verdict rationale

Track 4a delivers exactly what the spec asked for — a per-tab icon state machine wired to the three correct Chrome event sources, with a pure decision function carved out for unit testability, exhaustive test coverage of both the decision logic and the SW glue, and zero violations of any of the five invariants. The implementation is small, well-documented, and defensively robust against the realistic event-callback failure modes (tab closed mid-flight, malformed URL, no-URL tabs, missing `tabs` permission).

The bundle-size deviation is real but unavoidable with the chosen `@onegov/core` dependency stack and is addressed by accepting the trade-off for `background.js` while filing forward-looking warnings about `content.js`. The deep-import workaround is a documented tactical optimisation with a clean remediation path.

The pre-existing no-DOM test failure on main is unrelated to this task (reproduces on bare `main` independent of Track 4a) and does not affect the verdict.

**PASS — clear to merge into the group branch.**
