# CODING.md — Engineering Patterns

**Read this before writing any code.** Read `CLAUDE.md` for the workflow and rules; this file is the how.

---

## Stack

- **Language**: TypeScript (strict mode, project references)
- **Build**: Vite (multi-entry for the extension package)
- **Monorepo**: Bun workspaces
- **UI runtime**: Preact (NOT React) + Preact Signals where local state needs to cross components
- **Styling**: Plain CSS with CSS custom properties (`--onegov-*`), scoped inside the closed shadow root
- **Validation**: Zod
- **eTLD+1 parsing**: `psl`
- **IDNA / homograph normalisation**: `idna-uts46-hx` (or equivalent — verify license)
- **Tests**: bun:test (unit), Playwright (E2E, Chromium + Firefox)
- **Lint**: ESLint + `@typescript-eslint` + custom rules forbidding `eval` / `innerHTML` / `chrome.*` outside `packages/extension`
- **Format**: Prettier
- **Firefox dev**: `web-ext`

### Forbidden additions

See `CLAUDE.md §Stack`. Short version: no React, no Tailwind, no UI library, no state management library, no telemetry, no remote code.

---

## Project Structure

```
onegov.ro/
├── packages/
│   ├── core/                            # DOM-free, pure TS
│   │   ├── src/
│   │   │   ├── types.ts                 # PUBLIC: source of truth for cross-package types
│   │   │   ├── domain-verifier.ts       # eTLD+1 → DomainStatus
│   │   │   ├── lookalike.ts             # Levenshtein + IDNA + TLD swap
│   │   │   ├── rule-pack-loader.ts      # Zod validator + bundled fetch
│   │   │   ├── semantic-extractor.ts    # SerializableDoc → SemanticTree
│   │   │   ├── persona.ts               # apply persona overrides to a Route
│   │   │   └── index.ts                 # barrel
│   │   └── tests/
│   ├── ui/                              # Preact components, persona variants, theme
│   │   ├── src/
│   │   │   ├── personas/                # 4 persona variants
│   │   │   ├── components/              # 8 atomic components
│   │   │   ├── renderer.tsx             # render(tree, persona, ShadowRoot)
│   │   │   ├── theme.css                # CSS custom properties per persona
│   │   │   └── index.ts
│   │   └── test-harness.html            # standalone visual test page
│   └── extension/                       # ONLY package allowed to use chrome.*
│       ├── src/
│       │   ├── background/index.ts      # service worker
│       │   ├── content/index.ts         # per-tab content script
│       │   ├── popup/index.tsx          # popup Preact app
│       │   ├── popup/popup.html
│       │   ├── popup/popup.css
│       │   └── manifest.json
│       ├── icons/                       # generated PNGs (green/gray/red × 16/32/48)
│       └── vite.config.ts
├── rule-packs/
│   ├── schema.json                      # JSON Schema (mirrors Zod)
│   ├── _verified-domains.json
│   ├── anaf.ro.json
│   ├── dgep.mai.gov.ro.json
│   ├── portal.just.ro.json
│   ├── ghiseul.ro.json
│   ├── rotld.ro.json
│   └── itmcluj.ro.json
├── scripts/
│   ├── build.ts                         # orchestrate vite builds across workspaces
│   ├── package.ts                       # produce zip + xpi
│   ├── gen-icons.ts                     # generate icon PNGs from SVG
│   └── validate-packs.ts                # validate every rule pack against Zod schema
├── e2e/                                 # Playwright cross-browser tests
├── jobs/                                # task specs, DONE/REVIEW reports, QA artifacts
├── docs/                                # ARCHITECTURE.md, LOG.md
├── .worktrees/                          # gitignored — sub-agent worktrees
├── package.json                         # workspaces + scripts
├── tsconfig.base.json
└── (CLAUDE.md, ONSTART.md, CODING.md, TESTING.md, SECURITY.md, SPEC.md, SITES_COVERAGE.md, README.md, CONTRIBUTING.md, LICENSE)
```

---

## Naming Conventions

| What | Convention | Example |
|------|-----------|---------|
| TypeScript files | kebab-case | `domain-verifier.ts` |
| Preact components (file + export) | PascalCase | `Heading.tsx`, `export function Heading()` |
| Variables / functions | camelCase | `verifyDomain` |
| Types / interfaces | PascalCase | `DomainStatus`, `SemanticTree` |
| Constants | UPPER_SNAKE | `MAX_LOOKALIKE_DISTANCE` |
| CSS custom properties | kebab-case with `--onegov-` prefix | `--onegov-color-primary` |
| Rule pack filenames | the eTLD+1 they cover | `anaf.ro.json`, `portal.just.ro.json` |
| Branch names | `job/<job>/<group>-<task>` | `job/v0.1-foundation/extension-content` |
| Commits | Conventional Commits | `feat(core): add IDNA homograph normalization` |

---

## Cross-package boundaries

| Package | May import from | May NOT use |
|---------|----------------|-------------|
| `@onegov/core` | nothing browser-specific (no DOM, no `chrome.*`, no `window`) | `document`, `window`, `chrome.*`, `browser.*`, `fetch` |
| `@onegov/ui` | `@onegov/core` types, Preact | `chrome.*`, `browser.*`, direct `document.*` access (operate on a `ShadowRoot` you're given) |
| `@onegov/extension` | both above, `chrome.*` / `browser.*` | nothing — this is the only place those APIs are allowed |

Lint rule (`no-restricted-globals`) enforces this.

---

## Core Patterns

### Type definitions are the contract

`packages/core/src/types.ts` is the single source of truth shared across all packages. Changes to it require explicit orchestrator approval — they ripple everywhere. See `SPEC.md §5.1` for the canonical types.

### Pure functions, `SerializableDoc` boundary

The semantic extractor never touches a real `Document`. It operates on a `SerializableDoc`:

```typescript
// packages/core/src/types.ts
export interface SerializableDoc {
  query(selector: string): SerializableEl | null;
  queryAll(selector: string): SerializableEl[];
}

export interface SerializableEl {
  tag: string;
  text: string;
  attr(name: string): string | null;
  children: SerializableEl[];
}
```

The content script (in `packages/extension`) wraps the real document into a `SerializableDoc` adapter at the boundary. This keeps `core` testable in Node and reusable in v0.2 mobile shells.

### Domain verification

```typescript
// packages/core/src/domain-verifier.ts
import { parse } from 'psl';
import type { DomainStatus, VerifiedDomainList } from './types.js';
import { findNearest } from './lookalike.js';

export function verifyDomain(hostname: string, list: VerifiedDomainList): DomainStatus {
  const parsed = parse(hostname);
  if (!parsed.domain) return { kind: 'unknown' };

  const exact = list.domains.find(d => d.domain === parsed.domain);
  if (exact) return { kind: 'verified', domain: exact };

  const nearest = findNearest(parsed.domain, list);
  if (nearest) return { kind: 'lookalike', ...nearest };

  return { kind: 'unknown' };
}
```

### Rule pack loader

```typescript
// packages/core/src/rule-pack-loader.ts
import { z } from 'zod';
import type { RulePack } from './types.js';

const ExtractRuleSchema = z.object({
  id: z.string().min(1),
  selector: z.string().min(1),
  type: z.enum(['heading', 'paragraph', 'list', 'table', 'form', 'link', 'image']),
  attrs: z.record(z.string()).optional(),
  multiple: z.boolean().optional(),
});

const RouteSchema = z.object({
  match: z.object({ pattern: z.string() }),
  layout: z.string(),
  extract: z.array(ExtractRuleSchema),
  personas: z.record(z.unknown()).optional(),
});

const RulePackSchema = z.object({
  $schema: z.string(),
  domain: z.string(),
  version: z.string(),
  routes: z.array(RouteSchema),
});

export function validate(input: unknown): RulePack {
  return RulePackSchema.parse(input) as RulePack;
}

export async function loadBundled(
  domain: string,
  fetcher: (url: string) => Promise<unknown>,
): Promise<RulePack | null> {
  try {
    const data = await fetcher(`rule-packs/${domain}.json`);
    return validate(data);
  } catch {
    return null;
  }
}
```

The `fetcher` is injected so `core` doesn't depend on `chrome.runtime.getURL`. The content script provides it.

---

## Extension Patterns

### Background service worker

```typescript
// packages/extension/src/background/index.ts
import { verifyDomain } from '@onegov/core';
import verifiedList from '../../../../rule-packs/_verified-domains.json' assert { type: 'json' };

chrome.webNavigation.onCommitted.addListener(({ tabId, url, frameId }) => {
  if (frameId !== 0) return; // only top frame
  const status = verifyDomain(new URL(url).hostname, verifiedList);
  setIcon(tabId, status.kind);
});

function setIcon(tabId: number, kind: 'verified' | 'lookalike' | 'unknown') {
  const color = kind === 'verified' ? 'green' : kind === 'lookalike' ? 'red' : 'gray';
  chrome.action.setIcon({
    tabId,
    path: {
      16: `icons/${color}-16.png`,
      32: `icons/${color}-32.png`,
      48: `icons/${color}-48.png`,
    },
  });
}
```

No background polling. No periodic alarms. The service worker idles.

### Content script

```typescript
// packages/extension/src/content/index.ts
import { extract, verifyDomain, loadBundled } from '@onegov/core';
import { render } from '@onegov/ui';
import verifiedList from '../../../../rule-packs/_verified-domains.json' assert { type: 'json' };

(async function main() {
  const status = verifyDomain(location.hostname, verifiedList);
  if (status.kind !== 'verified') return; // Off-list or lookalike: do nothing.

  const pack = await loadBundled(status.domain.domain, async (path) => {
    const res = await fetch(chrome.runtime.getURL(path));
    return res.json();
  });
  if (!pack) return;

  const route = pack.routes.find(r => new RegExp(r.match.pattern).test(location.pathname));
  if (!route) return;

  const persona = (await chrome.storage.local.get('persona')).persona ?? 'standard';
  const tree = extract(route.extract, wrapDocument(document), location.href);

  const host = document.createElement('div');
  host.id = 'onegov-root';
  host.dataset.onegov = '1';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'closed' });

  render(tree, persona, shadow);

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.persona) render(tree, changes.persona.newValue, shadow);
    if (changes.showOriginal) host.style.display = changes.showOriginal.newValue ? 'none' : 'block';
  });
})();
```

### Popup

```tsx
// packages/extension/src/popup/index.tsx
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type { Persona } from '@onegov/core';

function Popup() {
  const [persona, setPersona] = useState<Persona>('standard');
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['persona', 'showOriginal']).then(s => {
      if (s.persona) setPersona(s.persona);
      if (s.showOriginal) setShowOriginal(s.showOriginal);
    });
  }, []);

  function pickPersona(p: Persona) {
    setPersona(p);
    chrome.storage.local.set({ persona: p });
  }

  return (
    <div class="popup">{/* ... */}</div>
  );
}

render(<Popup />, document.getElementById('app')!);
```

### Manifest skeleton

See `SPEC.md §5.3` for the canonical manifest. Critical fields:

- `manifest_version: 3`
- `host_permissions`: minimal — only the eTLD+1s with shipped rule packs
- `permissions`: `storage`, `scripting`, `activeTab`, `webNavigation` only
- `web_accessible_resources`: only `rule-packs/*.json`
- `browser_specific_settings.gecko` for Firefox

---

## UI Patterns

> **Canonical reference:** [`docs/design-system.md`](./docs/design-system.md) is
> the source of truth for every UI primitive shipped by `@onegov/ui` — props,
> variants, states, accessibility notes, composition examples. Read it before
> writing UI. The visual playground at
> [`packages/ui/playground/index.html`](./packages/ui/playground/index.html)
> renders every component live; the typed token mirror lives at
> [`packages/ui/src/tokens.ts`](./packages/ui/src/tokens.ts).
>
> If a primitive you need does not exist, EXTEND the library in
> `packages/ui/src/components/` and update the catalog + playground in the
> same commit. Never inline a Button, Card, Modal, etc.

### Renderer signature

```typescript
// packages/ui/src/renderer.tsx
import { render as preactRender } from 'preact';
import type { SemanticTree, Persona } from '@onegov/core';
import { App } from './App.js';
import { themeFor } from './theme.js';

export function render(tree: SemanticTree, persona: Persona, target: ShadowRoot): void {
  // 1. Inject scoped theme.css into shadow root (idempotent)
  if (!target.querySelector('style[data-onegov-theme]')) {
    const style = document.createElement('style');
    style.setAttribute('data-onegov-theme', '1');
    style.textContent = themeFor(persona);
    target.appendChild(style);
  }
  // 2. Mount Preact app
  let mount = target.querySelector<HTMLDivElement>('#onegov-app');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'onegov-app';
    target.appendChild(mount);
  }
  preactRender(<App tree={tree} persona={persona} />, mount);
}
```

### Component contract

Every atomic component accepts `persona: Persona` and adapts. No prop drilling — pass via context if depth gets painful.

```tsx
// packages/ui/src/components/Heading.tsx
import type { Persona } from '@onegov/core';

interface Props {
  text: string;
  persona: Persona;
}

export function Heading({ text, persona }: Props) {
  const cls = persona === 'pensioner' ? 'h1 h1--large' : 'h1';
  return <h1 class={cls}>{text}</h1>;
}
```

### Theme tokens

```css
/* packages/ui/src/theme.css — fragment */
:host { /* shadow root */
  --onegov-color-primary: #003B73;       /* ANAF blue, identitate.gov.ro */
  --onegov-color-bg: #ffffff;
  --onegov-color-text: #1a1a1a;
  --onegov-font-base: Arial, Calibri, Verdana, Tahoma, sans-serif;
  --onegov-font-size-base: 16px;
  --onegov-spacing: 8px;
}

:host([data-persona="pensioner"]) {
  --onegov-font-size-base: 20px;
  --onegov-spacing: 16px;
}

:host([data-persona="pro"]) {
  --onegov-font-size-base: 14px;
  --onegov-spacing: 4px;
}
```

### Loading / empty / error states

The content script may render before extraction completes (or extraction may yield zero nodes). Components must render gracefully with missing fields. No spinners in the content script — use skeletons.

---

## Rule Pack Patterns

### Authoring template

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
        }
      }
    }
  ]
}
```

### Selector hygiene

- Prefer `[data-*]` and stable IDs
- Fall back to structural selectors (`nav.principal a`) only when nothing better exists
- NEVER use generated class names (e.g. CSS-in-JS hashes)
- NEVER use selectors that depend on render order (`:nth-child(3)`) without commenting why

### Persona override semantics

- `hide`: list of `extract.id`s to omit from the rendered tree (still extracted, then filtered)
- `emphasize`: lift these node ids to the top of the rendered tree
- `layout`: override the route's default layout name

---

## Tooling

### Lint rules (custom)

Add to `.eslintrc.cjs`:

```js
module.exports = {
  rules: {
    'no-restricted-globals': ['error',
      { name: 'eval', message: 'Forbidden by invariant 3' },
      { name: 'Function', message: 'Forbidden by invariant 3' },
    ],
    'no-restricted-syntax': ['error',
      {
        selector: "CallExpression[callee.name='setTimeout'][arguments.0.type='Literal']",
        message: 'String-based setTimeout is forbidden',
      },
      {
        selector: "Property[key.name='innerHTML']",
        message: 'innerHTML with rule-pack data is forbidden',
      },
    ],
  },
  overrides: [
    {
      // Forbid chrome.* outside the extension package
      files: ['packages/core/**', 'packages/ui/**'],
      rules: {
        'no-restricted-globals': ['error', 'chrome', 'browser'],
      },
    },
  ],
};
```

### Bundle size check

`scripts/build.ts` exits non-zero if `dist/extension/content.js.gz` exceeds 80KB or the total package exceeds 2MB.

---

## Rules (summary)

1. **The five invariants are absolute** (see CLAUDE.md).
2. **MAX 500 lines per file.** Split into modules.
3. **TypeScript strict; no `any`.** Use `unknown` and narrow.
4. **ENGLISH in all code.** Romanian only in user-facing UI text.
5. **No `chrome.*` outside `packages/extension`.**
6. **Closed shadow root only.**
7. **No `innerHTML` with rule-pack data; no `eval`; no `Function()`.**
8. **No remote fetching in extension code.** Only `chrome.runtime.getURL` for bundled assets.
9. **No new dependencies / host_permissions** without orchestrator approval.
10. **Conventional Commits, no `Co-Authored-By`.**
11. **Cross-browser parity is non-negotiable.** Chrome AND Firefox, every PR.
12. **Adopt `identitate.gov.ro` design tokens.** Don't invent visual identity.
