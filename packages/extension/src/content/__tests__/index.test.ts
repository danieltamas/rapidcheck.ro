/**
 * Content-script lifecycle tests.
 *
 * The script is an IIFE — its main work runs as a side effect of the module
 * import. To test it without forking a real browser context we:
 *   1. Install a chrome stub onto globalThis (provides sendMessage / storage)
 *   2. Set up happy-dom so `document` exists
 *   3. Re-import the module fresh per test so each lifecycle re-runs against
 *      the configured stub
 *
 * The script's behaviour we care about:
 *   - On `verified` status + matching pack + matching route → shadow host
 *     appended to <body>, persona-adapted Preact app mounted inside the
 *     closed shadow root, with full-viewport positioning.
 *   - On `unknown` / `lookalike` / null status → no shadow host appended,
 *     `documentElement.outerHTML` stays byte-equal (modulo the documented
 *     overflow toggle which is only set when overlay is actually visible).
 *   - On verified but no matching pack → no shadow host appended.
 *   - Persona switch via `storage.onChanged` → re-renders inside the same
 *     shadow root (no DOM churn).
 *   - extensionEnabled / showOriginal toggle via `storage.onChanged` →
 *     flips host display + restores documentElement.style.overflow.
 *   - v0.1.1: shadow host has full-viewport overlay styles applied.
 *   - v0.1.1: documentElement.style.overflow is locked when overlay shown,
 *     restored to the original value when overlay hidden.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';

import type { DomainStatus, RulePack } from '@onegov/core';

import { setupDom } from '../../../../ui/tests/setup-dom.js';
import type { Reply, Request } from '../../messages.js';

import {
  installChromeContentStub,
  uninstallChromeContentStub,
  type ChromeContentStub,
} from './chrome-stub.js';

const VERIFIED_STATUS: DomainStatus = {
  kind: 'verified',
  domain: { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-02', source: 'https://anaf.ro' },
};

const SAMPLE_PACK: RulePack = {
  $schema: 'https://onegov.ro/schemas/rule-pack-v1.json',
  domain: 'anaf.ro',
  version: '0.1.0',
  routes: [
    {
      match: { pattern: '^/$' },
      layout: 'landing',
      extract: [
        { id: 'page-title', selector: 'h1', type: 'heading', attrs: { text: 'textContent' } },
      ],
    },
  ],
};

beforeAll(() => {
  setupDom();
});

let stub: ChromeContentStub;

beforeEach(() => {
  document.body.innerHTML = '<h1>Bun venit pe ANAF</h1>';
  // Reset documentElement inline overflow between tests so the lock helper
  // sees a fresh slate. (We assert against this to ensure no leak between
  // tests.)
  document.documentElement.style.overflow = '';
  // Force happy-dom URL to root path so the route matcher finds `^/$`.
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  uninstallChromeContentStub();
  document.body.innerHTML = '';
  document.documentElement.style.overflow = '';
});

function makeResponder(replies: Reply[]): (req: Request) => Reply | undefined {
  return (req) => {
    const reply = replies.shift();
    if (!reply) return undefined;
    if (req.type === 'get-status' && reply.type !== 'get-status:reply') return undefined;
    if (req.type === 'load-pack' && reply.type !== 'load-pack:reply') return undefined;
    return reply;
  };
}

async function runContentScript(): Promise<void> {
  const bust = String(Date.now()) + String(Math.random());
  await import(`../index.js?bust=${bust}`);
  // Microtasks for the get-status + load-pack + render chain to resolve.
  for (let i = 0; i < 6; i++) {
    await new Promise<void>((r) => queueMicrotask(r));
  }
}

describe('content script — exits cleanly when status is unknown', () => {
  it('does not append a shadow host', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: { kind: 'unknown' } }]),
    );
    const before = document.documentElement.outerHTML;
    await runContentScript();
    expect(document.querySelector('#onegov-root')).toBeNull();
    expect(document.documentElement.outerHTML).toBe(before);
    expect(stub.messages).toHaveLength(1);
    expect(stub.messages[0]?.type).toBe('get-status');
    // Document scroll lock NOT applied on early exit.
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('content script — exits cleanly on lookalike', () => {
  it('does not append a shadow host', async () => {
    const lookalikeStatus: DomainStatus = {
      kind: 'lookalike',
      nearest:
        VERIFIED_STATUS.kind === 'verified'
          ? VERIFIED_STATUS.domain
          : { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
      distance: 1,
      reason: 'levenshtein',
    };
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: lookalikeStatus }]),
    );
    const before = document.documentElement.outerHTML;
    await runContentScript();
    expect(document.querySelector('#onegov-root')).toBeNull();
    expect(document.documentElement.outerHTML).toBe(before);
  });
});

describe('content script — exits cleanly when SW unreachable', () => {
  it('does not append a shadow host on null reply', async () => {
    stub = installChromeContentStub(() => undefined);
    await runContentScript();
    expect(document.querySelector('#onegov-root')).toBeNull();
  });
});

describe('content script — exits cleanly when no pack', () => {
  it('does not append a shadow host', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: null },
      ]),
    );
    await runContentScript();
    expect(document.querySelector('#onegov-root')).toBeNull();
    expect(stub.messages).toHaveLength(2);
    expect(stub.messages[1]?.type).toBe('load-pack');
  });
});

describe('content script — exits cleanly when no route matches', () => {
  it('does not append a shadow host when pack has no matching route', async () => {
    const packNoMatch: RulePack = {
      ...SAMPLE_PACK,
      routes: [{ ...SAMPLE_PACK.routes[0]!, match: { pattern: '^/elsewhere$' } }],
    };
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: packNoMatch },
      ]),
    );
    await runContentScript();
    expect(document.querySelector('#onegov-root')).toBeNull();
  });
});

describe('content script — happy path', () => {
  it('appends a closed shadow host and mounts the rendered tree', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host).not.toBeNull();
    if (!host) return;
    expect(host.dataset['onegov']).toBe('1');
    expect(host.shadowRoot).toBeNull();
  });

  it('subscribes to chrome.storage.onChanged exactly once', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    expect(stub.storageListenerCount()).toBe(1);
  });

  it('does NOT mutate any pre-existing element of the page', async () => {
    document.body.innerHTML = '<h1 id="page">Bun venit pe ANAF</h1>';
    const beforeH1 = document.getElementById('page')?.outerHTML;
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    const afterH1 = document.getElementById('page')?.outerHTML;
    expect(afterH1).toBe(beforeH1);
  });
});

describe('content script — full-viewport overlay (v0.1.1)', () => {
  it('applies position:fixed inset:0 z-index max isolation:isolate', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host).not.toBeNull();
    if (!host) return;
    // Each style is set via setProperty(..., 'important'). happy-dom exposes
    // them via getPropertyValue and getPropertyPriority.
    expect(host.style.getPropertyValue('position')).toBe('fixed');
    expect(host.style.getPropertyPriority('position')).toBe('important');
    expect(host.style.getPropertyValue('inset')).toBe('0');
    expect(host.style.getPropertyValue('z-index')).toBe('2147483647');
    expect(host.style.getPropertyValue('isolation')).toBe('isolate');
  });

  it('uses an opaque background so the page is visually replaced', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host).not.toBeNull();
    if (!host) return;
    expect(host.style.getPropertyValue('background')).toBe('#ffffff');
  });

  it('locks documentElement scroll while overlay is visible', async () => {
    expect(document.documentElement.style.overflow).toBe('');
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('restores documentElement.style.overflow when overlay is hidden', async () => {
    document.documentElement.style.overflow = 'auto'; // simulate page default
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    // Locked.
    expect(document.documentElement.style.overflow).toBe('hidden');

    // Toggle off via the new extensionEnabled key.
    stub.fireStorageChanged({
      extensionEnabled: { newValue: false, oldValue: true },
    });
    // Settle async readSettings round-trip.
    for (let i = 0; i < 4; i++) await new Promise<void>((r) => queueMicrotask(r));
    expect(document.documentElement.style.overflow).toBe('auto');
  });
});

describe('content script — escape hatch (legacy showOriginal)', () => {
  it('hides the host when showOriginal flips to true', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host).not.toBeNull();
    if (!host) return;
    expect(host.style.getPropertyValue('display')).toBe('block');

    stub.fireStorageChanged({ showOriginal: { newValue: true, oldValue: false } });
    for (let i = 0; i < 4; i++) await new Promise<void>((r) => queueMicrotask(r));
    expect(host.style.getPropertyValue('display')).toBe('none');

    stub.fireStorageChanged({ showOriginal: { newValue: false, oldValue: true } });
    for (let i = 0; i < 4; i++) await new Promise<void>((r) => queueMicrotask(r));
    expect(host.style.getPropertyValue('display')).toBe('block');
  });

  it('starts hidden when showOriginal is already true in storage', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    stub.storage['showOriginal'] = true;
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host?.style.getPropertyValue('display')).toBe('none');
    // And document scroll NOT locked since overlay was never visible.
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('content script — escape hatch (v0.1.1 extensionEnabled)', () => {
  it('hides the host when extensionEnabled flips to false', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host?.style.getPropertyValue('display')).toBe('block');

    stub.fireStorageChanged({ extensionEnabled: { newValue: false, oldValue: true } });
    for (let i = 0; i < 4; i++) await new Promise<void>((r) => queueMicrotask(r));
    expect(host?.style.getPropertyValue('display')).toBe('none');
  });

  it('starts hidden when extensionEnabled is already false', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    stub.storage['extensionEnabled'] = false;
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host?.style.getPropertyValue('display')).toBe('none');
  });

  it('treats unset extensionEnabled as true (premium first-run default)', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    // No `extensionEnabled` set.
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host?.style.getPropertyValue('display')).toBe('block');
  });
});

describe('content script — persona switching', () => {
  it('re-renders without recreating the shadow host on persona change', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    const hostBefore = document.getElementById('onegov-root');
    expect(hostBefore).not.toBeNull();

    stub.fireStorageChanged({
      persona: { newValue: 'pensioner', oldValue: 'standard' },
    });
    const hostAfter = document.getElementById('onegov-root');
    expect(hostAfter).toBe(hostBefore);
  });

  it('ignores persona changes from non-local areas', async () => {
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    const hostsBefore = document.querySelectorAll('#onegov-root').length;
    stub.fireStorageChanged(
      { persona: { newValue: 'pensioner', oldValue: 'standard' } },
      'sync',
    );
    expect(document.querySelectorAll('#onegov-root').length).toBe(hostsBefore);
  });
});

describe('content script — sparse extraction guard (v0.1.1)', () => {
  it('still mounts the overlay when extraction yields zero nodes', async () => {
    // No <h1> in the page → the heading rule extracts nothing → tree.nodes
    // ends up shorter than 3 → the persona layout falls back to the
    // diagnostic banner. The overlay still mounts.
    document.body.innerHTML = '<div>page without an h1</div>';
    stub = installChromeContentStub(
      makeResponder([
        { type: 'get-status:reply', status: VERIFIED_STATUS },
        { type: 'load-pack:reply', pack: SAMPLE_PACK },
      ]),
    );
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host).not.toBeNull();
    expect(host?.style.getPropertyValue('display')).toBe('block');
  });
});
