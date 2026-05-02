# onegov.ro — Architecture

This document mirrors the live state of the codebase. Update it whenever you
add or change a module, route, message, or public API.

## High-level diagram (v0.2.0)

```
┌──────────────────────────────────────────────────────────────────┐
│ Extension Shell (MV3) — packages/extension                       │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐        │
│  │ Background   │  │ Content Script   │  │ Popup UI     │        │
│  │ Service Worker│ │ (per tab)        │  │ (Preact)     │        │
│  │              │  │                  │  │              │        │
│  │ icon badge   │  │ 1. resolveModule │  │ density chip │        │
│  │ msg routing  │  │ 2. mountLoader   │  │ on/off toggle│        │
│  │ storage      │  │ 3. verify status │  │ status pill  │        │
│  │ persona infer│  │ 4. shadow host   │  │              │        │
│  │              │  │ 5. App render    │  │              │        │
│  └──────┬───────┘  └────────┬─────────┘  └──────┬───────┘        │
└─────────┼───────────────────┼───────────────────┼────────────────┘
          ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────────────────┐
│ Site modules — packages/extension/src/sites/                     │
│   registry.ts → resolveModule(url) → SiteModule | null           │
│   anaf.ro/                                                       │
│     index.ts        SiteModule export                            │
│     nav.ts          isMatch + classifyRoute                      │
│     context.ts      extractContext (read-only)                   │
│     bridge.ts       form bridging (CUI search proof)             │
│     App.tsx         StatusBar + page switcher                    │
│     Home.tsx        Hero + SearchBox + CardGrid (Density-aware)  │
│     Cui.tsx         CUI lookup + DefinitionList + bridge         │
│     styles.ts       module-scoped CSS                            │
└──────────────────────────────────────────────────────────────────┘
          │                                                 │
          ▼                                                 ▼
┌──────────────────────────────────────┐  ┌────────────────────────┐
│ Loader — packages/extension/src/     │  │ UI — packages/ui       │
│ loader/index.ts                      │  │ 50+ Preact primitives  │
│   mountLoader() → LoaderHandle       │  │ token-driven theme     │
│   removeHideOriginal/applyHideOrig.  │  │ shadow-root mount      │
└──────────────────────────────────────┘  └────────────────────────┘
          │                                                 │
          ▼                                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│ Core Engine — packages/core (DOM-free, pure TS)                  │
│  • domain-verifier.ts    eTLD+1 match → DomainStatus             │
│  • lookalike.ts          Levenshtein, IDNA, nearest              │
│  • rule-pack-loader.ts   load + validate (Zod) — vestigial v0.2  │
│  • semantic-extractor.ts rule + serialized DOM → SemTree (v0.1)  │
│  • persona.ts            persona overrides (carry-over for SW)   │
└──────────────────────────────────────────────────────────────────┘
```

## Packages

### `@onegov/core`

DOM-free pure TypeScript. May not import `chrome.*`, `browser.*`, `document`,
or `window`. Exposes the canonical type contract (`packages/core/src/types.ts`)
plus the engine surface:

| Export | Source | Status (v0.1 scaffold) |
|--------|--------|------------------------|
| Type definitions (`VerifiedDomain`, `DomainStatus`, `Persona`, `RulePack`, `Route`, `PersonaOverride`, `ExtractRule`, `SerializableDoc`, `SerializableEl`, `SemanticTree`, `SemanticNode`, `VerifiedDomainList`) | `types.ts` | Complete (per SPEC §5.1) |
| `verifyDomain(hostname, list)` | `domain-verifier.ts` | Stub — returns `{ kind: 'unknown' }` until Track 2 |
| `levenshtein` / `normalizeHomograph` / `findNearest` | `lookalike.ts` | Stubs until Track 2 |
| `validate` / `loadBundled` | `rule-pack-loader.ts` | Minimal validator until Track 2 |
| `extract` | `semantic-extractor.ts` | Stub returning empty tree until Track 2 |
| `applyPersonaOverrides` | `persona.ts` | Identity stub until Track 2 |

### `@onegov/ui`

Preact components. Imports types from `@onegov/core`. May not use `chrome.*`
or `browser.*`. Operates on a `ShadowRoot` provided by the content script —
it never touches `document` directly.

| Export | Source | Status |
|--------|--------|--------|
| `render(tree, persona, target: ShadowRoot): void` | `renderer.ts` | Stub no-op until Track 3 |

### `@onegov/extension`

The only package allowed to use `chrome.*`. Holds the MV3 manifest, the
background service worker, the content script, the popup Preact app, the
v0.2 loader, and the per-site takeover modules.

| Entry | Output bundle | Status |
|-------|---------------|--------|
| `src/background/index.ts` | `dist/extension/background.js` (ESM, `"type": "module"`) | Per-tab badge state machine + cross-context message routing (status, rule pack, persona inference) |
| `src/content/index.ts` | `dist/extension/content.js` (IIFE) | v0.2 dispatcher: resolves a site module, mounts loader, mounts shadow host, renders the App |
| `src/loader/index.ts` | bundled into content.js | Pre-paint splash + hide-original style with safety timeout |
| `src/sites/registry.ts` | bundled into content.js | URL → SiteModule lookup |
| `src/sites/anaf.ro/*` | bundled into content.js | The v0.2.0 takeover module |
| `src/popup/index.tsx` | `dist/extension/popup.js` (ESM consumed by `popup.html`) | Branded header, on/off toggle, density chip, site-status row |

The build copies `manifest.json`, `popup.html`, `popup.css`, `icons/`,
and the (now vestigial) `rule-packs/` JSON into `dist/extension/`.

#### v0.2 dispatch lifecycle

The content script's main contract:

1. `resolveModule(new URL(location.href))` — `null` exits cleanly, no DOM mutation.
2. `mountLoader()` — appends `<style id="onegov-hide-original">` + splash; auto-aborts after 3s if mount stalls.
3. `chrome.runtime.sendMessage({ type: 'get-status' })` — non-verified → `loader.abort()` (page restored).
4. Mount closed shadow host with full-viewport overlay styles.
5. Inject design-system theme + module CSS into the shadow root.
6. `mod.extractContext(document, url)` — read-only context.
7. `preactRender(h(mod.App, { ctx, runtime }), mount)` inside the shadow root.
8. Hold loader ≥200ms then `loader.dismiss()`.
9. Subscribe to `chrome.storage.onChanged` for `uiDensity` + `extensionEnabled` + legacy `showOriginal`.

#### Site module contract (`packages/extension/src/sites/types.ts`)

```ts
interface SiteModule<Ctx> {
  domain: string;
  isMatch(url: URL): boolean;
  extractContext(doc: Document, url: URL): Ctx;
  App: ComponentType<{ ctx: Ctx; runtime: SiteRuntime }>;
  css?: string;
}
```

`SiteRuntime` injects `{ density, setDensity, showOriginal, hideOriginal }`
so site modules never touch `chrome.*` directly.

v0.2.0 ships ONE site module: `anaf.ro`. The other 5 ship-list domains
(dgep, portal.just, ghiseul, rotld, itmcluj) keep the toolbar badge but
have NO registered module — `resolveModule` returns null and the content
script exits without injecting anything.

#### Form bridging (`sites/anaf.ro/bridge.ts`)

```ts
submitForm({ kind: 'cui-search', cui: '14841555' })
  → BridgeResult { submitted, navigated, reason? }
```

Locates an original `<form>` containing `input[name="cui"]`, writes the
value, dispatches `submit` (preferring `requestSubmit` when available).
Falls back to `location.assign` to a known anaf URL when no form is found.
**Never reads form values passively.**

### Brand icons

The 12 toolbar PNGs (`icons/{green,gray,red}-{16,32,48,128}.png`) are
generated artifacts of four SVG sources in `packages/extension/icons-src/`:
`brand-mark.svg` plus `state-{green,gray,red}.svg`. Composition follows
**Approach B** (state-coloured monogram at 16 px; full mark + corner shield
at 32 / 48 / 128 px) — `scripts/gen-icons.ts` does the swap-and-rasterise.
PNGs are committed because the renderer (`@resvg/resvg-js`) is deterministic.
Full guidelines in `docs/brand.md`.

## Manifest (current — v0.2.0)

Permissions: `storage`, `scripting`, `activeTab`, `webNavigation`. Nothing
else without orchestrator approval (CLAUDE.md rule).

`host_permissions` are unchanged from v0.1.

`content_scripts` is **split** in v0.2.0 so anaf.ro runs at `document_start`
(loader can mount before the page paints) while the other ship-list
domains keep `document_idle`:

```jsonc
"content_scripts": [
  {
    "matches": ["*://*.anaf.ro/*"],
    "js": ["content.js"],
    "run_at": "document_start",
    "all_frames": false
  },
  {
    "matches": [
      "*://dgep.mai.gov.ro/*",
      "*://*.depabd.mai.gov.ro/*",
      "*://portal.just.ro/*",
      "*://*.ghiseul.ro/*",
      "*://*.rotld.ro/*",
      "*://itmcluj.ro/*"
    ],
    "js": ["content.js"],
    "run_at": "document_idle"
  }
]
```

The other-domain entry is currently a no-op at runtime (registry returns
null) — the entry is kept so per-site modules can be added incrementally
without re-touching the manifest.

`browser_specific_settings.gecko` is intentionally **omitted** — v0.1/v0.2
is Chrome-desktop-only. Firefox parity (and the gecko key) lands in v0.3.

## Build pipeline

| Command | Effect |
|---------|--------|
| `bun install` | Install workspaces |
| `bun run check` | `tsc --build` across all three packages |
| `bun run build` | `scripts/build-extension.ts` → three sequential Vite builds → `dist/extension/` |
| `bun run dev` | Vite watch (popup-only by default) |
| `bun run validate-packs` | Walks `rule-packs/` and JSON-parses each file (full Zod validation arrives with Track 2) |
| `bun run gen-icons` | Reads SVG sources in `packages/extension/icons-src/`, composes brand mark + state shields, rasterises 12 PNGs (3 states × 4 sizes) into `packages/extension/icons/`. Renderer: `@resvg/resvg-js` (wasm, no native deps, no `node-forge`). Output is deterministic; PNGs are committed. |
| `bun test` | All workspace test suites |

Vite is invoked once per output bundle because each entry has a different
output format (background = ESM module, content = IIFE, popup = ESM consumed
by HTML).

## Cross-package boundaries

| Package | May import | Forbidden |
|---------|-----------|-----------|
| `@onegov/core` | `psl`, `idna-uts46-hx`, `zod` | DOM, `chrome.*`, `browser.*`, `fetch`, `window`, `document` |
| `@onegov/ui` | `@onegov/core`, `preact` | `chrome.*`, `browser.*`, raw `document` |
| `@onegov/extension` | `@onegov/core`, `@onegov/ui`, `preact`, `chrome.*` | nothing (the only package allowed `chrome.*`) |

ESLint enforces these via `no-restricted-globals` overrides in
`.eslintrc.cjs`. The custom invariant rules (no `eval`, no `Function`, no
`innerHTML` with rule-pack data, no string-based timers) are scaffolded; the
deeper AST checks land as a follow-up task.

## Open follow-ups

Tracked in `jobs/v0.1-foundation/` after this scaffold lands:

1. **Track 2** — implement `verifyDomain`, `findNearest`, the real Zod schema, the semantic extractor, and persona overrides; ≥10 / ≥20 / etc. tests per TESTING.md.
2. **Track 3** — eight atomic Preact components, four persona variants, `theme.css` token set, `test-harness.html`.
3. **Track 4** — wire background icon state machine, content script DOM extraction + shadow mount, full popup UI.
4. **Track 5** — the verified-domain roster (≥30 entries), the six v0.1 rule packs (anaf, dgep, portal.just, ghiseul, rotld, itmcluj).
5. **Follow-up tasks** — full custom invariant ESLint rules, `scripts/package.ts` (zip), bundle-size assertion, Playwright E2E (Chromium-only in v0.1), Firefox-parity task for v0.2. *(`scripts/gen-icons.ts` shipped under Track 6; see `docs/brand.md`.)*
