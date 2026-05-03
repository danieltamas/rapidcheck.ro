# Task: v0.3 — page-replacement architecture + fara-hartie design system + anaf rewrite

**Job:** v0.3-prebaked
**Group:** architecture
**Branch:** `job/v0.3-prebaked/architecture-rewrite`
**Mode:** Worker (multi-commit, sequential, foundational rewrite)

> Owner verdict on v0.2 architecture (live DOM extraction + closed shadow root + hide-original toggle): rejected. Owner verdict on v0.2 design system (50 generic components): rejected. v0.3 is a clean rewrite per the rules in CLAUDE.md §R1–§R6.

---

## ⚠️ READ FIRST

1. **`CLAUDE.md`** — START GATE. Read §READ FIRST + §NON-NEGOTIABLE PRODUCT RULES (R1–R6). The rules are the contract.
2. **`docs/LOG.md`** — full **OWNER FEEDBACK JOURNAL** at the end. Five strategic pivots in 48 hours; understand WHY before writing code.
3. **The reference site**: open `https://fara-hartie.gov.ro` in a browser. Match its proportions, easings, button radii, accordion animation, color usage. Do NOT invent a visual identity.
4. The previous v0.3 worker was killed mid-flight. Their unfinished work is in branch `worktree-agent-a70501de` if useful for reference, but **do not blindly continue from it** — owner rules R1–R6 are new.

---

## The six rules (verbatim summary — full text in CLAUDE.md)

- **R1.** PRESERVE INSTITUTION BRANDING. Every reskin keeps the institution's logo + full Romanian name + accent color in the visible header. Onegov is a small "Optimizat de" byline, never the headline.
- **R2.** Design system mirrors `fara-hartie.gov.ro`. Pill buttons, single-open smooth accordion, soft cards with icon-square at left, navy + yellow + red RO colors, lavender section background, white card surfaces.
- **R3.** Toggles work LIVE — no page refresh.
- **R4.** Every nav / card click MUST do something. Either render our version of the destination page, or show a clear "În curând — deschide pe <institution>.ro" placeholder with a working link.
- **R5.** Existing v0.2 design system needs rewriting. Rebuild Button / Card / Hero / Header / Footer / Accordion / AppShell / NavGrid / Inputs to match fara-hartie.
- **R6.** REPLACE the page. No shadow root. No hide-original style. No "show original" toggle. Mutate `document.body`. Per-site disable lives in popup.

---

## Architecture (post-rules)

```
┌────────────────────────────────────────────────────────────────────┐
│ packages/crawler/  (offline, NEVER ships in extension)             │
│  Visits each gov site → extracts pages, services, nav, forms,      │
│  endpoints, INSTITUTION BRANDING (logo URL, full name, colors)     │
│  Output: packages/site-data/<domain>.json                          │
└────────────────────────────────────────────────────────────────────┘
                            │
                            ▼ (committed, version-controlled)
┌────────────────────────────────────────────────────────────────────┐
│ packages/site-data/  (JSON per site, BUNDLED in extension)         │
│  anaf.ro.json — pages + branding (logo URL, full name, color)      │
│  + assets/ (logos pre-fetched/inlined as needed)                   │
└────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│ packages/extension/src/main/  (the new content script)             │
│  1. document_idle (NOT document_start — we don't need a splash;    │
│     we just need body to exist before we replace it)               │
│  2. lookup site-data for current domain                            │
│  3. extract context from original DOM (read-only — sessions etc.)  │
│  4. document.body.replaceChildren(appRoot)  ← THE REPLACEMENT      │
│  5. Render the page via render-engine                              │
│  6. Subscribe to chrome.storage.onChanged for LIVE prop updates    │
│     (R3 — no page refresh required)                                │
│  NO shadow root. NO hide-original style. NO toggle.                │
└────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│ packages/extension/src/render-engine/                              │
│  Lookup URL → SitePage from bundled site-data                      │
│  Render Preact tree composed from @onegov/ui (rewritten)           │
│  Page templates: home, form, list, detail, dashboard, search,      │
│  document, external, error, empty                                  │
│  Every template includes the institution's logo + name (R1)        │
└────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│ packages/api-clients/                                              │
│  anaf-api/  webservicesp.anaf.ro wrappers                          │
│  bnr-api/   curs valutar                                           │
│  vies-api/  EU VAT validation                                      │
│  Form submissions: fetch(originalEndpoint, { credentials:          │
│  'include' }) — cookies persist on the domain even after body      │
│  replacement                                                        │
└────────────────────────────────────────────────────────────────────┘
```

---

## Acceptance criteria

### A. Design system rewrite (`packages/ui/`) — match fara-hartie

Open https://fara-hartie.gov.ro and match their patterns. The existing v0.2 components stay only where they're not visually rendered (utility wrappers like Stack, Cluster, Container, Box). The visually-rendered components MUST be rewritten:

- [ ] **Token system** rewrite: `--gov-primary` navy `#1a4598` (or measured from fara-hartie), `--gov-accent` yellow `#FFCD00` (RO flag), `--gov-danger` red `#C8102E` (RO flag), `--gov-surface` lavender-tinged off-white `#f5f6fa`, `--gov-card-bg` white, navy text, gray secondary text. Use generous line-height (1.6).
- [ ] **Button**: pill-shaped (full radius), three variants:
  - `primary`: yellow bg, dark navy text, optional icon left
  - `secondary`: white bg, blue border + text, optional icon left
  - `ghost`: transparent, blue text, hover bg
  - All sizes have generous horizontal padding so the pill silhouette reads
- [ ] **Header (AppShell)**: navy strip (~64–72px tall), institution logo left + wordmark, primary nav as PILLS centered (rounded full, with hover state, active state, ARIA-correct), prominent right CTA in yellow
- [ ] **Hero**: large centered title, descriptive sub, row of 2-3 OUTLINED PILL buttons (icon + label inside the pill), white background, NOT a solid blue card
- [ ] **Card**: white bg, soft shadow, generous padding (24-32px), small ROUNDED-SQUARE icon block at left-top (40-48px square, monochrome navy bg, white icon glyph), title + description right
- [ ] **Accordion (CRITICAL)**: SINGLE-OPEN by default. Open header: solid navy background, white text, white chevron-up. Closed header: white bg, navy text, navy chevron-down inside small gray circle. Body: gray text, well-spaced (line-height 1.6), bold keywords. Animation: max-height transition + chevron rotation, 200ms ease, gated on `prefers-reduced-motion`. Multi-open available as opt-in (`multiple` prop) but NOT the default.
- [ ] **Footer**: thin yellow accent line at top, navy bar, white text, three-column layout (stacks on mobile)
- [ ] **Inputs**: white bg, soft border, navy focus ring, generous padding. Search input has rounded shape matching the buttons.
- [ ] **Section**: lavender-tinged off-white background section wrapping white card content
- [ ] All animations gated on `prefers-reduced-motion`. Match demoanaf "active scale 0.97 on press" + "hover lift" patterns where relevant.
- [ ] After every theme.css edit, RUN `bun run --cwd packages/ui scripts/sync-theme.ts` BEFORE building. Bundle uses the TS string mirror; un-synced edits never reach `dist/`.

### B. `packages/site-data/` workspace — Zod schema + first hand-curated site

- [ ] New workspace `@onegov/site-data` with Zod-typed schema in `src/schema.ts` defining:
  - `SiteMap`: domain, branding (logo URL or inline SVG, full Romanian name, short label, accent color), pages map, url_patterns, primary navigation
  - `SitePage`: template (one of: home / form / list / detail / dashboard / search / document / external / error / empty), title, sub, regions
  - `Branding`: required on every SiteMap — `logo: { src: string; alt: string }`, `fullName: string` (Romanian), `shortLabel: string` (acronym OK), `accentColor: string` (hex; defaults to `--gov-primary` if absent)
  - Page templates have explicit field shapes — see "Schema sketch" below
- [ ] `packages/site-data/data/anaf.ro.json` — hand-curated for v0.3.0:
  - `branding`: ANAF logo (use `https://www.anaf.ro/anaf/internet/ANAF/themes/anaf/img/logo.png` URL, OR pre-fetch + inline as base64 — fetch one and inline if it's < 20 KB), `fullName: "Agenția Națională de Administrare Fiscală"`, `shortLabel: "ANAF"`, `accentColor: "#003B73"`
  - At least 6 pages: home, cui-lookup, calendar-fiscal, servicii-online, asistenta-fiscala, info-publice
- [ ] `packages/site-data/scripts/validate.ts` — validates every JSON against Zod schema. Build fails if any pack is malformed.

### C. `packages/api-clients/` workspace — extracted from demoanaf

- [ ] `@onegov/api-clients` workspace
- [ ] `anaf-api/` module: `lookupCui(cui: string): Promise<CompanyInfo>` wrapping `https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva`. Native `fetch`. Reference adaptation source: `/Users/danime/Sites/demoanaf.ro/demoanaf.ro/gateway/src/anaf/`.
- [ ] `bnr-api/` module: `getRates()` for currency display
- [ ] `vies-api/` module: `validateVat()` for EU VAT
- [ ] Tree-shakeable; tested with captured response fixtures

### D. `packages/extension/src/main/` — new content script (replaces `content/`)

- [ ] DELETE the old `packages/extension/src/content/` AND `packages/extension/src/sites/` directories. They're tied to the rejected shadow-root architecture.
- [ ] DELETE `packages/extension/src/loader/`. No splash needed — page replacement is fast enough that a splash is overkill, and the institution-branded splash idea is moot once the institution branding lives in the rendered header.
- [ ] New `packages/extension/src/main/index.ts`:
  ```ts
  // 1. Skip if extension disabled per chrome.storage.local
  // 2. Skip if no site-data for current hostname
  // 3. Wait for document.body (DOMContentLoaded if not yet ready)
  // 4. Read context from original DOM (cookies, URL params, any inline tokens like CSRF — do this BEFORE replacing body)
  // 5. document.body.replaceChildren(appRoot) — THE REPLACEMENT
  // 6. Inject our scoped CSS via <style> in document.head
  // 7. Render the page via render-engine
  // 8. Subscribe to chrome.storage.onChanged for LIVE updates (R3)
  //    - density change → re-render with new density prop (NEW prop object, not in-place mutation)
  //    - extensionEnabled false → reload the page so original re-renders untouched
  ```
- [ ] No shadow root. No hide-original style. No "show original" toggle in the UI.
- [ ] Manifest content_scripts: single entry, `run_at: "document_idle"`, matches the bundled site-data domains. Drop the `document_start` split.

### E. `packages/extension/src/render-engine/` — page templates

- [ ] `lookup(url: URL): SitePage | null` — pure function over bundled site-data
- [ ] `RenderEngine` Preact component picks the template per `page.template`
- [ ] **8 page templates** composed from rewritten `@onegov/ui`:
  - **`home`** (R1, R2): institution header (logo + full name + nav pills) → centered hero with title + sub + 2-3 outlined-pill CTAs → "Cum funcționează?" or "Servicii" section with icon-square cards in a 4-up grid → "Întrebări frecvente" single-open accordion → footer with yellow accent line + 3 columns
  - **`form`**: institution header → form card (label + input + helper) → primary submit (yellow pill) + secondary cancel (outline pill) → results panel (when submitted)
  - **`list`** + **`detail`** + **`dashboard`** + **`search`** + **`document`** + **`external`** + **`error`** + **`empty`** — all with the institution header on top and yellow-accent footer at bottom
- [ ] `external` template handles "În curând — deschide pe <institution>.ro" with working link (R4 — no click should ever do nothing)
- [ ] Every template renders the institution's `branding.logo` + `branding.fullName` + `branding.shortLabel` in the header. The "onegov" wordmark appears ONLY as a tiny "Optimizat de [logo]" line in the footer, NEVER in the header.

### F. Popup rewrite — minimal launcher (no toggle drama)

- [ ] Replace popup with a tiny launcher:
  - Status: "Activ pe <institution>.ro" / "Site nesuportat" / "Domeniu suspect"
  - Single primary toggle: "Aplică interfața onegov" (default ON). When toggled OFF, sends a message to the content script that does `location.reload()` so the original page renders untouched. R3 satisfied (live, but reload-based since R6 makes mid-flight switching impossible after replacement).
  - Density chip: Minimal / Simplu / Bogat (instant — content script subscribes to storage, re-renders with new density prop using a NEW object reference so Preact does the diff)
  - Footer: version + GitHub link. NO persona pill. NO show-original toggle.

### G. Live toggles — wire it correctly (R3)

The v0.2 bug was: storage subscription mutated `runtime.showingOriginal` in place; Preact short-circuits on reference equality. **Fix pattern:**
- Pass per-render values as PRIMITIVE props on the App component (e.g. `<App density={current.density} ctx={ctx} />`)
- On storage change, compute new props from new values and call `preactRender(<App density={NEW} />)` again
- NEVER mutate an object that's already been passed as a prop
- Add a smoke test that asserts toggling density via storage actually re-renders with the new prop value

### H. `packages/crawler/` skeleton (Node-only, foundation for v0.3.x)

- [ ] `@onegov/crawler` workspace (Node-only, never bundled)
- [ ] CLI: `bun run --cwd packages/crawler crawl --site anaf.ro` — uses Playwright to visit anaf, extracts pages + branding into the SiteMap shape
- [ ] First-pass output rough; iterate to match the hand-curated `anaf.ro.json` shape
- [ ] Diff tool: compare latest crawl vs committed site-data, print structured diff for human review
- [ ] CI integration deferred to v0.3.1+

### I. `packages/e2e/` — visual regression with `--load-extension`

- [ ] New workspace using Playwright with `chromium.launchPersistentContext({ headless: false, args: ['--disable-extensions-except=PATH', '--load-extension=PATH'] })`
- [ ] One smoke test for v0.3.0:
  - Build extension to `dist/extension/`
  - Launch persistent context with extension loaded
  - Navigate to `https://www.anaf.ro/anaf/internet/ANAF/`
  - Wait for body replacement (assert `document.querySelector('#onegov-app')` exists)
  - Assert ANAF logo is visible (institution branding R1)
  - Assert no "OG · pe anaf.ro" generic text in the header
  - Click "Calendar fiscal" card → assert URL changes OR a render-engine page renders
  - Toggle density chip in popup → assert re-render with new density (R3)
  - Screenshot for human review

### J. `theme.css` ↔ `theme.ts` sync gate

- [ ] Pre-commit hook OR CI step: runs `sync-theme.ts` and fails if `theme.ts` is out of sync with `theme.css`. The bug from v0.2.x where my CSS edits never reached the bundle MUST not recur.

### K. Cleanup

- [ ] DELETE `packages/extension/src/sites/` (v0.2 site-module pattern is dead per R6)
- [ ] DELETE `packages/extension/src/loader/` (no splash in v0.3 — the page is replaced fast enough that a splash is overkill)
- [ ] DELETE all v0.1 / v0.2 references in CLAUDE.md / SPEC.md / docs to the shadow-root + hide-original-style approach. Add comments where the new architecture diverges so future readers understand.
- [ ] Update `docs/ARCHITECTURE.md` with the page-replacement diagram
- [ ] Append entries to `docs/LOG.md` for this work

---

## Schema sketch

```json
{
  "version": "0.3.0",
  "domain": "anaf.ro",
  "branding": {
    "logo": { "src": "data:image/png;base64,...", "alt": "ANAF logo" },
    "fullName": "Agenția Națională de Administrare Fiscală",
    "shortLabel": "ANAF",
    "accentColor": "#003B73"
  },
  "navigation": {
    "primary": [
      { "label": "Despre ANAF", "href": "/despre-anaf" },
      { "label": "Asistență Contribuabili", "href": "/asistenta-contribuabili" },
      { "label": "Servicii Online", "href": "/servicii-online" },
      { "label": "Info Publice", "href": "/info-publice" }
    ],
    "primary_cta": { "label": "Verifică un CUI", "href": "/cui-lookup", "icon": "search" }
  },
  "pages": {
    "/": {
      "template": "home",
      "title": "Bun venit la ANAF",
      "sub": "Servicii fiscale online — verifică o firmă, găsește un serviciu, planifică-ți obligațiile.",
      "hero_actions": [
        { "label": "Verifică un CUI", "href": "/cui-lookup", "icon": "search", "variant": "primary" },
        { "label": "Calendar fiscal", "href": "/calendar-fiscal", "icon": "calendar", "variant": "secondary" }
      ],
      "sections": [
        {
          "kind": "icon_card_grid",
          "eyebrow": "CUM TE PUTEM AJUTA",
          "title": "Servicii principale",
          "items": [
            { "icon": "edit", "title": "Verifică un CUI", "description": "Confirmă rapid o firmă plătitoare de TVA folosind CUI/CIF-ul.", "href": "/cui-lookup" },
            { "icon": "calendar", "title": "Calendar fiscal", "description": "Termenele importante și obligațiile lunii curente.", "href": "/calendar-fiscal" },
            { "icon": "external", "title": "Servicii online", "description": "SPV, declarații, plăți și formulare electronice.", "href": "/servicii-online" }
          ]
        },
        {
          "kind": "faq_accordion",
          "eyebrow": "ÎNTREBĂRI FRECVENTE",
          "title": "Răspunsuri la întrebări comune",
          "items": [
            { "id": "spv", "question": "Cum mă autentific în SPV?", "answer": "..." },
            { "id": "cui", "question": "Ce este un CUI?", "answer": "..." }
          ]
        }
      ]
    },
    "/cui-lookup": {
      "template": "form",
      "title": "Verifică un CUI",
      "sub": "Introdu CUI-ul firmei pentru a confirma statutul de plătitor de TVA.",
      "form": {
        "fields": [{ "name": "cui", "label": "CUI / CIF", "type": "text", "required": true, "pattern": "^\\d{1,10}$", "helper": "Ex: 14841555" }],
        "submit_label": "Caută CUI",
        "submit_handler": { "kind": "api_call", "client": "anaf", "method": "lookupCui", "args_from": ["cui"] },
        "result_template": "company_card"
      }
    },
    "/calendar-fiscal": { "template": "list", "title": "Calendar fiscal", "data_source": { "kind": "static", "items_inline": [...] } },
    "/external": { "template": "external", "title": "În curând", "external_url": "https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili" }
  },
  "url_patterns": [
    { "match": "^/$", "page": "/" },
    { "match": "^/anaf/internet/ANAF/?$", "page": "/" },
    { "match": "^/anaf/internet/ANAF/acasa(/!ut/.*)?$", "page": "/" },
    { "match": "^/anaf/internet/ANAF/cui.*", "page": "/cui-lookup" },
    { "match": ".*", "page": "/external" }
  ]
}
```

---

## Hard rules (operational)

- **CWD-DRIFT WARNING (third recurrence prevention)**: before EVERY git commit, run `pwd && git branch --show-current` in the same Bash call. Confirm pwd ends in `.claude/worktrees/agent-xxxxx` and branch is `job/v0.3-prebaked/architecture-rewrite`. If not, `cd` back. Two prior workers cost recovery time.
- `git status --porcelain` MUST be empty before reporting DONE.
- `bun pm ls 2>&1 | grep -ci node-forge` must return `0`.
- TypeScript strict, no `any`. MAX 500 lines per file.
- No new manifest permissions. No new dependencies (Playwright in `packages/e2e` is dev-only).
- Bundle: `content.js` (now `main.js`) gz ≤ 80 KB. Total dist (with bundled site-data + inlined ANAF logo) ≤ 2 MB.
- Conventional Commits, no `Co-Authored-By` ever.
- After every theme.css edit: run sync-theme.

## What you will report back

After completion, write `jobs/v0.3-prebaked/DONE-01-architecture-rewrite.md` per `CLAUDE.md §Step 4`.

In the summary:
1. Branch + commit hashes
2. `pwd && git status --porcelain` (empty + correct worktree)
3. Tail of `bun run check`, `bun run test`, `bun run build`
4. Bundle gz sizes + total dist size
5. node-forge count (must be 0)
6. **Screenshot of the rendered anaf.ro homepage** via the `packages/e2e` Playwright test (the loaded extension visually replaces the page; ANAF logo + full Romanian name visible in the header; pill buttons; fara-hartie-style cards; accordion)
7. Click `Calendar fiscal` → confirm it navigates to a rendered page (not no-op) — screenshot
8. Toggle density chip in popup → confirm live re-render — screenshot before+after
9. Confirmation that v0.2 shadow-root + hide-original code is DELETED, not just deprecated
10. Confirmation that R1 (ANAF logo + full name in header) + R2 (fara-hartie patterns) + R3 (live toggles) + R4 (every click works) + R5 (design system rewritten) + R6 (page replaced, no shadow root) are ALL satisfied
11. Deviations + justification (if any rule can't be fully satisfied, FLAG it loudly)
12. Files changed count

Be honest. Owner has been burned by 4 broken builds. If something doesn't work, say so before merging.

---

## Out of scope

- Other 5 ship-list sites (dgep, portal.just, ghiseul, rotld, itmcluj) — separate v0.3.x tasks once anaf.ro is approved
- Crawler quality beyond skeleton + one working anaf.ro extraction (v0.3.1+)
- Authentication flows (CEI/SPV/OAuth) — v0.4
- Form bridging beyond the CUI-lookup proof — separate per-form tasks
- Mid-flight density switching that requires a page reload — acceptable for v0.3.0 if the page-replacement architecture makes mid-flight impractical (document the tradeoff)
