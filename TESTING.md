# TESTING.md — Test Guide

---

## Test Runners

```bash
# All unit tests across workspaces
bun test

# A single package
cd packages/core && bun test
cd packages/ui && bun test
cd packages/extension && bun test

# Watch mode
bun test -- --watch

# Validate every rule pack against the Zod schema
bun run validate-packs

# Cross-browser end-to-end (Chromium + Firefox)
bun run e2e
bun run e2e -- --project=firefox
bun run e2e -- --debug
```

- **Unit**: bun:test. Lives in `packages/<pkg>/tests/` or `**/__tests__/`.
- **E2E**: Playwright with both Chromium and Firefox projects. Lives in `e2e/`.
- **Visual smoke**: `packages/ui/test-harness.html` opens in any browser and renders the same `SemanticTree` across all four personas side-by-side.

---

## Test Pyramid

```
                ┌─────────────────────┐
                │  Manual cross-browser│   per release
                │  smoke (Chrome+FF)   │
                └─────────────────────┘
              ┌──────────────────────────┐
              │  E2E (Playwright × 2)    │   per PR touching extension
              └──────────────────────────┘
            ┌──────────────────────────────┐
            │  Visual harness (test-harness.html) │   per UI change
            └──────────────────────────────┘
        ┌─────────────────────────────────────┐
        │  Unit tests (bun:test)                 │   every change
        └─────────────────────────────────────┘
```

---

## What to Test

### `packages/core` — pure functions, exhaustively

**`domain-verifier.ts`** (≥ 10 cases)
- Verified eTLD+1 → `verified`
- Subdomain of verified → `verified` (eTLD+1 match)
- Off-list → `unknown`
- Hostname matching a lookalike → `lookalike`
- Edge cases: empty hostname, IPv4 literal, `localhost`, IDN inputs (Punycode form)

**`lookalike.ts`** (≥ 20 cases)
- Levenshtein distance correctness (a few known pairs)
- Cyrillic homograph: `аnaf.ro` (a = U+0430) → `lookalike`
- Greek homograph: `οnrc.ro` (ο = U+03BF) → `lookalike`
- TLD swap: `anaf.com`, `anaf.org`, `anaf.net` → `lookalike`
- Suffix attack: `anaf-portal.ro`, `anaf.ro.example` → `lookalike`
- Genuine off-list (e.g. `google.com`) → not flagged
- IDN normalisation: input as Punycode `xn--naf-...` resolves to the right canonical
- Negative: distance > 2 against any verified domain → not flagged

**`rule-pack-loader.ts`**
- Valid pack fixture → returns typed `RulePack`
- Missing required field → throws ZodError
- Wrong type for `extract.type` → throws ZodError
- Bundled fetch with missing file → returns `null`, never throws

**`semantic-extractor.ts`**
- `single` extraction picks the first match
- `multiple: true` returns all matches
- Missing element → node omitted (does not throw)
- Attribute mapping: `textContent` and named attributes both work
- Node ids preserved as given

**`persona.ts`**
- `hide` removes nodes by id
- `emphasize` lifts nodes to the top, preserving relative order
- `layout` override replaces route default
- Persona without overrides returns the route unchanged

### `packages/ui` — render correctness

- Each component renders with valid props (no crash)
- Components tolerate missing optional fields
- Persona prop changes the rendered output (snapshot per persona)
- `renderer.tsx` is idempotent: re-rendering the same tree is a no-op visually
- Theme CSS injection is idempotent (no duplicate `<style>` tags)
- Bundle size: `dist/extension/content.js.gz` ≤ 80KB (assertion in `scripts/build.ts`)

### `packages/extension` — message protocol + lifecycle

Unit-level (mocking `chrome.*` via a minimal stub):
- Background: `webNavigation.onCommitted` → correct icon path per `DomainStatus`
- Background: persona change in popup propagates to content script via `storage.onChanged`
- Content: exits cleanly on off-list domain (no shadow host appended)
- Content: exits cleanly when no rule pack matches the route
- Content: shadow host is `mode: 'closed'` (handle is non-enumerable from page scope)
- Popup: persona picker writes to `chrome.storage.local`
- Popup: `showOriginal` toggle writes to `chrome.storage.local`

### Rule packs — schema + integration

- Every JSON in `rule-packs/` validates against `schema.json` / Zod
- Verified domain list: every entry has `domain`, `category`, `addedAt` (valid ISO), `source` (valid URL)
- For each shipped pack, an E2E test loads the live (or snapshotted) page and asserts at least one expected `extract.id` produces a non-empty node

### E2E — cross-browser, the real product

Playwright launches Chrome and Firefox with the unpacked extension. Tests in `e2e/`:

```typescript
// e2e/anaf.spec.ts
import { test, expect } from './fixtures.js';

test('anaf.ro renders shadow overlay in standard persona', async ({ page, extensionId }) => {
  await page.goto('https://anaf.ro/');
  // Wait for content script to mount
  await page.waitForSelector('#onegov-root');
  // Closed shadow root is opaque from page scope, but we can assert host presence
  const hostExists = await page.evaluate(() => !!document.getElementById('onegov-root'));
  expect(hostExists).toBe(true);
});

test('off-list domain produces no shadow host', async ({ page }) => {
  await page.goto('https://example.com/');
  const hostExists = await page.evaluate(() => !!document.getElementById('onegov-root'));
  expect(hostExists).toBe(false);
});

test('lookalike domain shows red icon', async ({ page, extensionPopup }) => {
  await page.goto('https://anaf-portal.ro/'); // synthetic fixture
  // Assert via popup query, since we can't read browser action icon directly
  await extensionPopup.goto();
  await expect(extensionPopup.locator('[data-status="lookalike"]')).toBeVisible();
});
```

### DOM-integrity test (the headline assertion)

```typescript
// e2e/dom-integrity.spec.ts
test('content script does not mutate original DOM', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__beforeSnapshot = null;
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') {
        (window as any).__beforeSnapshot = document.documentElement.outerHTML;
      }
    });
  });
  await page.goto('https://anaf.ro/');
  await page.waitForSelector('#onegov-root');
  const { before, after } = await page.evaluate(() => ({
    before: (window as any).__beforeSnapshot as string,
    after: document.documentElement.outerHTML,
  }));
  // The only difference must be the appended <div id="onegov-root">.
  expect(after.replace(/<div id="onegov-root"[^>]*>.*?<\/div>/s, '')).toEqual(before);
});
```

This test is the contractual backbone of invariant #1.

### Network audit test

```typescript
// e2e/network-audit.spec.ts
test('extension makes no external network requests', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (req) => {
    if (req.url().startsWith('chrome-extension://') || req.url().startsWith('moz-extension://')) {
      return;  // bundled asset loads OK
    }
    requests.push(req.url());
  });
  await page.goto('https://anaf.ro/');
  await page.waitForSelector('#onegov-root');
  // Filter out requests the page itself made (only ones with extension origin matter)
  const extOriginated = requests.filter(/* extension-origin filter */);
  expect(extOriginated).toEqual([]);
});
```

---

## Test File Locations

```
packages/core/
├── src/
└── tests/
    ├── domain-verifier.test.ts
    ├── lookalike.test.ts
    ├── rule-pack-loader.test.ts
    ├── semantic-extractor.test.ts
    └── persona.test.ts

packages/ui/
├── src/
│   └── components/__tests__/
└── test-harness.html

packages/extension/
├── src/
│   ├── background/__tests__/
│   ├── content/__tests__/
│   └── popup/__tests__/

e2e/
├── fixtures.ts                  # extension-loading fixtures
├── anaf.spec.ts
├── dom-integrity.spec.ts
├── network-audit.spec.ts
├── persona-switch.spec.ts
└── lookalike.spec.ts
```

Naming: `<module>.test.ts` mirrors the source file.

---

## Mock Patterns

### `chrome.*` API stub

```typescript
// packages/extension/src/__tests__/chrome-stub.ts
import { vi } from 'bun:test';

export function makeChromeStub() {
  const storage = new Map<string, unknown>();
  return {
    runtime: {
      getURL: vi.fn((p: string) => `chrome-extension://test/${p}`),
      onMessage: { addListener: vi.fn() },
    },
    storage: {
      local: {
        get: vi.fn(async (keys: string[]) => Object.fromEntries(keys.map(k => [k, storage.get(k)]))),
        set: vi.fn(async (entries: Record<string, unknown>) => {
          for (const [k, v] of Object.entries(entries)) storage.set(k, v);
        }),
      },
      onChanged: { addListener: vi.fn() },
    },
    action: { setIcon: vi.fn() },
    webNavigation: { onCommitted: { addListener: vi.fn() } },
    tabs: { query: vi.fn() },
  };
}
```

Inject via `globalThis.chrome = makeChromeStub();` in test setup.

### Synthetic `SerializableDoc`

```typescript
// packages/core/tests/helpers/fake-doc.ts
import type { SerializableDoc, SerializableEl } from '@onegov/core';

export function fakeDoc(html: Record<string, SerializableEl[]>): SerializableDoc {
  return {
    query: (sel) => html[sel]?.[0] ?? null,
    queryAll: (sel) => html[sel] ?? [],
  };
}

export const el = (tag: string, text: string, attrs: Record<string, string> = {}): SerializableEl => ({
  tag, text, children: [], attr: (n) => attrs[n] ?? null,
});
```

---

## Cross-Browser Parity

Every PR that touches `packages/extension` or `packages/ui` MUST pass:

```bash
bun run e2e -- --project=chromium
bun run e2e -- --project=firefox
```

Plus a manual smoke load:

1. `bun run build`
2. Chrome: `chrome://extensions` → Load unpacked → `dist/extension/`
3. Firefox: `cd packages/extension && web-ext run --source-dir ../../dist/extension/`
4. Open the QA matrix (4 personas × 6 rule-pack sites = 24 cases) and click through each
5. Record any deltas in the DONE report

---

## Performance & Size Budgets (assertion-tested)

| Metric | Budget | Where asserted |
|--------|--------|----------------|
| `content.js` minified+gzipped | ≤ 80 KB | `scripts/build.ts` exit code |
| Final extension package | ≤ 2 MB | `scripts/package.ts` exit code |
| Render-to-paint after `document_idle` | < 200 ms | E2E timing assertion |
| Persona switch latency | < 500 ms | E2E timing assertion |
| Memory footprint per tab | < 50 MB | manual via Chrome Task Manager (release gate) |

---

## Checklist Before Merge

- [ ] `bun test` passes (every package, every test)
- [ ] `bun run validate-packs` passes
- [ ] `bun run e2e` passes in both Chromium and Firefox
- [ ] Manual smoke: extension loads in Chrome and Firefox without console errors
- [ ] No `.only`, `.skip`, `console.log`, or `debugger` in committed tests
- [ ] Tests are deterministic (no time-of-day or network-flakiness dependence)
- [ ] Mock external dependencies, never the module under test
- [ ] Error paths tested, not just happy paths
- [ ] If a regression: a regression test was added that fails before the fix and passes after
- [ ] Bundle-size assertion still passes
- [ ] DOM-integrity test still passes
- [ ] Network-audit test still passes
