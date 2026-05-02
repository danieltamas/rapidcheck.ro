/**
 * Popup tests.
 *
 * Coverage:
 *   - statusPillFor() — pure mapping from DomainStatus → pill metadata
 *   - Popup renders the four persona buttons in 2x2 grid
 *   - Clicking a persona writes to chrome.storage.local
 *   - Toggling showOriginal writes to chrome.storage.local
 *   - Status pill reflects the latest reply from `get-status`
 *
 * Per the bun:test contract, top-level imports run before any `beforeAll`,
 * so we install happy-dom + the chrome stub at the top of the file
 * (synchronous side effect during module evaluation), then load the popup
 * via dynamic `import()` once the DOM and stub are in place. The
 * `statusPillFor` function is exported and tested in isolation as well.
 */

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import type { DomainStatus } from '@onegov/core';

import { setupDom } from '../../../../ui/tests/setup-dom.js';
import type { Reply, Request } from '../../messages.js';
import {
  installChromeContentStub,
  uninstallChromeContentStub,
  type ChromeContentStub,
} from '../../content/__tests__/chrome-stub.js';

// Install happy-dom synchronously at module load so the popup module's
// `document.getElementById('app')` access does not crash when the dynamic
// import runs in `beforeAll`.
setupDom();

// Pure-function pill mapping — exported by the popup module. Imported
// lazily inside the test so the file's static-import phase stays free of
// the popup module body (which mounts on import).
let statusPillForFn:
  | ((status: DomainStatus | null) => {
      variant: 'verified' | 'lookalike' | 'unknown';
      glyph: string;
      label: string;
    })
  | null = null;

let stub: ChromeContentStub;

function makeResponder(initialStatus: DomainStatus | null): (req: Request) => Reply | undefined {
  return (req) => {
    if (req.type === 'get-status') {
      return { type: 'get-status:reply', status: initialStatus };
    }
    return undefined;
  };
}

beforeAll(async () => {
  // Mount node the popup looks for + chrome stub seeded with hydration data.
  document.body.innerHTML = '<div id="app"></div>';
  stub = installChromeContentStub(
    makeResponder({
      kind: 'verified',
      domain: { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
    }),
  );
  stub.storage['persona'] = 'pro';
  stub.storage['showOriginal'] = false;

  const popupModule = await import('../index.js');
  statusPillForFn = popupModule.statusPillFor;
  // Microtasks for storage.get + sendMessage promises.
  await new Promise<void>((r) => queueMicrotask(r));
  await new Promise<void>((r) => queueMicrotask(r));
  await new Promise<void>((r) => queueMicrotask(r));
});

afterAll(() => {
  uninstallChromeContentStub();
  document.body.innerHTML = '';
});

describe('statusPillFor()', () => {
  it('maps null to gray "Site nesuportat"', () => {
    expect(statusPillForFn).not.toBeNull();
    if (!statusPillForFn) return;
    const out = statusPillForFn(null);
    expect(out.variant).toBe('unknown');
    expect(out.label).toBe('Site nesuportat');
  });

  it('maps verified to green pill', () => {
    if (!statusPillForFn) return;
    const status: DomainStatus = {
      kind: 'verified',
      domain: { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
    };
    const out = statusPillForFn(status);
    expect(out.variant).toBe('verified');
    expect(out.label).toBe('Site oficial verificat');
  });

  it('maps lookalike to red pill', () => {
    if (!statusPillForFn) return;
    const status: DomainStatus = {
      kind: 'lookalike',
      nearest: { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
      distance: 1,
      reason: 'levenshtein',
    };
    const out = statusPillForFn(status);
    expect(out.variant).toBe('lookalike');
    expect(out.label).toBe('Atenție — domeniu suspect');
  });

  it('maps unknown to gray pill', () => {
    if (!statusPillForFn) return;
    const out = statusPillForFn({ kind: 'unknown' });
    expect(out.variant).toBe('unknown');
  });
});

describe('Popup — initial render', () => {
  it('renders the wordmark', () => {
    const title = document.querySelector('.header__title');
    expect(title?.textContent).toBe('onegov.ro');
  });

  it('renders the status pill with the verified variant', () => {
    const pill = document.querySelector('.status-pill');
    expect(pill?.getAttribute('data-variant')).toBe('verified');
    expect(pill?.textContent).toContain('Site oficial verificat');
  });

  it('renders all four persona buttons', () => {
    const buttons = document.querySelectorAll('.persona-button');
    expect(buttons.length).toBe(4);
    const personas = Array.from(buttons).map((b) => b.getAttribute('data-persona'));
    expect(personas).toEqual(['pensioner', 'standard', 'pro', 'journalist']);
  });

  it('marks the hydrated persona (pro) as selected', () => {
    const selected = document.querySelector('.persona-button--selected');
    expect(selected?.getAttribute('data-persona')).toBe('pro');
  });

  it('renders the showOriginal toggle unchecked by default', () => {
    const cb = document.querySelector('.toggle input[type="checkbox"]') as HTMLInputElement | null;
    expect(cb?.checked).toBe(false);
  });

  it('renders the footer with the manifest version', () => {
    const v = document.querySelector('.footer__version');
    expect(v?.textContent).toBe('v0.1.0-test');
  });

  it('renders the GitHub link with rel="noopener noreferrer"', () => {
    const link = document.querySelector('.footer__link') as HTMLAnchorElement | null;
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('Popup — interactions', () => {
  it('writes the picked persona to chrome.storage.local', async () => {
    const pensionerBtn = document.querySelector(
      '.persona-button[data-persona="pensioner"]',
    ) as HTMLButtonElement | null;
    expect(pensionerBtn).not.toBeNull();
    pensionerBtn?.click();
    // Microtask for the set() promise.
    await new Promise<void>((r) => queueMicrotask(r));
    expect(stub.storage['persona']).toBe('pensioner');
  });

  it('reflects the picked persona via aria-checked + selected class', async () => {
    const journalistBtn = document.querySelector(
      '.persona-button[data-persona="journalist"]',
    ) as HTMLButtonElement | null;
    expect(journalistBtn).not.toBeNull();
    journalistBtn?.click();
    await new Promise<void>((r) => queueMicrotask(r));
    const selected = document.querySelector('.persona-button--selected');
    expect(selected?.getAttribute('data-persona')).toBe('journalist');
    expect(journalistBtn?.getAttribute('aria-checked')).toBe('true');
  });

  it('writes showOriginal to storage when toggled', async () => {
    const cb = document.querySelector('.toggle input[type="checkbox"]') as HTMLInputElement | null;
    expect(cb).not.toBeNull();
    if (!cb) return;
    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise<void>((r) => queueMicrotask(r));
    expect(stub.storage['showOriginal']).toBe(true);
  });
});
