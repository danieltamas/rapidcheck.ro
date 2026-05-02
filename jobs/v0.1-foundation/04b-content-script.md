# Task: Content script + popup wiring (Track 4b)

**Job:** v0.1-foundation
**Group:** extension
**Branch:** `job/v0.1-foundation/extension-content`
**Mode:** Worker (single-task)
**Touches only:** `packages/extension/src/content/**`, `packages/extension/src/popup/**`
**Depends on:** Tracks 2, 3, 4a, 5 — all merged on main

> **v0.1 = Chrome desktop ONLY.** No Firefox tooling, no `node-forge`.

---

## Mission

Wire `@onegov/core` (verifier + extractor + loader) and `@onegov/ui` (renderer) into the content script and popup. After this lands, the extension actually does its job: visit `anaf.ro` and the persona-adapted overlay renders inside a closed shadow root over the original page.

---

## ⚠️ Bundle-size warning (read carefully)

Track 4a's background.js is 109KB gzipped because `verifyDomain` from `@onegov/core` transitively pulls `psl` (43KB) + `idna-uts46-hx` (62KB). For background SW (loaded once per session) this is fine.

**For content.js the budget is 80KB gzipped TOTAL.** You cannot do a naive `import { extract, loadBundled } from '@onegov/core'` — that will blow the budget instantly.

You have three options to stay under budget:

1. **Inline-bundle the verified-domain roster + use a slim verifier path.** The content script doesn't need `verifyDomain` per se — it only runs on hosts already matched by `host_permissions`. So the verifier check is essentially "did manifest match? then yes verified, load pack". Cuts `psl`/`idna-uts46-hx` entirely.
2. **Background SW does the verification, posts a message to content script telling it which pack to load.** Requires `chrome.runtime.sendMessage` glue but keeps content script tiny.
3. **Lazy-import** the heavy modules only when actually needed at runtime via dynamic `import()`. Less effective in extension contexts; not recommended.

**Strongly prefer option 2** — clean separation: background SW owns verification (already implemented in Track 4a), content script owns extraction + rendering, communicate via `chrome.runtime.sendMessage`.

---

## Acceptance criteria

### Content script (`packages/extension/src/content/index.ts`)

- [ ] Replaces the empty Track 1 stub
- [ ] On `document_idle` (already in manifest):
  1. Send a message to the background SW: `{ type: 'get-status', tabId }` (or just rely on background having already classified — see option 2 above)
  2. If response is `verified`, request the rule pack: `{ type: 'load-pack', domain }`
  3. If pack found, find a matching route by pathname regex
  4. Wrap `document` in a `SerializableDoc` adapter (the boundary that keeps `@onegov/core` DOM-free)
  5. Call `extract(rules, doc, location.href)` from `@onegov/core` → `SemanticTree`
  6. Read persona from `chrome.storage.local` (default `'standard'`)
  7. Create shadow host: `<div id="onegov-root" data-onegov="1">`, append to `<body>`
  8. Attach **closed** shadow root: `host.attachShadow({ mode: 'closed' })`
  9. Mount via `render(tree, persona, shadow)` from `@onegov/ui`
  10. Subscribe to `chrome.storage.onChanged`: persona switch → re-render; showOriginal toggle → set `host.style.display`

### Background SW updates (in scope for this task)

- [ ] Add `chrome.runtime.onMessage` handlers:
  - `get-status` → return current `DomainStatus` for the tab's URL
  - `load-pack` → call `loadBundled(domain, fetcher)` where `fetcher = (path) => fetch(chrome.runtime.getURL(path)).then(r => r.json())` and return the `RulePack` (or `null`)
- [ ] Existing icon state machine UNCHANGED (Track 4a is golden)

### Popup (`packages/extension/src/popup/index.tsx`)

- [ ] Replaces the empty Track 1 stub
- [ ] Status pill at top showing current state per the active tab:
  - "✅ Site oficial verificat" (green)
  - "⚪ Site nesuportat" (gray)
  - "🚨 Atenție — domeniu suspect" (red)
- [ ] Persona picker: 4 buttons in a 2×2 grid, with one-line Romanian descriptions:
  - `pensioner` — "Tipar mare, simplu"
  - `standard` — "Implicit"
  - `pro` — "Compact, taste rapide"
  - `journalist` — "Tabele largi, copiere CSV"
- [ ] Picking a persona writes to `chrome.storage.local` (`{ persona: '...' }`); content script's listener picks it up and re-renders within 500ms
- [ ] "Afișează site-ul original" toggle: writes `{ showOriginal: boolean }` to storage; content script hides/shows the shadow host
- [ ] Footer: "Despre", version number from `manifest.json`, link to GitHub

### `SerializableDoc` adapter

- [ ] In `packages/extension/src/content/serializable-doc.ts`: a thin adapter wrapping a real `Document` (or any subtree) into the `SerializableDoc` interface from `@onegov/core/types`. ~30 lines.
- [ ] Unit tests: synthetic `Document` (via happy-dom or a minimal mock) → adapter → confirms `query`, `queryAll`, `attr`, `text`, `children` all behave correctly.

---

## Required tests

In `packages/extension/src/content/__tests__/`:

- [ ] `serializable-doc.test.ts` — adapter behavior (~10 cases)
- [ ] `index.test.ts` — content script lifecycle: shadow host appended on verified domain, NOT appended on off-list, persona-change triggers re-render (with chrome stub)

In `packages/extension/src/popup/__tests__/`:

- [ ] `index.test.tsx` — popup renders, persona picker writes to storage, showOriginal toggle works
- [ ] Status pill reflects the current `DomainStatus` from background SW

In `packages/extension/src/background/__tests__/`:

- [ ] Extend with new message-handler tests for `get-status` and `load-pack`

---

## Hard constraints

- **The five invariants are LIVE for this task.** Especially:
  - **#1 Original DOM untouched:** only the appended `<div id="onegov-root">` differs. After this task, write a smoke E2E test (or document it as a follow-up if time-bound) that snapshots `documentElement.outerHTML` before/after activation and asserts the diff contains only the appended host.
  - **#3 No remote code:** rule packs are JSON, no `eval`, no `Function`, no `dangerouslySetInnerHTML`, no `innerHTML =` with rule-pack-derived data.
  - **#4 No external network:** the only `fetch` is against `chrome.runtime.getURL(...)`. NO outbound to the gov sites or anywhere.
  - **#5 Escape:** showOriginal toggle hides the host completely.
- **Closed shadow root:** `mode: 'closed'`. Never `'open'`.
- **Bundle budget:** `dist/extension/content.js` gzipped ≤ 80 KB. `dist/extension/popup.js` gzipped ≤ 60 KB. Hard limits.
- **No new dependencies.**
- **No `chrome.*` outside `packages/extension/`.**
- **Pre-merge gate:** `git status --porcelain` returns empty before reporting DONE (NEW SOP per CLAUDE.md §Branching & Merge Protocol rule 6).
- TypeScript strict, no `any`. MAX 500 lines per file.
- English in code; Romanian only in user-facing UI strings (popup labels, status pill).
- Conventional Commits; no `Co-Authored-By`.

---

## What you will report back

After completion, write `jobs/v0.1-foundation/DONE-04b-content-script.md` per `CLAUDE.md §Step 4`.

In the summary:
1. Branch + commit hashes
2. `git status --porcelain` (must be empty)
3. Tail of `bun run check`, `bun run test`, `bun run build`
4. content.js + popup.js + background.js gz sizes
5. node-forge count (must be 0)
6. Manual smoke result if you can drive Chrome: load `dist/extension/`, navigate to `anaf.ro`, confirm overlay renders and `chrome://extensions` errors panel is empty. Defer to reviewer if can't.
7. Deviations + justification
8. Files changed count

Be terse.

---

## Out of scope

- Anti-phishing toast on red state (v0.2)
- First-run onboarding (v0.2)
- E2E DOM-integrity test in Playwright (separate follow-up `04c-playwright-e2e-bootstrap.md`)
- Form bridging (v0.2)
- AI fallback (v0.2)
