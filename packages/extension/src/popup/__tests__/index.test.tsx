import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import type { DomainStatus } from '@rapidcheck/core';
import type { VerifiedEntitySummary } from '@rapidcheck/directory';

import type { Reply, Request } from '../../messages.js';
import { setupDom } from '../../__tests__/setup-dom.js';
import {
  installChromePopupStub,
  uninstallChromePopupStub,
  type ChromePopupStub,
} from './chrome-stub.js';

setupDom();

let statusPillForFn:
  | ((status: DomainStatus | null) => {
      variant: 'verified' | 'lookalike' | 'unknown';
      glyph: string;
      label: string;
    })
  | null = null;

let stub: ChromePopupStub;

async function waitForPopupUpdate(): Promise<void> {
  for (let i = 0; i < 4; i++) await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function makeResponder(args: {
  status: DomainStatus | null;
  hostname: string | null;
  entity?: VerifiedEntitySummary | null;
}): (req: Request) => Reply | undefined {
  return (req) => {
    if (req.type === 'get-status') {
      return {
        type: 'get-status:reply',
        status: args.status,
        hostname: args.hostname,
        entity: args.entity ?? null,
      };
    }
    if (req.type === 'search-entities') {
      if (req.query.toLowerCase() === 'bt') {
        return {
          type: 'search-entities:reply',
          results: [
            {
              id: 'banca-transilvania',
              name: 'Banca Transilvania',
              shortName: 'BT',
              category: 'bank',
              primaryDomain: 'bancatransilvania.ro',
              officialUrl: 'https://www.bancatransilvania.ro/',
              sourceUrl: 'https://www.bancatransilvania.ro/contact',
              lastVerifiedAt: '2026-05-03',
            },
          ],
        };
      }
      return { type: 'search-entities:reply', results: [] };
    }
    return undefined;
  };
}

beforeAll(async () => {
  document.body.innerHTML = '<div id="app"></div>';
  stub = installChromePopupStub(
    makeResponder({
      status: {
        kind: 'verified',
        domain: { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
      },
      hostname: 'anaf.ro',
      entity: {
        id: 'anaf',
        name: 'Agenția Națională de Administrare Fiscală',
        shortName: 'ANAF',
        category: 'central-gov',
        primaryDomain: 'anaf.ro',
        officialUrl: 'https://www.anaf.ro/',
        sourceUrl: 'https://www.anaf.ro/anaf/internet/ANAF/contact',
        lastVerifiedAt: '2026-05-03',
      },
    }),
  );
  const popupModule = await import('../index.js');
  statusPillForFn = popupModule.statusPillFor;
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await new Promise<void>((resolve) => queueMicrotask(resolve));
});

afterAll(() => {
  uninstallChromePopupStub();
  document.body.innerHTML = '';
});

describe('statusPillFor()', () => {
  it('maps null to unknown', () => {
    expect(statusPillForFn).not.toBeNull();
    if (!statusPillForFn) return;
    const out = statusPillForFn(null);
    expect(out.variant).toBe('unknown');
    expect(out.label).toBe('Site neclasificat');
  });

  it('maps verified to green', () => {
    if (!statusPillForFn) return;
    const out = statusPillForFn({
      kind: 'verified',
      domain: { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
    });
    expect(out.variant).toBe('verified');
    expect(out.label).toBe('Site oficial verificat');
  });

  it('maps lookalike to red', () => {
    if (!statusPillForFn) return;
    const out = statusPillForFn({
      kind: 'lookalike',
      nearest: { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
      distance: 1,
      reason: 'levenshtein',
    });
    expect(out.variant).toBe('lookalike');
    expect(out.label).toBe('Domeniu suspect');
  });
});

describe('Popup trust surface', () => {
  it('renders trust-focused header copy', () => {
    expect(document.querySelector('.pop-header__logo')?.getAttribute('alt')).toBe('RapidCheck.ro');
    expect(document.querySelector('.pop-header__tagline')?.textContent).toContain('Verifică rapid');
  });

  it('renders the protection toggle on by default', () => {
    const sw = document.querySelector('.pop-switch');
    const cb = document.querySelector('.pop-switch__input') as HTMLInputElement | null;
    expect(sw?.classList.contains('pop-switch--on')).toBe(true);
    expect(cb?.checked).toBe(true);
    expect(cb?.getAttribute('aria-checked')).toBe('true');
  });

  it('writes protectionEnabled when toggled', async () => {
    const cb = document.querySelector('.pop-switch__input') as HTMLInputElement | null;
    expect(cb).not.toBeNull();
    if (!cb) return;
    cb.checked = false;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(stub.storage['protectionEnabled']).toBe(false);
    expect(document.querySelector('.pop-feature-list')).toBeNull();
  });

  it('shows the current verified site identity', () => {
    expect(document.querySelector('.pop-status-bar__host')?.textContent).toBe('anaf.ro');
    expect(document.querySelector('.pop-status-bar__dot')?.getAttribute('data-variant')).toBe('verified');
    expect(document.querySelector('.pop-status-bar__label')?.textContent).toBe('Site oficial verificat');
    expect(document.querySelector('.pop-id-card')?.textContent).toContain('Agenția Națională de Administrare Fiscală');
    expect(document.querySelector('.pop-id-card__domain')?.textContent).toContain('anaf.ro');
    expect(document.querySelector('.pop-id-card__proof')?.getAttribute('href')).toContain('proof.html?entity=anaf');
  });

  it('resolves official links from the bundled directory', async () => {
    const input = document.querySelector('.pop-resolver__input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) return;
    input.value = 'BT';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForPopupUpdate();
    expect(document.querySelector('.pop-resolver__results')?.textContent).toContain('bancatransilvania.ro');
    expect(document.querySelector('.pop-resolver__link')?.getAttribute('href')).toBe(
      'https://www.bancatransilvania.ro/',
    );
  });

  it('shows an empty state for unknown resolver queries', async () => {
    const input = document.querySelector('.pop-resolver__input') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    if (!input) return;
    input.value = 'zzzz-not-real';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await waitForPopupUpdate();
    expect(document.querySelector('.pop-resolver__empty')?.textContent).toContain('Nu am găsit');
  });

  it('renders footer metadata', () => {
    expect(document.querySelector('.pop-footer')?.textContent).toContain('v0.1.0-test');
    expect(document.querySelector('.pop-footer__link')?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
