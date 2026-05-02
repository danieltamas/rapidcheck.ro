# Review: Content script + popup wiring (Track 4b)

**Task:** 04b-content-script.md | **Reviewer verdict:** PASS | **Date:** 2026-05-02
**Branch reviewed:** `job/v0.1-foundation/extension-content` (rebased onto main locally as `review/04b-content-script` for parity).
**Worker worktree:** `/Users/danime/Sites/onegov.ro/.claude/worktrees/agent-a220286e` — verified clean (`git status --porcelain` returns empty).
**Rebase:** clean — Track 4b only touches `packages/extension/`; no conflicts with Track 4a / Track 5 / Track 6 commits on main.

## Headline: the five invariants are now LIVE — all five hold

| # | Invariant | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Original DOM untouched | **HOLDS** | Single `appendChild` (`content/index.ts:155`) for the shadow host. Zero `removeChild`/`replaceChild`/`insertBefore`/`insertAdjacent*`. Tests assert `documentElement.outerHTML` byte-equality on unknown/lookalike paths (`__tests__/index.test.ts:107-110, 131-134`) and per-element `outerHTML` byte-equality on the happy path (`__tests__/index.test.ts:208-218`). MutationObserver only mentioned in a comment, never instantiated. |
| 2 | No form data | **HOLDS** | Greps for `FormData / .elements / requestSubmit / .submit( / HTMLFormElement` against production code yield only documentation comments stating the rule. `SerializableEl` exposes neither `.value` nor `.elements`. |
| 3 | No remote code | **HOLDS** | Zero `eval / new Function / setTimeout(string) / setInterval(string) / outerHTML = / document.write`. The only `innerHTML =` matches in production are doc comments; in tests, only static literals (no rule-pack data flows through). The `<script type="module" src="popup.js">` in `popup.html` is the standard popup-bundle entry point, not an injection vector. Rule-pack data is rendered exclusively through Preact JSX (escaped). |
| 4 | No external network | **HOLDS** | Single `fetch()` call in production code: `background/messaging.ts:63 — await fetch(chrome.runtime.getURL(path))`. Bundle inspection (`grep -E "fetch\\(\|XMLHttpRequest\|WebSocket" dist/extension/*.js`) confirms exactly one `fetch` site post-build, against `chrome.runtime.getURL`. External URLs in the bundle are `source` strings inside the verified-domain roster (data, not network calls). |
| 5 | Escape hatch | **HOLDS** | Popup writes `{ showOriginal: boolean }` to `chrome.storage.local`. Content script's `chrome.storage.onChanged` listener flips `host.style.display = 'none'` on `true`, `''` on `false` (`content/index.ts:192-195`). Initial-load hidden case covered (`__tests__/index.test.ts:247-258`). Live toggle covered (`__tests__/index.test.ts:223-245`). |

## Tests

- [x] All unit tests pass — **282 across the project** (113 core + 84 ui + 85 extension), 0 fail, 457 expect() calls. The 51 new + updated test cases the worker added land cleanly (extension grew 34 → 85).
- [x] All rule packs validate — `bun run validate-packs` → "OK — 7 file(s) checked".
- [x] `bun run check` → no errors.
- [x] `bun run build` → all three bundles emit.

## Build artifacts

| Bundle | Raw | gzipped | Cap | Margin |
| --- | --- | --- | --- | --- |
| `dist/extension/content.js` | 32,826 B | **11,185 B** | 80 KB | uses ~14% of cap |
| `dist/extension/popup.js` | 21,494 B | **7,378 B** | 60 KB | uses ~12% of cap |
| `dist/extension/background.js` | 523,360 B | **129,036 B** | n/a (Track 4a accepted) | +20 KB vs Track 4a (Zod pulled in via `loadBundled`, expected) |
| Total `dist/extension/` (all files) | **1,914,726 B (~1.83 MB)** | n/a | 2 MB | 8.7% headroom |

Bundle artefacts present (`find dist/extension -type f | sort`): manifest, background.js, content.js, popup.{html,js,css}, 9 PNG icons, **all 7 rule-pack JSONs** (`_verified-domains.json` + 6 site packs).

`bun pm ls 2>&1 | grep -ci node-forge` → **0**.

## Permission discipline

- [x] Manifest unchanged from main — no `permissions` or `host_permissions` additions. (`git diff main..HEAD -- packages/extension/src/manifest.json` is empty.)
- [x] `web_accessible_resources` still narrow: only `rule-packs/*.json`.

## Cross-package boundary

- [x] No `chrome.*` outside `packages/extension/` — all matches in `core/` and `ui/` are documentation comments.
- [x] Worker uses deep-relative imports for `extract` / `applyPersonaOverrides` (`content/index.ts:54-55`) and `verifyDomain` (`background/messaging.ts:35`). This is the same bundle-size discipline Track 4a established for the SW; without it the content barrel pulls `psl + idna-uts46-hx + Zod` (~110 KB gz) and blows the 80 KB cap. Verified empirically: `grep -E "psl\|idna\|punycode\|zod" dist/extension/content.js` returns 0 matches. Acceptable.

## Code quality

- [x] No `any` types anywhere in `packages/extension/src/`.
- [x] No file > 500 lines (largest is `content/__tests__/index.test.ts` at 298).
- [x] Conventional commits, no `Co-Authored-By` (`git log main..HEAD --format="%B" | grep -i co-authored` → empty).
- [x] `mode: 'closed'` literal at `content/index.ts:156`. Zero `mode: 'open'` matches.
- [x] No `dangerouslySetInnerHTML` outside doc comments.
- [x] Closed shadow root verified empirically by tests (`host.shadowRoot === null`).
- [x] `messages.ts` exposes a typed cross-context contract (`GetStatusRequest / GetStatusReply / LoadPackRequest / LoadPackReply`); content + popup + background all consume the same types.
- [x] `serializable-doc.ts` adapter (`packages/extension/src/content/serializable-doc.ts`) is ~30 LOC, lazy children + caching, never mutates the wrapped node, scoped query/queryAll, defensive against invalid selectors. 15 unit tests cover the contract.
- [x] Vite `rule-packs/*.json` copy follows the existing `copyIfChanged` pattern in the same plugin (`vite.config.ts:96-105`). Clean addition.

## Issues Found

### 🔴 Blockers (must fix before merge)
None.

### 🟡 Warnings (should fix)
None.

### 🟢 Suggestions (optional, do not block merge)

- `packages/extension/src/background/decide-icon.ts:21-27` — the comment claims "the SW never validates a rule pack itself (the content script does that)". Track 4b changed this: the SW's `messaging.ts` calls `loadBundled` which pulls Zod into the SW bundle. The deep-relative-import optimisation still saves bytes (verifier-only path), but the rationale paragraph is now stale. Consider tightening the comment in a follow-up.
- `dist/extension/rule-packs/_verified-domains.json` is exposed via `web_accessible_resources` because the manifest pattern is `rule-packs/*.json`. The roster is open-source data so this isn't a security issue, but a hostile page could fingerprint that the extension is installed by `fetch(chrome.runtime.getURL('rule-packs/_verified-domains.json'))`. If you ever care about install-detection resistance, you could narrow the manifest pattern to exclude underscore-prefixed files (`rule-packs/[a-z0-9]*.json` or similar). Pre-existing condition, not introduced by 4b — flag, do not block.
- `popup/index.tsx` initially renders with `useState(false)` for `showOriginal` and then hydrates from storage in a `useEffect`. There's a one-microtask flash from unchecked → checked when storage already has `true`. Acceptable for v0.1; an `Initial`-style synchronous read or a Suspense-style guard could remove it later.

## Manual smoke (deferred)

The Playwright MCP available in this environment cannot load unpacked Chrome extensions (only navigates to URLs / runs evaluate against existing pages). The worker's automated coverage is comprehensive — `documentElement.outerHTML` byte-equality, persona switch, escape hatch, all message-handler paths. Manual unpacked-load smoke remains a recommended pre-tag step:

1. `bun run build`
2. `chrome://extensions` → Developer mode → Load unpacked → `dist/extension/`
3. Navigate to `https://www.anaf.ro/anaf/internet/ANAF/` — expect green icon + overlay
4. Open popup, switch to `pensioner` — expect overlay re-render with larger type
5. Toggle "Afișează site-ul original" — expect overlay vanishes; original page interactive
6. `chrome://extensions` errors panel — expect empty
7. DevTools Network tab — confirm zero outbound requests originated by the extension

## Worker DONE-report verification

- [x] Branch + commits match (5 commits on `job/v0.1-foundation/extension-content`, all conventional).
- [x] `git status --porcelain` empty in worker worktree.
- [x] Tail of check / test / build matches the rerun in this review.
- [x] Bundle sizes match (11,185 B / 7,378 B / 129,036 B gzipped).
- [x] `node-forge` count 0.
- [x] DONE-report claims align with the implementation; no overstated coverage.

---

## Summary

Worker shipped a textbook Track 4b: clean integration, the five invariants demonstrably hold (with empirical tests, not just doc comments), bundles well under cap, no permission creep, no new dependencies, no `chrome.*` leakage. The architectural choice to route verifier + Zod through the SW (option 2 in the task spec) was the right call and the implementation is clean. Three minor 🟢 suggestions, no warnings, no blockers. **PASS.**
