# Task: Icon state machine in background SW (Track 4a)

**Job:** v0.1-foundation
**Group:** extension
**Branch:** `job/v0.1-foundation/extension-icon`
**Mode:** Worker (single-task — minimal patch)
**Touches only:** `packages/extension/src/background/index.ts`
**Depends on:** Track 2 merged to main (real `verifyDomain` available)

> **Purpose:** earliest visible signal in the extension. After this lands, the browser action icon turns green on verified Romanian gov domains, gray on off-list, red on lookalikes. Demo-able even before content script and rule packs are wired.

---

## Mission

Replace the Track 1 scaffold log in `packages/extension/src/background/index.ts` with the full per-tab icon state machine described in `SPEC.md §5.3 / Background service worker`. ~50 lines. No UI changes, no content-script changes, no popup changes — this is a background-only patch.

---

## Acceptance criteria

- [ ] Imports `verifyDomain` from `@onegov/core`
- [ ] Imports the bundled verified-domain roster (use `chrome.runtime.getURL` + `fetch` to load `rule-packs/_verified-domains.json`, OR import the JSON statically via Vite — Vite supports JSON imports natively; the latter is simpler and ships the roster inline so the SW has it without any network round-trip even for the bundled case)
- [ ] On `chrome.webNavigation.onCommitted` (top frame only — `frameId === 0`):
  - Parse hostname from `details.url`
  - Run `verifyDomain(hostname, list)`
  - Call `chrome.action.setIcon({ tabId, path: { 16, 32, 48 } })` with the right color
- [ ] Color mapping: `verified` → `green`, `lookalike` → `red`, `unknown` → `gray`
- [ ] Icon paths use the existing `icons/{green,gray,red}-{16,32,48}.png`
- [ ] **No background polling, no `setInterval`, no `setTimeout`.** Service worker idles.
- [ ] No network requests other than the rule-pack roster load (and that should be inline JSON import — verify with the network-audit assertion that there's nothing else)
- [ ] On `chrome.tabs.onActivated`, re-apply the icon for the newly-active tab (since `setIcon` is per-tab, switching back to a tab the SW hasn't seen since restart needs a refresh — query `chrome.tabs.get(tabId)` and re-verify)
- [ ] On extension install/update (`chrome.runtime.onInstalled`), iterate `chrome.tabs.query({})` and apply the correct icon to each open tab (so existing tabs get the right color on first install)

---

## Required tests

In `packages/extension/src/background/__tests__/index.test.ts` using a chrome.* stub (you may need to write the stub if it doesn't exist; it can be a small file co-located in the same `__tests__/` dir):

- [ ] `webNavigation.onCommitted` callback wires through to `setIcon` with the right color for a verified domain
- [ ] Same for a lookalike (red)
- [ ] Same for an off-list (gray)
- [ ] `frameId !== 0` events are ignored
- [ ] Malformed URL doesn't crash the SW (defensive)
- [ ] `tabs.onActivated` re-applies icon

If `bun:test` plus a hand-rolled chrome stub feels heavy for a background SW, consider extracting the pure decision function into `packages/extension/src/background/decide-icon.ts` (signature: `decideIcon(url: string, list: VerifiedDomainList): 'green' | 'gray' | 'red'`) and unit-testing that directly. The SW just becomes the `chrome.*` glue around it. **Strongly preferred.**

---

## Hard constraints

- **No new dependencies.**
- **No `node-forge`** in deps.
- **No content-script changes, no popup changes, no manifest changes** beyond what's already there. If you find the manifest needs adjustment (e.g. you discover `chrome.tabs.onActivated` requires a permission the v0.1 set doesn't have), STOP and report — that's an orchestrator-approval task.
- **No new `permissions`** in the manifest. The existing set (`storage`, `scripting`, `activeTab`, `webNavigation`) is sufficient. `chrome.tabs.query()` works without the `tabs` permission for the limited fields you need.
- **Bundle size:** background.js stays small (< 5KB minified+gzipped — assert in your DONE report).
- TypeScript strict, no `any`. MAX 500 lines per file.
- English; Conventional Commits; no `Co-Authored-By`.

---

## What you will report back

After completion, write `jobs/v0.1-foundation/DONE-04a-icon-state-machine.md` per `CLAUDE.md §Step 4`.

In the summary:
1. Branch + commit hashes
2. Tail of `bun run check`, `bun test`, `bun run build`
3. `du -sh dist/extension/background.js` and gzipped size
4. `bun pm ls 2>&1 | grep -ci node-forge` (must be 0)
5. Screenshot or "manual smoke deferred" for: green icon on `anaf.ro`, gray on `google.com`, red on a synthetic lookalike domain you can construct via `/etc/hosts` or a query-string-encoded test (e.g. `https://anaf-portal.ro/` if it resolves; if not, just document that the unit tests cover the decision logic)
6. Deviations + justification
7. Files changed count

Be terse.

---

## Out of scope

- Content script wiring (Track 4b)
- Popup business logic (Track 4b)
- Anti-phishing toast on red state (v0.2)
- Persona switch propagation (Track 4b)
