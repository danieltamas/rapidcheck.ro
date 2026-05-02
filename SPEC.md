# onegov.ro — v0.1 Execution Plan

**Owner:** Daniel Tamas **Status:** Ready for parallel agent execution **Target:** Working Chrome desktop WebExtension - called [onegov.ro](http://onegov.ro)

> **v0.1 SCOPE NARROWED — Chrome desktop only.** Firefox packaging + cross-browser parity moves to v0.2. The text below still references "Chrome + Firefox" in places; treat any Firefox/web-ext/gecko/xpi mention as **deferred to v0.2**. The codebase stays cross-browser-compatible at the API level (no Chrome-only APIs without justification), but no Firefox build, packaging, or QA in v0.1.

---

## 1. Mission

Ship a Manifest V3 WebExtension that transforms Romanian government portals into a unified, persona-adapted UI without modifying underlying form data, sessions, or submissions.

The v0.1 success criterion: a demo recording showing anaf.ro before and after the extension activates, switched across four personas, with the original-page toggle working. Cross-browser (Chrome + Firefox).

The extension is the wedge. Every subsequent capability — AI fallback, mobile shells, telemetry, community rule packs, form bridging — compounds on top of it.

---

## 2. Scope

### In scope (v0.1)

- Manifest V3 extension, packaged for Chrome + Firefox
- Three-state browser action indicator: **green** (verified gov + active), **gray** (off-list, inactive), **red** (lookalike domain — likely phishing)
- Verified domain list (static, bundled in v0.1) with eTLD+1 matching
- Lookalike detection: Levenshtein ≤ 2 + IDNA homograph normalization + TLD swap detection
- Rule pack JSON schema, validator, and bundled-only loader
- Shadow DOM overlay renderer (closed mode)
- Preact-based component library with four persona variants
- Manual persona picker in popup; persisted in `browser.storage.local`
- "Show original" toggle (hides shadow overlay, original page is always intact underneath)
- Three working rule packs: `anaf.ro` (homepage + one inner page), `onrc.ro` (homepage), `demoanaf.ro` (proof of non-interference on a well-designed site)
- **Read-only transformations only** — no form submission bridging in v0.1

### Out of scope (deferred)

| Feature | Phase |
| --- | --- |
| Form submission bridging through original DOM | v0.2 |
| AI fallback (local Qwen) for unknown pages | v0.2 |
| Remote signed rule pack updates (Ed25519) | v0.2 |
| Behavioral persona classifier | v0.2 |
| First-run onboarding flow | v0.2 |
| Anti-phishing toast on red state | v0.2 |
| Telemetry / DP / federated learning | v0.3 |
| Community rule pack PR pipeline | v0.3 |
| Authenticated portals (SPV, e-Factura) | v0.3 |
| Firefox Android (works for free, just package) | v0.3 |
| iOS Safari Web Extension | v0.4 |
| Standalone Android browser app | v0.4 |

---

## 3. Architecture

```
┌────────────────────────────────────────────────────────────┐
│ Extension Shell (MV3) — packages/extension                 │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Background   │  │ Content      │  │ Popup UI     │      │
│  │ Service      │  │ Script       │  │              │      │
│  │ Worker       │  │ (per tab)    │  │              │      │
│  │              │  │              │  │              │      │
│  │ icon state   │  │ shadow root  │  │ persona pick │      │
│  │ msg routing  │  │ extract→render│ │ show original│      │
│  │ storage      │  │ observe DOM  │  │ status pill  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌────────────────────────────────────────────────────────────┐
│ Core Engine — packages/core (DOM-free, pure TS)            │
│                                                            │
│  • domain-verifier.ts    eTLD+1 match → DomainStatus       │
│  • lookalike.ts          Levenshtein, IDNA, nearest        │
│  • rule-pack-loader.ts   load + validate (Zod)             │
│  • semantic-extractor.ts rule + serialized DOM → SemTree   │
│  • persona.ts            persona overrides on routes       │
└────────────────────────────────────────────────────────────┘
          │                                   │
          ▼                                   ▼
┌──────────────────────┐  ┌────────────────────────────────┐
│ UI — packages/ui     │  │ Rule Packs — rule-packs/       │
│ Preact components    │  │ bundled JSON                   │
│                      │  │                                │
│  • renderer.tsx      │  │  _verified-domains.json        │
│  • personas/         │  │  anaf.ro.json                  │
│    pensioner.tsx     │  │  onrc.ro.json                  │
│    standard.tsx      │  │  demoanaf.ro.json              │
│    pro.tsx           │  │                                │
│    journalist.tsx    │  │                                │
│  • components/       │  │                                │
│  • theme tokens      │  │                                │
└──────────────────────┘  └────────────────────────────────┘
```

### Hard invariants — must hold across all modules

1. **Original DOM is never mutated.** Renderer mounts a shadow host as a sibling of `<body>`'s last child. Shadow root is `mode: 'closed'`. Page CSS cannot reach in; page JS cannot enumerate it.
2. **No form data is touched.** v0.1 renders read-only views. v0.2 will dispatch submissions through the original form element so CSRF tokens, session cookies, and anti-bot fingerprints flow untouched.
3. **No remote code execution.** Rule packs are declarative JSON. No `eval`, no `Function()`, no remote script loading. A compromised rule pack source cannot exfiltrate data — worst case is bad rendering.
4. **No network requests in v0.1** beyond loading bundled assets. No analytics SDKs. No third-party scripts. CSP-tight.
5. **The user can always escape.** One click on "show original" hides the entire overlay. One click in popup disables the extension on the current site.

---

## 4. Repository layout

```
onegov.ro/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── domain-verifier.ts
│   │   │   ├── lookalike.ts
│   │   │   ├── rule-pack-loader.ts
│   │   │   ├── semantic-extractor.ts
│   │   │   ├── persona.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/
│   │   ├── src/
│   │   │   ├── personas/
│   │   │   │   ├── pensioner.tsx
│   │   │   │   ├── standard.tsx
│   │   │   │   ├── pro.tsx
│   │   │   │   └── journalist.tsx
│   │   │   ├── components/
│   │   │   │   ├── Heading.tsx
│   │   │   │   ├── Paragraph.tsx
│   │   │   │   ├── List.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Form.tsx
│   │   │   │   ├── Link.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   └── Button.tsx
│   │   │   ├── renderer.tsx
│   │   │   ├── theme.css
│   │   │   └── index.ts
│   │   ├── test-harness.html
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── extension/
│       ├── src/
│       │   ├── background/index.ts
│       │   ├── content/index.ts
│       │   ├── popup/index.tsx
│       │   ├── popup/popup.html
│       │   ├── popup/popup.css
│       │   └── manifest.json
│       ├── icons/
│       │   ├── green-{16,32,48}.png
│       │   ├── gray-{16,32,48}.png
│       │   └── red-{16,32,48}.png
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
├── rule-packs/
│   ├── schema.json
│   ├── _verified-domains.json
│   ├── anaf.ro.json
│   ├── onrc.ro.json
│   └── demoanaf.ro.json
├── scripts/
│   ├── build.ts
│   ├── package.ts
│   └── gen-icons.ts
├── package.json (workspaces)
├── tsconfig.base.json
└── README.md
```

Monorepo with npm workspaces. TypeScript everywhere. Vite for bundling. Preact for UI (smaller than React, identical API). Zod for runtime validation. Vitest for unit tests.

---

## 5. Module specifications

### 5.1 `@onegov/core`

Framework-free TypeScript. **No DOM, no React, no browser APIs.** Pure logic + types. The semantic extractor takes a serialized DOM-like input so this package stays portable; the content script does the real-DOM-to-serializable wrapping.

**Type definitions (must commit first — blocks all other tracks):**

```ts
// packages/core/src/types.ts

export interface VerifiedDomain {
  domain: string;          // eTLD+1, e.g. "anaf.ro"
  category: 'gov' | 'public-interest';
  addedAt: string;         // ISO date
  source: string;          // URL evidence
}

export interface VerifiedDomainList {
  version: string;
  updatedAt: string;
  domains: VerifiedDomain[];
}

export type DomainStatus =
  | { kind: 'verified'; domain: VerifiedDomain }
  | { kind: 'lookalike'; nearest: VerifiedDomain; distance: number; reason: 'levenshtein' | 'homograph' | 'tld_swap' }
  | { kind: 'unknown' };

export type Persona = 'pensioner' | 'standard' | 'pro' | 'journalist';

export interface RulePack {
  $schema: string;
  domain: string;
  version: string;
  routes: Route[];
}

export interface Route {
  match: { pattern: string };          // RegExp source on pathname
  layout: string;                      // template name resolved by renderer
  extract: ExtractRule[];
  personas?: Partial<Record<Persona, PersonaOverride>>;
}

export interface PersonaOverride {
  layout?: string;
  hide?: string[];                     // semantic node ids to hide
  emphasize?: string[];                // semantic node ids to lift to top
}

export interface ExtractRule {
  id: string;                          // stable ID across rule pack versions
  selector: string;                    // CSS selector
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'form' | 'link' | 'image';
  attrs?: Record<string, string>;      // mapping output key → DOM attribute or 'textContent'
  multiple?: boolean;                  // querySelectorAll vs querySelector
}

export interface SerializableDoc {
  // Wrapper around document handed to the extractor. Implemented by content script.
  query(selector: string): SerializableEl | null;
  queryAll(selector: string): SerializableEl[];
}

export interface SerializableEl {
  tag: string;
  text: string;
  attr(name: string): string | null;
  children: SerializableEl[];
}

export interface SemanticTree {
  url: string;
  domain: string;
  layout: string;
  nodes: SemanticNode[];
}

export interface SemanticNode {
  id: string;
  type: ExtractRule['type'];
  data: Record<string, unknown>;
}
```

**Files & responsibilities:**

| File | Exports | Notes |
| --- | --- | --- |
| `domain-verifier.ts` | `verifyDomain(hostname, list): DomainStatus` | Use `psl` for eTLD+1 parsing |
| `lookalike.ts` | `levenshtein(a,b): number`, `normalizeHomograph(domain): string`, \`findNearest(host, list): result | null\` |
| `rule-pack-loader.ts` | `validate(unknown): RulePack`, \`loadBundled(domain, fetcher): Promise&lt;RulePack | null&gt;\` |
| `semantic-extractor.ts` | `extract(rules, doc, url): SemanticTree` | Pure function over `SerializableDoc` |
| `persona.ts` | `applyPersonaOverrides(route, persona): Route` | Returns new route with overrides applied |
| `index.ts` | barrel |  |

**Definition of done:**

- \[ \] All public API typed
- \[ \] Vitest unit tests for verifier (≥ 10 cases), lookalike (≥ 20 cases incl. Cyrillic homographs and TLD swaps), validator (good + bad fixtures)
- \[ \] Builds clean with no DOM/browser type leakage

### 5.2 `@onegov/ui`

Preact components. Imports types from `@onegov/core`.

**Files:**

| File | Purpose |
| --- | --- |
| `renderer.tsx` | Top-level: `render(tree, persona, target: ShadowRoot): void` |
| `personas/pensioner.tsx` | Large type (≥ 18px), single column, max one action per screen, inline "ce înseamnă?" buttons |
| `personas/standard.tsx` | Clean default |
| `personas/pro.tsx` | Dense, keyboard hints visible, batch actions surfaced |
| `personas/journalist.tsx` | Wide tables, anomaly highlights, copy-as-CSV affordances |
| `components/*.tsx` | Atomic components, each accepts `persona` prop |
| `theme.css` | Design tokens via CSS custom properties, one set per persona, inlined into shadow root |

**Constraints:**

- No Tailwind, no CSS-in-JS runtime, no UI component library imports.
- Plain CSS with `--onegov-*` custom properties, scoped inside shadow root.
- All components must be safe to render with missing optional fields.

**Definition of done:**

- \[ \] `test-harness.html` opens in any browser and shows the same hand-coded `SemanticTree` rendered in all four personas, side by side
- \[ \] No console errors
- \[ \] Bundle size for `@onegov/ui` &lt; 80KB minified+gzipped

### 5.3 `@onegov/extension`

The only package that touches browser APIs.

**Manifest skeleton:**

```json
{
  "manifest_version": 3,
  "name": "onegov.ro",
  "version": "0.1.0",
  "description": "UX layer over Romanian government portals.",
  "permissions": ["storage", "scripting", "activeTab", "webNavigation"],
  "host_permissions": [
    "*://*.anaf.ro/*",
    "*://*.onrc.ro/*",
    "*://demoanaf.ro/*"
  ],
  "background": { "service_worker": "background.js" },
  "content_scripts": [{
    "matches": [
      "*://*.anaf.ro/*",
      "*://*.onrc.ro/*",
      "*://demoanaf.ro/*"
    ],
    "js": ["content.js"],
    "run_at": "document_idle"
  }],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/gray-16.png",
      "32": "icons/gray-32.png",
      "48": "icons/gray-48.png"
    }
  },
  "web_accessible_resources": [{
    "resources": ["rule-packs/*.json"],
    "matches": ["<all_urls>"]
  }],
  "browser_specific_settings": {
    "gecko": { "id": "onegov@danieltamas.ro", "strict_min_version": "115.0" }
  }
}
```

**Background service worker (**`background/index.ts`**):**

- On `chrome.webNavigation.onCommitted`: parse hostname, run `verifyDomain`, set per-tab icon.
- On `chrome.runtime.onMessage`: route between popup ↔ content (persona changes, toggle visibility, get-status).
- Use `chrome.action.setIcon({tabId, path: ...})` to per-tab color the icon.
- No background polling. No periodic work. Service worker idles.

**Content script (**`content/index.ts`**):**

```
1. Confirm host_permissions match (defensive — content_scripts already filter)
2. Read persona from chrome.storage.local (default: 'standard')
3. Load rule pack for current eTLD+1 (fetch from extension URL)
4. If no pack → exit cleanly (gray state)
5. Match current pathname against pack routes
6. Wrap document in SerializableDoc adapter
7. Call extract() → SemanticTree
8. Create shadow host: <div id="onegov-root" data-onegov="1">
9. Attach closed shadow root, inject theme.css for persona
10. Mount Preact app: render(tree, persona, shadow)
11. Subscribe to chrome.storage.onChanged: re-render on persona switch
12. Listen for postMessage from popup: 'toggle-original' → set host display: none/block
```

**Popup (**`popup/index.tsx`**):**

- Status pill at top showing current state: "✅ Site oficial verificat" / "⚪ Site nesuportat" / "🚨 Atenție — domeniu suspect"
- Persona picker: 4 buttons in a 2×2 grid, with one-line descriptions in Romanian
- "Afișează site-ul original" toggle (boolean)
- Footer: "Despre" link, version number, link to rule pack source

**Vite config:** three entry points (`background.ts`, `content.ts`, `popup/index.tsx`), output to `dist/extension/`. Inline `popup.html`.

**Definition of done:**

- \[ \] Loads unpacked in Chrome (latest stable) without errors
- \[ \] Loads unpacked in Firefox (latest stable) via `web-ext run`
- \[ \] Navigating to `https://anaf.ro` turns icon green and renders shadow overlay
- \[ \] Navigating to `https://anaf-portal.ro` (test domain) turns icon red
- \[ \] Navigating to `https://google.com` keeps icon gray, no content script effects
- \[ \] Persona switch in popup updates content within 500ms
- \[ \] "Show original" toggle hides/shows overlay instantly

### 5.4 Rule packs and verified list

Authored as plain JSON. Validated against schema during build (build fails if invalid).

**Required deliverables in** `rule-packs/`**:**

- `_verified-domains.json` — see Appendix A seed list (Track 5 owner expands to ≥ 30 domains)
- `anaf.ro.json` — covering homepage + one inner page (suggested: the public CUI lookup, since users land there frequently)
- `onrc.ro.json` — covering homepage and one search results page
- `demoanaf.ro.json` — minimal pack proving non-interference on already-good UI

**Authoring workflow:**

1. Open target site in Chrome with DevTools
2. Identify semantic elements (headings, key paragraphs, forms, action links)
3. Write extract rules with stable selectors (prefer `[data-*]` or stable IDs; fall back to structural selectors)
4. Define persona overrides — what each persona should hide/emphasize
5. Validate with `npm run validate-packs`
6. Test with extension loaded — confirm extraction picks up correct content

**Definition of done:**

- \[ \] All 3 packs validate against schema
- \[ \] All 3 sites render correctly via extension in Chrome
- \[ \] Each pack has at least one persona override that produces a visibly different result

### 5.5 Build, packaging, and ops

| Command | Effect |
| --- | --- |
| `npm install` | Install all workspaces |
| `npm run check` | Lint + typecheck all packages |
| `npm run test` | Run all unit tests |
| `npm run build` | Build core, ui, extension; emit `dist/extension/` |
| `npm run validate-packs` | Validate every JSON in `rule-packs/` against schema |
| `npm run package` | Produce `dist/onegov-chrome.zip` and `dist/onegov-firefox.xpi` |
| `npm run dev` | Watch mode; reload extension on change |

For v0.1, both packages are unsigned. Signing comes in v0.2 along with remote rule pack updates.

---

## 6. Parallel agent task assignment

Six tracks. Track 1 blocks all others. Tracks 2 + 3 + 5 can run in parallel after Track 1. Track 4 depends on Tracks 2 and 3 (but can scaffold in parallel with placeholders). Track 6 picks up the integration once 4 + 5 are joined.

### Track 1 — Foundation

**Owner:** orchestrator **Blocks:** all other tracks until type definitions land

Deliverables:

- Initialize monorepo with npm workspaces
- TypeScript configs with project references
- Scaffold three packages with empty `index.ts`
- **Commit** `packages/core/src/types.ts` **complete (Section 5.1)** — this is the unblocking event
- Vite config for extension package producing valid empty bundles
- MV3 manifest skeleton committed
- `npm run check` script working

**Done when:** `npm run build` produces a Chrome zip that loads without errors and does nothing visible.

### Track 2 — Core engine logic

**Depends on:** Track 1 types

Deliverables:

- `domain-verifier.ts` with eTLD+1 matching (`psl`)
- `lookalike.ts` (Levenshtein, IDNA, nearest)
- `rule-pack-loader.ts` (Zod validator, bundled fetch)
- `semantic-extractor.ts` (DOM-free, uses `SerializableDoc`)
- `persona.ts` (overrides applier)
- Vitest tests for all of the above

**Done when:** test suite passes; package builds and exports public API.

### Track 3 — UI components

**Depends on:** Track 1 types

Deliverables:

- 8 atomic components in `ui/src/components/`
- 4 persona variants in `ui/src/personas/`
- Theme tokens (CSS custom properties) per persona
- `renderer.tsx` taking `(tree, persona, ShadowRoot)`
- `test-harness.html` showing the same sample tree across all 4 personas

**Done when:** harness renders correctly in Chrome and Firefox, no console errors.

### Track 4 — Extension shell

**Depends on:** Tracks 2 + 3 (can scaffold in parallel with mocks)

Deliverables:

- Background service worker with icon state machine
- Content script with shadow DOM mount, Preact mount, message handling
- Popup UI (status pill, persona picker, show-original toggle, footer)
- Storage abstraction for settings
- Icon generation script (`scripts/gen-icons.ts`) → 9 PNGs

**Done when:** loaded in Chrome, navigating to anaf.ro turns icon green, popup shows correct status, persona switcher updates content script live.

### Track 5 — Rule packs and verified list

**Depends on:** Track 2 schema

Deliverables:

- Curate `_verified-domains.json` from Appendix A seed list, expand to ≥ 30 entries
- Author `anaf.ro.json` (homepage + one inner page)
- Author `onrc.ro.json` (homepage + one results page)
- Author `demoanaf.ro.json` (minimal)
- All packs validate against schema
- Manual QA against live sites

**Done when:** all 3 sites render correctly in Chrome with extension active; key information visibly captured per persona.

### Track 6 — Integration, QA, packaging

**Depends on:** all other tracks

Deliverables:

- E2E test (Playwright + headless Chrome): load extension, navigate to anaf.ro, assert shadow DOM contains expected text
- QA matrix: 4 personas × 3 sites × 2 browsers = 24 cases, smoke-tested
- Final packaging: zip + xpi
- README with install instructions for unpacked load in Chrome and Firefox
- Demo recording script: stepwise instructions for the demo recording

**Done when:** packaged extension installs cleanly in fresh Chrome and Firefox profiles; all 24 QA cases pass.

---

## 7. Integration sequence

1. Track 1 commits foundation + types → all tracks unblocked
2. Tracks 2, 3, 5 work in parallel
3. Track 4 wires Tracks 2 + 3 into extension shell once their public APIs stabilize
4. Track 5 packs land → Track 4 + 5 join → first end-to-end render against anaf.ro
5. Track 6 picks up → exhaustive QA + packaging
6. Demo recording → ship

Daily sync: orchestrator merges PRs continuously. Each track produces small, reviewable commits.

---

## 8. Acceptance criteria (v0.1 ship gate)

- \[ \] Loads cleanly in Chrome (latest stable) and Firefox (latest stable)
- \[ \] Browser action icon correctly shows green / gray / red across at least 10 test domains
- \[ \] Lookalike detection flags `anaf-portal.ro`, `аnaf.ro` (Cyrillic а), `anaf.com` as red
- \[ \] anaf.ro homepage renders in all four personas with no console errors
- \[ \] Switching personas in popup re-renders content within 500ms
- \[ \] "Show original" toggle hides shadow overlay; original page remains intact
- \[ \] No network requests originate from the extension during normal browsing (except bundled asset loads)
- \[ \] Original DOM is byte-identical before and after content script runs (only the appended shadow host node differs — checkable by selector)
- \[ \] No content script errors on any verified domain (manual sweep across all packs)
- \[ \] Final extension package size &lt; 2MB

---

## 9. Verification protocol

Run before declaring v0.1 done:

1. **DOM integrity test:** Snapshot `document.documentElement.outerHTML` on page load, then after content script activation. The diff must contain only the appended `<div id="onegov-root">`.
2. **Network audit:** Open Chrome DevTools → Network tab. Reload a verified domain. Confirm zero new requests originate from the extension.
3. **Performance budget:**
   - Render-to-paint &lt; 200ms after content script start
   - Extension memory footprint &lt; 50MB
4. **Persona switch latency:** From popup click to re-render complete &lt; 500ms.
5. **Cross-browser parity:** Same `SemanticTree` produces visually equivalent output in Chrome and Firefox.
6. **Phishing simulation:** Add 5 synthetic lookalike domains to a test list, navigate, confirm red state on each.

---

## 10. v0.2 roadmap (post-tonight, sequenced by EV)

1. **Form submission bridge** — read-only is the floor; writable is the product. Map rendered form state back through original DOM `submit()`.
2. **AI fallback via local Qwen** — graceful degradation when rule packs miss; semantic extraction from raw DOM when no pack matches.
3. **Remote rule pack updates with Ed25519 signing** — hot-update without store review. CDN-hosted, signed, versioned.
4. **Anti-phishing toast on red state** — explicit user warning beyond just icon color; high EV for trust accumulation.
5. **First-run onboarding flow** — proactive persona picker, not buried in popup.
6. **Behavioral persona classifier** — Bayesian on-device, calibrated by manual override events.
7. **Public verified domain list as data product** — separate repo, signed, consumable by other tools (corporate SSO, email gateways, child-safety filters).
8. **Firefox Android distribution** — same code, package and submit.

---

## Appendix A — Seed verified domain list

Track 5 owner expands and validates this list to ≥ 30 entries before ship.

```json
{
  "version": "0.1.0",
  "updatedAt": "2026-05-02",
  "domains": [
    { "domain": "anaf.ro", "category": "gov", "source": "https://www.anaf.ro" },
    { "domain": "onrc.ro", "category": "gov", "source": "https://www.onrc.ro" },
    { "domain": "gov.ro", "category": "gov", "source": "https://www.gov.ro" },
    { "domain": "mfinante.gov.ro", "category": "gov", "source": "https://mfinante.gov.ro" },
    { "domain": "cnp.ro", "category": "gov", "source": "https://www.cnp.ro" },
    { "domain": "cnas.ro", "category": "gov", "source": "https://www.cnas.ro" },
    { "domain": "data.gov.ro", "category": "gov", "source": "https://data.gov.ro" },
    { "domain": "monitoruloficial.ro", "category": "gov", "source": "https://www.monitoruloficial.ro" },
    { "domain": "just.ro", "category": "gov", "source": "https://www.just.ro" },
    { "domain": "portal.just.ro", "category": "gov", "source": "https://portal.just.ro" },
    { "domain": "ghiseul.ro", "category": "gov", "source": "https://www.ghiseul.ro" },
    { "domain": "edu.ro", "category": "gov", "source": "https://www.edu.ro" },
    { "domain": "ms.ro", "category": "gov", "source": "https://www.ms.ro" },
    { "domain": "mai.gov.ro", "category": "gov", "source": "https://www.mai.gov.ro" },
    { "domain": "demoanaf.ro", "category": "public-interest", "source": "https://demoanaf.ro" }
  ]
}
```

---

## Appendix B — Rule pack example skeleton

```json
{
  "$schema": "https://onegov.ro/schemas/rule-pack-v1.json",
  "domain": "anaf.ro",
  "version": "0.1.0",
  "routes": [
    {
      "match": { "pattern": "^/$" },
      "layout": "landing",
      "extract": [
        {
          "id": "page-title",
          "selector": "h1",
          "type": "heading",
          "attrs": { "text": "textContent" }
        },
        {
          "id": "main-actions",
          "selector": "nav.principal a",
          "type": "link",
          "multiple": true,
          "attrs": { "text": "textContent", "href": "href" }
        }
      ],
      "personas": {
        "pensioner": {
          "layout": "landing-simplified",
          "hide": ["secondary-nav", "footer-links"],
          "emphasize": ["main-actions"]
        },
        "pro": {
          "layout": "landing-dense"
        }
      }
    }
  ]
}
```

---

## Appendix C — Notes for agents

- **Use Preact, not React.** Smaller bundle, identical API, ideal for content scripts.
- **eTLD+1 parsing:** use `psl`.
- **IDNA homograph normalization:** use `idna-uts46-hx` or equivalent.
- **Runtime validation:** use Zod.
- **Tests:** Vitest.
- **Do NOT add Tailwind.** Use plain CSS with custom properties for design tokens — keeps the shadow DOM clean and the bundle small.
- **Do NOT add a state management library.** Preact signals or local state is sufficient.
- **Do NOT pull in a UI component library** (shadcn, Radix, MUI). Build the 8 components by hand — they need persona variability.
- **Do NOT introduce remote fetching of rule packs in v0.1.** Bundled only.
- **Commit early and often.** Small reviewable PRs to the orchestrator.
- **When in doubt, prefer the simplest path that satisfies the invariants in §3.** The invariants are non-negotiable; everything else is.

---

## Appendix D — What "good" looks like at end of day

A 30-second screen recording showing:

1. Open Chrome with onegov.ro installed.
2. Navigate to anaf.ro — site renders in `standard` persona via shadow overlay; icon green.
3. Open popup, switch to `pensioner` persona — page re-renders with large type, simplified layout.
4. Switch to `pro` — dense layout, more affordances visible.
5. Click "show original" — overlay disappears, ANAF's actual portal visible underneath, untouched.
6. Navigate to `anaf-portal.ro` (synthetic test domain) — icon red, popup shows phishing warning.
7. Navigate to demoanaf.ro — icon green, layer renders without breaking the existing UI.

That recording is the artifact. Everything in this plan exists to produce it.