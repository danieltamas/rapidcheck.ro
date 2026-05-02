/**
 * Popup tests — premium redesign (v0.1.1).
 *
 * Coverage:
 *   - statusPillFor() — pure mapping from DomainStatus → pill metadata
 *   - Popup renders the branded header + primary toggle + persona pill
 *     + site status + footer
 *   - Primary toggle writes both `extensionEnabled` AND legacy `showOriginal`
 *     (back-compat with the existing content-script listener)
 *   - Persona override picker is HIDDEN by default; "schimbă" reveals it
 *   - Picking a persona writes to chrome.storage.local
 *   - Auto-inferred persona is rendered with the SW-provided reason
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
  inferredPersona?: 'pensioner' | 'standard' | 'pro' | 'journalist';
  reason?: string;
}): (req: Request) => Reply | undefined {
  return (req) => {
    if (req.type === 'get-status') {
      return { type: 'get-status:reply', status: args.status, hostname: args.hostname };
    }
    if (req.type === 'get-persona-inference') {
      return {
        type: 'get-persona-inference:reply',
        persona: args.inferredPersona ?? 'standard',
        reason: args.reason ?? 'încă învăț tiparul tău',
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
      inferredPersona: 'pensioner',
      reason: 'sesiuni lungi, mișcare lentă',
    }),
  );
  // No initial persona override → auto-inference surfaces.
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
  it('renders the wordmark and tagline', () => {
    const name = document.querySelector('.pop-header__name');
    const tag = document.querySelector('.pop-header__tagline');
    expect(name?.textContent).toBe('onegov');
    expect(tag?.textContent).toContain('UX layer');
  });

  it('renders the g brand mark tile', () => {
    const mark = document.querySelector('.pop-header__mark');
    expect(mark?.textContent).toBe('g');
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

  it('writes both extensionEnabled (true) and showOriginal (false) when on', async () => {
    // Toggle off then back on so we see the storage write deterministically.
    const cb = document.querySelector('.pop-switch__input') as HTMLInputElement | null;
    expect(cb).not.toBeNull();
    if (!cb) return;
    cb.checked = false;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise<void>((r) => queueMicrotask(r));
    expect(stub.storage['extensionEnabled']).toBe(false);
    expect(stub.storage['showOriginal']).toBe(true);

    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise<void>((r) => queueMicrotask(r));
    expect(stub.storage['extensionEnabled']).toBe(true);
    expect(stub.storage['showOriginal']).toBe(false);
  });
});

describe('Popup — persona pill', () => {
  it('renders the inferred persona by default (pensioner)', () => {
    const label = document.querySelector('.pop-persona__label');
    expect(label?.textContent).toBe('Vârstnic');
  });

  it('renders the inference reason verbatim', () => {
    const reason = document.querySelector('.pop-persona__reason');
    expect(reason?.textContent).toContain('detectat automat');
    expect(reason?.textContent).toContain('sesiuni lungi');
  });

  it('does NOT show the override picker by default', () => {
    expect(document.querySelector('.pop-persona-picker')).toBeNull();
  });

  it('reveals the picker when "schimbă" is clicked', async () => {
    const change = document.querySelector('.pop-persona__change') as HTMLButtonElement | null;
    expect(change).not.toBeNull();
    expect(change?.textContent).toBe('schimbă');
    change?.click();
    await new Promise<void>((r) => queueMicrotask(r));
    const picker = document.querySelector('.pop-persona-picker');
    expect(picker).not.toBeNull();
    const opts = document.querySelectorAll('.pop-persona-option');
    expect(opts.length).toBe(4);
  });

  it('writes the override when a persona option is clicked', async () => {
    const opt = document.querySelector(
      '.pop-persona-option[data-persona="journalist"]',
    ) as HTMLButtonElement | null;
    expect(opt).not.toBeNull();
    opt?.click();
    await new Promise<void>((r) => queueMicrotask(r));
    expect(stub.storage['persona']).toBe('journalist');
    // Label updates to match the chosen persona.
    const label = document.querySelector('.pop-persona__label');
    expect(label?.textContent).toBe('Jurnalist');
    // Reason now says the user picked it.
    const reason = document.querySelector('.pop-persona__reason');
    expect(reason?.textContent).toContain('ales manual');
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
