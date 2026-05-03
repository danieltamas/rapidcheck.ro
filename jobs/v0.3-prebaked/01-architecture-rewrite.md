# Task: v0.3 architecture — pre-baked site maps + render engine + crawler

**Job:** v0.3-prebaked
**Group:** architecture
**Branch:** `job/v0.3-prebaked/architecture-rewrite`
**Mode:** Worker (multi-commit, sequential)
**Touches:** new `packages/site-data/`, new `packages/crawler/`, new `packages/api-clients/`, modifies `packages/extension/`, leaves `packages/ui/` and `packages/core/` alone

> v0.2 architecture (live DOM extraction + Preact render in shadow root) is being retired. v0.3 replaces it with pre-baked JSON site maps consumed by a generic render engine. The extension content script no longer parses anaf.ro's DOM — it does an URL → site-data lookup → render. Live data comes from real APIs, not page scraping.

---

## Why this exists (owner direction, 2026-05-03)

Owner verdict on v0.2: **"the current strategy seems not to work"**. Three sequential UI sprints converged on the same broken pattern: live DOM extraction returns garbage (WebSphere portlet IDs as content), shape contracts evaluated at render time stutter, rendering-on-the-fly is slow and fragile. Every visible "premium" overlay still leaked the source site's structure.

Owner's proposed fix:

> "the entirety of each site should be mapped and somehow made into some fast rules that render instantly instead of on the fly parsing. this means I could do a crawler like service that extracts everything related to the DOM and then a rendering engine of sorts"

This is the right architecture. v0.3 implements it.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│ packages/crawler/  (offline, NEVER ships in extension)             │
│  - Visits each gov site (Playwright + Claude API)                  │
│  - Extracts: pages, services, navigation, forms, action endpoints  │
│  - LLM classifies sections, infers intents, summarizes content     │
│  - Outputs: packages/site-data/<domain>.json                       │
│  - Versioned + diffed; human review on each crawl run              │
│  - CLI: bun run --cwd packages/crawler crawl --site anaf.ro        │
└────────────────────────────────────────────────────────────────────┘
                            │
                            ▼ (artifact, committed)
┌────────────────────────────────────────────────────────────────────┐
│ packages/site-data/  (versioned JSON, BUNDLED WITH EXTENSION)      │
│  anaf.ro.json    (~50-200 KB per site — well under bundle budget)  │
│  dgep.mai.gov.ro.json                                              │
│  ghiseul.ro.json                                                   │
│  portal.just.ro.json                                               │
│  rotld.ro.json                                                     │
│  itmcluj.ro.json                                                   │
└────────────────────────────────────────────────────────────────────┘
                            │
                            ▼ (consumed at runtime)
┌────────────────────────────────────────────────────────────────────┐
│ packages/extension/src/render-engine/                              │
│  - lookup(url) → SitePage from bundled site-data                   │
│  - render(page, runtime) → Preact tree composed from @onegov/ui    │
│  - Handles 8-10 page templates: home, form, list, detail,          │
│    dashboard, search, document, error, empty, external             │
│  - INSTANT — no DOM walk, no async, synchronous render             │
└────────────────────────────────────────────────────────────────────┘
                            │
                            ▼ (interactions hit real APIs)
┌────────────────────────────────────────────────────────────────────┐
│ packages/api-clients/                                              │
│  anaf-api/    webservicesp.anaf.ro wrappers (CUI lookup, balance)  │
│  bnr-api/     curs valutar                                         │
│  vies-api/    EU VAT validation                                    │
│  onrc-api/    company lookup                                       │
│  generic/     fetch with the user's session cookies for sites      │
│               without an API (POST to known form endpoints)        │
│  Single source of truth — used by both onegov.ro extension AND     │
│  demoanaf.ro frontend. Tree-shakeable per consumer.                │
└────────────────────────────────────────────────────────────────────┘
```

**The extension content script becomes radically simpler:**

```ts
async function activate() {
  const loader = mountLoader({ mark: siteData.brand });
  await waitForBody();
  const page = lookupPage(location.href);  // synchronous, JSON lookup
  if (!page) return loader.abort('Pagina nu este în harta noastră');
  const { host, shadow } = mountShadowHost();
  applyHideOriginal();
  injectStyles(shadow, themeCss);
  preactRender(<RenderEngine page={page} runtime={runtime} />, shadow);
  loader.dismiss();
}
```

No `extractContext`, no shape evaluation, no `SerializableDoc`, no `applyPersonaOverrides` at runtime. All of that moved offline into the crawler.

---

## Acceptance criteria

### A. `packages/site-data/` — JSON schema + first site

- [ ] New workspace package `@onegov/site-data` (publishable as a separate npm package later — useful for third parties consuming our maps)
- [ ] Zod-typed schema in `packages/site-data/src/schema.ts` defining `SiteMap`, `SitePage`, `PageTemplate`, `Action`, `Form`, `NavSection`, etc. (see "Schema sketch" below)
- [ ] `packages/site-data/anaf.ro.json` — hand-curated for v0.3.0 (the crawler will replace this in v0.3.1+ once the crawler can produce equivalent quality automatically)
- [ ] Validation script: `bun run --cwd packages/site-data validate` — parses every JSON against the Zod schema, fails loud on drift
- [ ] Build-time check: extension's `bun run build` validates all bundled site-data and refuses to build on schema mismatch

### B. `packages/api-clients/` — extracted, shared, typed

- [ ] New workspace package `@onegov/api-clients`
- [ ] `anaf-api/` module: `lookupCui(cui: string): Promise<CompanyInfo>` — wraps `https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva`. Same response normalization as `demoanaf.ro/gateway/src/anaf/`. Reuse the demoanaf code where reasonable (copy with attribution; don't take a runtime dep on the gateway).
- [ ] `bnr-api/`: `getRates(): Promise<ExchangeRates>` — XML feed + parser
- [ ] `vies-api/`: `validateVat(country, vat): Promise<VatStatus>`
- [ ] Each client tree-shakeable; no implicit shared dependency
- [ ] Native `fetch` only. No undici or other deps.
- [ ] Tests: each client has a unit test against captured response fixtures
- [ ] Used by the extension's render engine for live data + by demoanaf.ro (after this lands, demoanaf can switch to consuming the published `@onegov/api-clients`)

### C. `packages/extension/src/render-engine/` — generic renderer

- [ ] `lookup(url: URL): SitePage | null` — pure function over the bundled site-data
- [ ] `RenderEngine` Preact component — picks the right template per `page.template` value
- [ ] **8-10 page templates**, each a small Preact component composed from `@onegov/ui`:
  - **`home`** — hero + service grid + secondary nav (anaf.ro homepage shape)
  - **`form`** — title + description + form fields + submit (CUI lookup, declaration submission)
  - **`list`** — title + filters + paginated list of items (search results, news list)
  - **`detail`** — title + metadata + sections + related items (company detail page)
  - **`dashboard`** — title + KPI cards + sections (e.g. SPV inbox summary)
  - **`search`** — search box + filters + results (CAEN code browser, person search)
  - **`document`** — formatted long-form content (Monitorul Oficial entry, info publice page)
  - **`external`** — "this section lives on the source site, click through" (deep links we don't take over yet)
  - **`error`** — fallback when something goes wrong (graceful, with "afișează site original" CTA)
  - **`empty`** — when site data exists but page is intentionally blank (e.g. WIP)
- [ ] All templates accept `{ page: SitePage; runtime: SiteRuntime }`. No template parses live DOM.
- [ ] Live data hooks: each template MAY call API clients via injected services (e.g. `services.anaf.lookupCui(cui)`). Calls happen at render time only when user requests them, not at mount.
- [ ] Form bridging: forms POST to known endpoints via `fetch(endpoint, { credentials: 'include' })` — uses the user's session cookies for the gov site, no DOM form bridging.

### D. `packages/crawler/` — the offline mapper (foundation only in v0.3.0)

For v0.3.0, ship the crawler SKELETON + a single working anaf.ro crawl. Templates / Tier 2 / AI-assisted classification come in v0.3.1+.

- [ ] New workspace package `@onegov/crawler`
- [ ] Node-only (NEVER bundled with extension). Uses Playwright + (optionally) Claude API.
- [ ] `bun run --cwd packages/crawler crawl --site anaf.ro` — visits the site, follows nav links, extracts what it can
- [ ] First-pass output is rough; iterate to match the hand-curated `anaf.ro.json` shape
- [ ] Output written to `packages/site-data/<domain>.json` (overwrites the hand-curated file once crawler quality is good enough — for v0.3.0, leave the hand-curated file intact)
- [ ] Diff tool: `bun run --cwd packages/crawler diff --site anaf.ro` — compares latest crawl vs committed site-data, prints structured diff for human review
- [ ] CI integration deferred to v0.3.1

### E. Extension content script rewrite

- [ ] `packages/extension/src/content/index.ts` simplified — no `extractContext`, no shape evaluation, no `SerializableDoc`. The dispatcher just:
  1. mountLoader (with branding from site-data)
  2. waitForBody
  3. lookupPage(url)
  4. If null → loader.abort('Această pagină nu este în harta noastră încă'). Original page stays visible.
  5. Mount shadow + render engine
  6. Wire density + showOriginal storage subscriptions
  7. Done
- [ ] All v0.2 site-module files (`packages/extension/src/sites/anaf.ro/{App,Home,Cui,bridge,context,nav}.tsx`) deleted. Replaced by render engine + site-data.
- [ ] `packages/extension/src/sites/registry.ts` becomes a single function: `hasSiteData(hostname: string): boolean` — used by the content script's main() to decide if this domain is opted-in.
- [ ] `manifest.json` content_scripts unchanged (still split: anaf at document_start, others at document_idle with no-op).

### F. Quality / process improvements (the gap owner flagged)

- [ ] **Visual regression tests**: new `packages/e2e/` workspace using Playwright's `chromium.launchPersistentContext({ headless: false, args: ['--load-extension=PATH'] })`. For v0.3.0, ship one test: load extension, navigate to a synthetic anaf.ro fixture (or to the real anaf.ro), screenshot, fail if pixel diff > threshold against committed baseline. This catches "footer renders above hero" before merge.
- [ ] **Composition tests** in `packages/ui/`: render every page template (home/form/list/detail/etc.) with synthetic site-data and assert layout doesn't break. Catches AppShell-style bugs caught only by visual inspection today.
- [ ] **theme.css ↔ theme.ts sync gate**: pre-commit hook (or CI step) that runs `sync-theme` and fails if `theme.ts` was committed without the matching `theme.css` change. The 3-merge bug from v0.2.x must not recur.

### G. Schema sketch — what `anaf.ro.json` looks like

```json
{
  "version": "0.3.0",
  "domain": "anaf.ro",
  "crawledAt": "2026-05-03T10:00:00Z",
  "brand": {
    "label": "ANAF",
    "fullName": "Agenția Națională de Administrare Fiscală",
    "color": "#003B73",
    "logoUrl": "https://www.anaf.ro/anaf/internet/ANAF/themes/anaf/img/logo.png"
  },
  "pages": {
    "/": {
      "template": "home",
      "title": "Bun venit la ANAF",
      "subtitle": "Servicii fiscale online",
      "hero": {
        "primary_action": {
          "kind": "search",
          "label": "Verifică un CUI",
          "placeholder": "Introdu un CUI sau un nume de firmă",
          "submit_to": "/cui-lookup"
        }
      },
      "services": [
        { "title": "Calendar fiscal", "icon": "calendar", "href": "/calendar-fiscal", "description": "Termenele importante și obligațiile lunii" },
        { "title": "Servicii online", "icon": "external", "href_external": "https://www.anaf.ro/anaf/internet/ANAF/servicii_online", "description": "SPV, declarații, plăți" },
        { "title": "e-Factura", "icon": "invoice", "href": "/efactura", "description": "Trimitere și verificare" }
      ],
      "secondary_links": [
        { "title": "Despre ANAF", "href_external": "..." },
        { "title": "Asistență", "href_external": "..." }
      ]
    },
    "/cui-lookup": {
      "template": "form",
      "title": "Verifică un CUI",
      "form": {
        "fields": [{ "name": "cui", "label": "CUI / CIF", "type": "text", "required": true, "pattern": "^\\d{1,10}$" }],
        "submit": { "kind": "api_call", "client": "anaf", "method": "lookupCui", "args_from_fields": ["cui"] },
        "result_template": "company_card"
      }
    },
    "/calendar-fiscal": { "template": "list", "title": "Calendar fiscal", "data_source": { "kind": "static", "items_inline": [...] } },
    "/efactura": { "template": "external", "title": "e-Factura", "external_url": "https://www.anaf.ro/anaf/internet/ANAF/servicii_online" }
  },
  "url_patterns": [
    { "match": "^/$", "page": "/" },
    { "match": "^/anaf/internet/ANAF/?$", "page": "/" },
    { "match": "^/anaf/internet/ANAF/acasa(/!ut/.*)?$", "page": "/" },
    { "match": "^/anaf/internet/ANAF/cui.*", "page": "/cui-lookup" }
  ],
  "navigation": {
    "primary": [
      { "title": "Acasă", "href": "/" },
      { "title": "Servicii", "href": "/" },
      { "title": "Calendar", "href": "/calendar-fiscal" }
    ]
  }
}
```

The render engine matches `location.pathname` against `url_patterns`, picks the page, picks the template by `page.template`, renders.

---

## Hard rules

- `git status --porcelain` MUST return empty before reporting DONE.
- `bun pm ls 2>&1 | grep -ci node-forge` must return `0`.
- The five invariants per CLAUDE.md still apply (with the v0.2 documented relaxations).
- TypeScript strict, no `any`. MAX 500 lines per file.
- Closed shadow root only.
- No new manifest permissions.
- Bundle: extension `content.js` gz ≤ 80 KB after this lands. Site-data JSON adds maybe 50-200 KB to extension size; that's fine — total package ≤ 2 MB cap.
- Conventional Commits, no `Co-Authored-By` ever.
- **theme.css → theme.ts sync** is mandatory after every theme.css edit. Add a pre-commit guard.
- ALL site-data files validated against Zod schema at build time.

## CWD-DRIFT WARNING (third recurrence prevention)
The Bash tool's CWD persists across calls. After `cd /Users/danime/Sites/onegov.ro` ANY git command runs against MAIN. Before EVERY commit, run `pwd && git branch --show-current` in the same Bash call. Confirm pwd ends in `.claude/worktrees/agent-xxxxx` and branch is `job/v0.3-prebaked/architecture-rewrite`. If not, `cd` back. Two prior workers cost recovery time on this.

## What you will report back

After completion, write `jobs/v0.3-prebaked/DONE-01-architecture-rewrite.md` per `CLAUDE.md §Step 4`.

In the summary:
1. Branch + commit hashes
2. `pwd && git status --porcelain` (must be empty + must show your worktree)
3. Tail of `bun run check`, `bun run test`, `bun run build`
4. background.js + content.js + popup.js gz sizes
5. Total dist/extension size with bundled site-data (must stay < 2 MB)
6. node-forge count (must be 0)
7. **3-4 sentence description of what visiting anaf.ro looks like NOW** — be precise
8. Manual smoke result if your environment can drive Chrome with --load-extension
9. List of pages defined in `anaf.ro.json` (proves the site map exists)
10. Confirmation that the visual-regression Playwright test runs and passes
11. Deviations + justification
12. Files changed count

Be terse. Visuals matter most.

---

## Out of scope

- Other 5 ship-list sites (dgep, portal.just, ghiseul, rotld, itmcluj) — they get their own site-data files in subsequent v0.3.x tasks
- Crawler quality beyond skeleton + one working site (v0.3.1+)
- Tier 2 template-based crawl (v0.3.2+)
- Tier 3 AI fallback (v0.4)
- Authentication flows (CEI/SPV/OAuth) — render-original-page passthrough for v0.3, deep integration in v0.4
- Real-time data dashboards (v0.3 calendar fiscal can be a static items list; live becomes v0.3.x)
- Persona inference removal — already obsolete; just delete the persona module if it's still imported
- Popup redesign beyond what's already done
