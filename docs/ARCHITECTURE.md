# onegov.ro — Architecture

This document mirrors the live state of the codebase. Update it whenever you
add or change a module, route, message, or public API.

## High-level diagram

```
┌────────────────────────────────────────────────────────────┐
│ Extension Shell (MV3) — packages/extension                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Background   │  │ Content      │  │ Popup UI     │      │
│  │ Service      │  │ Script       │  │ (Preact)     │      │
│  │ Worker       │  │ (per tab)    │  │              │      │
│  │              │  │              │  │              │      │
│  │ icon state   │  │ shadow root  │  │ persona pick │      │
│  │ msg routing  │  │ extract→render│ │ show original│      │
│  │ storage      │  │ observe DOM  │  │ status pill  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          ▼                 ▼                 ▼
┌────────────────────────────────────────────────────────────┐
│ Core Engine — packages/core (DOM-free, pure TS)            │
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
│ + 4 persona variants │  │ + verified domain roster       │
└──────────────────────┘  └────────────────────────────────┘
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
background service worker, the content script, and the popup Preact app.

| Entry | Output bundle | Status |
|-------|---------------|--------|
| `src/background/index.ts` | `dist/extension/background.js` (ESM, `"type": "module"`) | Logs install marker; idles |
| `src/content/index.ts` | `dist/extension/content.js` (IIFE) | No-op; never appends shadow host until Track 4 |
| `src/popup/index.tsx` | `dist/extension/popup.js` (ESM consumed by `popup.html`) | Renders placeholder Preact UI |

The build copies `manifest.json`, `popup.html`, `popup.css`, and `icons/`
into `dist/extension/`.

## Manifest (current — v0.1 ship list)

Permissions: `storage`, `scripting`, `activeTab`, `webNavigation`. Nothing
else without orchestrator approval (CLAUDE.md rule).

`host_permissions` and `content_scripts.matches` are restricted to the v0.1
ship list from SITES_COVERAGE.md §8:

```
*://*.anaf.ro/*
*://dgep.mai.gov.ro/*
*://*.depabd.mai.gov.ro/*
*://portal.just.ro/*
*://*.ghiseul.ro/*
*://*.rotld.ro/*
*://itmcluj.ro/*
```

`browser_specific_settings.gecko` is intentionally **omitted** — v0.1 is
Chrome-desktop-only. Firefox parity (and the gecko key) lands in v0.2.

## Build pipeline

| Command | Effect |
|---------|--------|
| `bun install` | Install workspaces |
| `bun run check` | `tsc --build` across all three packages |
| `bun run build` | `scripts/build-extension.ts` → three sequential Vite builds → `dist/extension/` |
| `bun run dev` | Vite watch (popup-only by default) |
| `bun run validate-packs` | Walks `rule-packs/` and JSON-parses each file (full Zod validation arrives with Track 2) |
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
5. **Follow-up tasks** — full custom invariant ESLint rules, `scripts/gen-icons.ts`, `scripts/package.ts` (zip), bundle-size assertion, Playwright E2E (Chromium-only in v0.1), Firefox-parity task for v0.2.
