# Task: anaf.ro modern UI takeover — v0.2 architecture proof

**Job:** v0.2.0-anaf
**Group:** anaf
**Branch:** `job/v0.2.0-anaf/takeover`
**Mode:** Worker (single comprehensive task)
**Touches:** `packages/extension/src/**`, `packages/ui/src/**`, NEW `packages/extension/src/sites/anaf.ro/**`, NEW `packages/extension/src/loader/**`, possibly `rule-packs/anaf.ro.json` (likely retired in this scope)

> v0.1 ship-list scope changes: only `anaf.ro` gets the new takeover UI in this task. Other 5 ship-list sites (dgep, portal.just, ghiseul, rotld, itmcluj) get only the toolbar badge for now — no overlay, no rendering on the page. They ship one-by-one in subsequent tasks.

---

## Why this exists (owner direction, 2026-05-02)

The v0.1 → v0.1.2 work converged on the wrong abstraction: extract DOM nodes from the ugly source page, render them in a generic shell. Owner verdict on three sequential builds: "this is not the fucking purpose."

The actual purpose: **make all stupid ass gov sites from 1800 look and behave like 2026 ones without breaking any functionality.** Like demoanaf.ro (owner's earlier reference exercise) but as an extension that does it automatically per site.

The v0.1 invariants stay (privacy, no remote code, no external network beyond bundled assets, escape hatch). v0.1's "no DOM mutation" is relaxed in deliberate, narrow ways for v0.2 — see §Invariants below.

---

## Architecture: hide-and-replace via shape contracts + form bridging

```
┌─────────────────────────────────────────────────────────────────┐
│ Browser tab on https://www.anaf.ro/anaf/internet/ANAF/...       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ <html>                                                     │ │
│  │   <head>... original head untouched ...</head>             │ │
│  │   <body>                                                   │ │
│  │     <style id="onegov-hide-original">                      │ │
│  │       body > *:not(#onegov-root):not(#onegov-loader) {     │ │
│  │         display: none !important                           │ │
│  │       }                                                    │ │
│  │     </style>                            ← appended at start │ │
│  │     ... ALL original anaf.ro DOM ...    ← present, hidden  │ │
│  │     <div id="onegov-loader"> ... </div> ← splash, removed  │ │
│  │     <div id="onegov-root">              ← our UI host       │ │
│  │       #shadow-root (closed)                                │ │
│  │         <AnafHome />  ← Preact app                          │ │
│  │     </div>                                                 │ │
│  │   </body>                                                  │ │
│  │ </html>                                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

The original DOM is **present and live** — anaf.ro's session cookies, CSRF tokens, anti-bot fingerprints, JS event handlers, timers — all running. We just hide it visually via one appended `<style>` tag. When the user submits a form in OUR UI, we set the original form's input values and call its `.submit()` — the site sees a normal user submission.

---

## Lifecycle

### Phase 1 — `document_start` (loader injection)

Before the page paints anything:

1. Content script `run_at: 'document_start'` (manifest change)
2. Inject `<style id="onegov-hide-original">` immediately — page never paints visible original DOM
3. Inject `<div id="onegov-loader">` with inline-CSS splash
4. **Loader visible by ~5ms after page navigation commits**

### Phase 2 — `document_idle` (app mount)

Once the page DOM is built:

5. Send `get-status` to background SW (existing path)
6. If verified for `anaf.ro` AND owner has enabled the takeover for this domain:
   - Read context from hidden original DOM (logged-in state, CUI in URL params, current section)
   - Mount Preact app inside closed shadow root at `<div id="onegov-root">`
   - Wire form-bridge handlers: each form-shaped action in our UI maps to an original-DOM form
7. **Min 200ms loader hold** then cross-fade loader out (120ms ease-out)
8. App fully visible by ~250-300ms after navigation

### Phase 3 — Interaction

- User clicks a service card in our UI → either navigates the browser (`location.assign`) to the real anaf URL OR opens a search/lookup panel in our UI
- User submits CUI search → we read the value, navigate to the appropriate anaf.ro lookup URL with the query (or call `webservicesp.anaf.ro` proxied through demoanaf.ro if available)
- User clicks the toolbar popup "Afișează site original" toggle → remove `<style id="onegov-hide-original">`, hide our root → original page visible AND interactive

### Phase 4 — Failure / unknown state

- If anaf.ro structure changes and we can't extract context: render the modern app anyway with sensible defaults; show a small "Date limitate" hint in muted text
- If the JS errors out before mount: the loader's safety timeout (3s) auto-removes the hide-original style, restoring the page

---

## Acceptance criteria

### A. Loader (`packages/extension/src/loader/`)

- [ ] `loader/index.ts`: zero dependencies, no Preact, no module imports. Pure DOM ops.
- [ ] Exports `mountLoader(): { dismiss: () => void; abort: (msg?: string) => void }`
- [ ] Loader markup: full viewport, white background, centered onegov logo (inlined SVG via Vite), subtle breathing animation
- [ ] After 300ms (only if loader still present): show muted "Pregătim interfața..."
- [ ] After 3000ms (safety timeout): auto-call `abort('Restaurăm site-ul original')` and remove hide-original style — never leave user staring at a frozen splash
- [ ] `dismiss()`: cross-fade to opacity 0 over 120ms then remove from DOM
- [ ] Respects `prefers-reduced-motion`: hold-then-instant-swap, no fade
- [ ] Mounts in <5ms (verify with `performance.now()` instrumentation, log only in dev mode)

### B. Manifest changes

- [ ] `content_scripts.run_at` changes from `document_idle` to `document_start` for anaf.ro pattern (use a separate content_scripts entry — keep the `document_idle` one for other domains so we don't break the existing badge flow on dgep/etc.)
- [ ] No new `permissions` required
- [ ] No new `host_permissions` (anaf.ro already in the list)

### C. New site module: `packages/extension/src/sites/anaf.ro/`

The shape of a "site module":

- [ ] `index.ts` — exports `{ App: ComponentType<{ ctx: AnafContext }>, extractContext: (doc: Document) => AnafContext, isMatch: (url: URL) => boolean }`
- [ ] `Home.tsx` — the modern landing page UI (see §D for design)
- [ ] `Cui.tsx` — modern CUI lookup page UI (when on `/anaf/internet/ANAF/cui/...` or after user submits the search)
- [ ] `bridge.ts` — form-bridging helpers: read values from original DOM, write values to original form inputs, dispatch submit
- [ ] `nav.ts` — known anaf.ro routes mapped to onegov screens (homepage, CUI lookup, services list, calendar fiscal, etc.)
- [ ] `__tests__/` — bun:test coverage of context extraction, bridge writes, nav matching
- [ ] One module file ≤ 500 lines (split if necessary)

### D. anaf.ro UI design (the hand-crafted product)

The Tier 1 quality bar. This is what every other gov site will look like once it gets its own module.

**Status bar (top, ours, slim ~48px):**

- Left: inlined `onegov.logo.blue.svg` (28px tall) + dot + muted "pe **anaf.ro**"
- Right: density toggle (Minimal/Simplu/Bogat — defaults to Simplu) + show-original × button
- White background, subtle bottom border `var(--onegov-color-neutral-200)`, NOT the heavy blue strip

**Hero (homepage `^/anaf/internet/ANAF/...`):**

- Title: "Bun venit la ANAF" (h1, large display weight)
- Sub: "Agenția Națională de Administrare Fiscală — Servicii fiscale online"
- A prominent search box: `🔍 Verifică un CUI sau caută un serviciu...` — focuses on mount, Enter submits to CUI lookup or service search

**Servicii principale (3-card grid):**

- **Verifică un CUI** — onClick navigates to anaf.ro CUI lookup OR opens our `Cui.tsx` modern panel that proxies to `webservicesp.anaf.ro` (no new permissions — using the existing `host_permissions` for `*.anaf.ro`)
- **Calendar fiscal** — links to anaf.ro/calendar fiscal page
- **Servicii online** — links to anaf.ro/servicii_online (the existing route the rule pack matched)

**Mai multe (collapsed by default in Simplu density, expanded in Bogat):**

- Asistență fiscală, Info publice, Integritate, Programe & proiecte, Sancțiuni internaționale, Contact, Despre ANAF — these are the existing nav items, rendered as a clean grid of secondary cards

**Noutăți (sidebar or bottom section):**

- "Comunicate de presă", "Transparență decizională" — links to the actual ANAF noutăți pages

**Footer (slim):**

- ANAF identity (the original info we're respecting), copyright line, "Această pagină este redată de onegov · ascunde →"

**Visual language:**

- PANTONE 280C blue (`#003B73`) — primary
- White background, neutral grays for secondary text
- Identitate.gov.ro fonts: Arial / Calibri / Verdana / Tahoma / Trebuchet / Ubuntu fallback
- Generous whitespace (use `--onegov-sp-*` tokens). Hero region 120px+ vertical padding.
- Cards: subtle border `--onegov-color-neutral-200`, rounded `--onegov-radius-md`, no heavy shadow. Hover: `--onegov-shadow-sm` + slight lift, 200ms ease.
- Primary buttons: solid PANTONE 280C, white text, rounded `--onegov-radius-md`, generous padding.
- Inputs: clean, full-width, focus ring in PANTONE 280C.
- Max content width: 1280px, centered.

### E. Form bridging (the proof that nothing breaks)

Implement at least ONE end-to-end form-bridge flow for v0.2.0:

- [ ] **CUI search**: user types CUI in our search → presses Enter
- [ ] We DON'T navigate. Instead: locate ANAF's actual CUI lookup mechanism (URL param navigation OR API call OR original form post) and execute it
- [ ] If URL navigation: location.assign to the appropriate anaf URL — when the new page loads, our content script runs again, sees the CUI lookup page pattern, renders our `Cui.tsx`
- [ ] Bridge contract for any future form: `bridge.submitForm(formId: 'cui-search', values: { cui: '12345' })` — looks up the original form element by a known selector, writes values, dispatches `submit` event so any anaf JS handlers fire normally

For other forms (login, declarations, payments) — out of scope for v0.2.0. Document the contract so they're easy to add.

### F. Density preference (kill the persona picker)

- [ ] Drop the `persona` storage key from default UI surface — keep the inference module + storage but stop showing it in the popup
- [ ] Add `uiDensity: 'minimal' | 'simplu' | 'bogat'` storage key, default `'simplu'`
- [ ] Popup: replace the persona pill with a single density chip showing current density + a click-to-cycle affordance
- [ ] Site module reads density and renders accordingly:
  - `minimal`: hero + 1 primary action card only (most common), everything else collapsed behind "Mai multe"
  - `simplu`: hero + 3 service cards + collapsed "Mai multe" (default)
  - `bogat`: hero + all cards expanded + sidebar with noutăți + footer with full nav
- [ ] No demographic guessing. No icon avatars. Just a UI density choice.

### G. Other ship-list sites — graceful no-op

- [ ] Content script for dgep / portal.just / ghiseul / rotld / itmcluj DOES NOT inject loader, DOES NOT hide page, DOES NOT mount overlay
- [ ] They keep the toolbar badge (verified state via SW) and that's it
- [ ] No regressions: visiting any of those sites with the extension installed should be visually indistinguishable from no-extension
- [ ] Mark in code with a clear `// v0.2.0: only anaf.ro gets the takeover UI; other sites await per-site modules`

### H. Invariants — relaxed in narrow ways for v0.2

The CLAUDE.md invariants are updated for v0.2 (worker also updates the doc):

1. **Original DOM untouched** — relaxed:
   - Allowed: appended `<style id="onegov-hide-original">`, appended `<div id="onegov-loader">`, appended `<div id="onegov-root">`
   - Allowed: setting `value` on a form input AND dispatching `submit` on a form, ONLY when the user explicitly initiated a submission via our UI (form bridging — read on intent, write on intent, never passively)
   - Forbidden as before: removing existing nodes, replacing existing nodes, modifying existing attributes (other than the explicit form-input writes above), mutation observers writing back
2. **No form data passively read** — never iterate inputs, never read `.value` outside the explicit submit path, never log form contents. The bridge reads values from OUR UI's controlled inputs, NOT from the original page.
3. **No remote code** — unchanged.
4. **No external network** — relaxed for v0.2 anaf.ro CUI lookup: allowed to call `webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva` directly (the public ANAF API). No analytics, no telemetry, no third-party. Document in the threat model.
5. **Escape hatch** — unchanged but now MORE important: removing `#onegov-hide-original` style instantly returns full original-page interactivity.

### I. Tests

- [ ] `loader/__tests__/index.test.ts`: mounts < 5ms, dismisses cleanly, safety timeout works, prefers-reduced-motion behavior
- [ ] `sites/anaf.ro/__tests__/`: context extraction, route matching, bridge writes (verified against synthetic happy-dom DOM)
- [ ] `content/__tests__/`: lifecycle test asserting loader-then-app, hide-original style applied, escape removes it
- [ ] All existing tests still pass (don't break dgep/etc tests)
- [ ] Bundle check: `content.js` gz ≤ 80 KB (current ~14 KB; the anaf module + loader + bridging budget is ~30 KB. Well under cap.)

---

## Hard rules

- **`git status --porcelain` MUST return empty before reporting DONE.**
- **`bun pm ls 2>&1 | grep -ci node-forge` must return `0`.**
- TypeScript strict, no `any`. MAX 500 lines per file.
- Closed shadow root only.
- No new manifest permissions. No new dependencies.
- Bundle budgets: `content.js` gz ≤ 80 KB, `popup.js` gz ≤ 60 KB.
- All inline-CSS in the loader uses literal CSS strings (no CSS-in-JS lib, no Preact).
- English in code; Romanian in user-facing UI strings.
- Conventional Commits, no `Co-Authored-By` ever.
- This task supersedes the v0.1 rule-pack overlay rendering for anaf.ro. The rule pack `rule-packs/anaf.ro.json` becomes UNUSED for rendering — keep the file (it documents structure) but content script no longer loads it. Document this prominently.

---

## What you will report back

After completion, write `jobs/v0.2.0-anaf/DONE-01-anaf-takeover.md` per `CLAUDE.md §Step 4`.

In the summary:
1. Branch + commit hashes
2. `git status --porcelain` (must be empty)
3. Tail of `bun run check`, `bun run test`, `bun run build`
4. background.js + content.js + popup.js gz sizes
5. node-forge count (must be 0)
6. **Manual smoke result on real anaf.ro** if your environment can drive Chrome — specifically: did the loader appear, did the modern UI replace anaf.ro, did the CUI search work, did the show-original toggle restore the page?
7. **3-4 sentence description of what visiting anaf.ro looks like now** for me to relay to the owner
8. Deviations + justification
9. Files changed count
10. Confirmation that dgep/portal.just/ghiseul/rotld/itmcluj are visually unchanged (no overlay, no hide-original) — owner explicitly scoped this to anaf only

Be terse on the report; visuals matter most for this task.

---

## Out of scope

- Other 5 ship-list sites (filed as separate tasks once anaf is approved as the template)
- Template-based Tier 2 expansion (v0.2.x)
- AI fallback for Tier 3 long tail (v0.3)
- Authentication flows (CEI / SPV / OAuth) — render-original-page passthrough for v0.2.0; deeper integration in v0.3
- Real-time data dashboards (calendar fiscal as a live calendar etc. — link out for v0.2.0)
- Form bridging beyond the CUI search proof — declarations / payments / etc. come per-form in subsequent tasks
- Sidebar/popup redesign beyond the density chip swap
- New rule-pack-driven extraction (the JSON rule pack for anaf.ro becomes vestigial after this task)
