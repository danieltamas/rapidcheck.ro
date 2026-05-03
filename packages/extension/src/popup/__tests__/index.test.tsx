/**
 * Popup tests — v0.2.0 density chip redesign.
 *
 * Coverage:
 *   - statusPillFor() — pure mapping from DomainStatus → pill metadata
 *   - Popup renders the branded header + primary toggle + density chip
 *     + site status + footer
 *   - Primary toggle writes `extensionEnabled`
 *   - Density chip shows three options with the current selection highlighted
 *   - Picking a density writes `uiDensity` to chrome.storage.local
 *   - Site row shows the current eTLD+1 + variant from get-status reply
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

setupDom();

let statusPillForFn:
  | ((status: DomainStatus | null) => {
      variant: 'verified' | 'lookalike' | 'unknown';
      glyph: string;
      label: string;
    })
  | null = null;

let stub: ChromeContentStub;

function makeResponder(args: {
  status: DomainStatus | null;
  hostname: string | null;
}): (req: Request) => Reply | undefined {
  return (req) => {
    if (req.type === 'get-status') {
      return { type: 'get-status:reply', status: args.status, hostname: args.hostname };
    }
    if (req.type === 'get-persona-inference') {
      // v0.2 popup no longer asks for persona inference, but the SW handler
      // still exists; keep a benign reply so other tests don't trip.
      return {
        type: 'get-persona-inference:reply',
        persona: 'standard',
        reason: '',
        overridden: false,
      };
    }
    return undefined;
  };
}

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>';
  stub = installChromeContentStub(
    makeResponder({
      status: {
        kind: 'verified',
        domain: { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
      },
      hostname: 'anaf.ro',
    }),
  );
  // No initial uiDensity → defaults to 'simplu'.
  // extensionEnabled defaults to true.

  const popupModule = await import('../index.js');
  statusPillForFn = popupModule.statusPillFor;
  // Microtasks for storage.get + sendMessage promises (3 chained).
  await new Promise<void>((r) => queueMicrotask(r));
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

  it('maps verified to green', () => {
    if (!statusPillForFn) return;
    const status: DomainStatus = {
      kind: 'verified',
      domain: { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
    };
    const out = statusPillForFn(status);
    expect(out.variant).toBe('verified');
    expect(out.label).toBe('Site oficial verificat');
  });

  it('maps lookalike to red', () => {
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

  it('maps unknown to gray', () => {
    if (!statusPillForFn) return;
    const out = statusPillForFn({ kind: 'unknown' });
    expect(out.variant).toBe('unknown');
  });
});

describe('Popup — branded header', () => {
  it('renders the inlined onegov logo and tagline (v0.1.2)', () => {
    const logo = document.querySelector('.pop-header__logo');
    const tag = document.querySelector('.pop-header__tagline');
    expect(logo).not.toBeNull();
    expect(logo?.tagName.toLowerCase()).toBe('img');
    expect(logo?.getAttribute('alt')).toBe('onegov');
    expect(tag?.textContent).toContain('UX layer');
  });

  it('drops the legacy text wordmark and the separate g mark tile', () => {
    // The full lockup (mark + wordmark) is now inside onegov.logo.white.svg.
    expect(document.querySelector('.pop-header__name')).toBeNull();
    expect(document.querySelector('.pop-header__mark')).toBeNull();
  });
});

describe('Popup — primary toggle', () => {
  it('renders the switch in the ON state by default', () => {
    const sw = document.querySelector('.pop-switch');
    const cb = document.querySelector('.pop-switch__input') as HTMLInputElement | null;
    expect(sw?.classList.contains('pop-switch--on')).toBe(true);
    expect(cb?.checked).toBe(true);
    expect(cb?.getAttribute('aria-checked')).toBe('true');
  });

  it('writes extensionEnabled when toggled', async () => {
    // Toggle off then back on so we see the storage write deterministically.
    const cb = document.querySelector('.pop-switch__input') as HTMLInputElement | null;
    expect(cb).not.toBeNull();
    if (!cb) return;
    cb.checked = false;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise<void>((r) => queueMicrotask(r));
    expect(stub.storage['extensionEnabled']).toBe(false);
    expect(document.querySelector('.pop-density')).toBeNull();

    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise<void>((r) => queueMicrotask(r));
    expect(stub.storage['extensionEnabled']).toBe(true);
    expect(document.querySelector('.pop-density')).not.toBeNull();
  });
});

describe('Popup — density chip (replaces persona pill in v0.2.0)', () => {
  it('only renders density options while the UI is active', async () => {
    const cb = document.querySelector('.pop-switch__input') as HTMLInputElement | null;
    expect(cb).not.toBeNull();
    if (!cb) return;

    cb.checked = false;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise<void>((r) => queueMicrotask(r));
    expect(document.querySelector('.pop-density')).toBeNull();
    expect(document.querySelectorAll('.pop-density__option').length).toBe(0);

    stub.fireStorageChanged({
      extensionEnabled: { newValue: true, oldValue: false },
    });
    await new Promise<void>((r) => queueMicrotask(r));
    expect(document.querySelectorAll('.pop-density__option').length).toBe(3);
  });

  it('renders the three density options', () => {
    const opts = document.querySelectorAll('.pop-density__option');
    expect(opts.length).toBe(3);
    const labels = Array.from(opts).map((el) => el.textContent);
    expect(labels).toEqual(['Esențial', 'Standard', 'Complet']);
  });

  it('marks the standard density as the default selection', () => {
    const selected = document.querySelector('.pop-density__option--selected');
    expect(selected?.getAttribute('data-density')).toBe('simplu');
    expect(selected?.getAttribute('aria-checked')).toBe('true');
  });

  it('writes uiDensity to chrome.storage.local on click', async () => {
    const opt = document.querySelector(
      '.pop-density__option[data-density="bogat"]',
    ) as HTMLButtonElement | null;
    expect(opt).not.toBeNull();
    opt?.click();
    await new Promise<void>((r) => queueMicrotask(r));
    expect(stub.storage['uiDensity']).toBe('bogat');

    // Hint text reflects the new selection.
    const hint = document.querySelector('.pop-density__hint');
    expect(hint?.textContent).toContain('detalii extinse');
  });

  it('updates the visual selection after click', () => {
    const selected = document.querySelector('.pop-density__option--selected');
    expect(selected?.getAttribute('data-density')).toBe('bogat');
  });

  it('no longer renders the legacy persona pill or picker', () => {
    expect(document.querySelector('.pop-persona__label')).toBeNull();
    expect(document.querySelector('.pop-persona-picker')).toBeNull();
    expect(document.querySelector('.pop-persona-option')).toBeNull();
  });
});

describe('Popup — site status row', () => {
  it('shows the current hostname', () => {
    const host = document.querySelector('.pop-site__host');
    expect(host?.textContent).toBe('anaf.ro');
  });

  it('renders the verified dot variant', () => {
    const dot = document.querySelector('.pop-site__dot');
    expect(dot?.getAttribute('data-variant')).toBe('verified');
  });

  it('renders the verified label', () => {
    const state = document.querySelector('.pop-site__state');
    expect(state?.textContent).toBe('Site oficial verificat');
  });
});

describe('Popup — footer', () => {
  it('renders the version from the manifest stub', () => {
    const footer = document.querySelector('.pop-footer');
    expect(footer?.textContent).toContain('v0.1.0-test');
  });

  it('renders the GitHub link with rel="noopener noreferrer"', () => {
    const link = document.querySelector('.pop-footer__link') as HTMLAnchorElement | null;
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
