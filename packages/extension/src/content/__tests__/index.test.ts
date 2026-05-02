/**
 * Content-script lifecycle tests (v0.2 dispatch architecture).
 *
 * The script is an IIFE — its main work runs as a side effect of module
 * import. To test it without forking a real browser context we:
 *   1. Install a chrome stub onto globalThis (sendMessage / storage)
 *   2. Set up happy-dom so `document` exists
 *   3. Re-import the module fresh per test so each lifecycle re-runs
 *
 * v0.2 contract under test:
 *   - Off-domain (no site module matches) → exits cleanly. No loader injected,
 *     no shadow host appended, original DOM untouched.
 *   - anaf.ro (verified) → loader injected, shadow host appended with the
 *     full-viewport overlay styles, anaf App rendered inside the closed
 *     shadow root, document scroll locked.
 *   - anaf.ro (status not verified) → loader is shown briefly then aborted,
 *     no shadow host, original DOM untouched.
 *   - extensionEnabled / showOriginal toggle via storage.onChanged → flips
 *     host display + restores documentElement scroll + removes/restores the
 *     hide-original style.
 *   - uiDensity change via storage.onChanged → re-renders inside the same
 *     shadow root, host data-density attribute updated.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';

import type { DomainStatus } from '@onegov/core';

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

beforeAll(() => {
  setupDom();
});

let stub: ChromeContentStub;

beforeEach(() => {
  document.body.innerHTML = '<header>old anaf chrome</header><main><h1>Bun venit pe ANAF</h1></main>';
  document.documentElement.style.overflow = '';
  // Default tests run on anaf.ro so the dispatcher matches. happy-dom
  // forbids cross-origin pushState, so use the dedicated test API.
  setUrl('https://www.anaf.ro/anaf/internet/ANAF/');
});

/**
 * Switch the happy-dom Window to a synthetic URL. Using the documented
 * `window.happyDOM.setURL()` API instead of pushState avoids the
 * cross-origin SecurityError happy-dom raises when navigating between
 * origins via History API.
 */
function setUrl(url: string): void {
  const w = window as unknown as {
    happyDOM?: { setURL: (u: string) => void };
  };
  if (w.happyDOM && typeof w.happyDOM.setURL === 'function') {
    w.happyDOM.setURL(url);
  }
}

afterEach(() => {
  uninstallChromeContentStub();
  // Remove anything our content script may have appended.
  for (const id of ['onegov-root', 'onegov-loader', 'onegov-hide-original']) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
  document.body.innerHTML = '';
  document.documentElement.style.overflow = '';
});

function makeResponder(replies: Reply[]): (req: Request) => Reply | undefined {
  return (req) => {
    const reply = replies.shift();
    if (!reply) return undefined;
    if (req.type === 'get-status' && reply.type !== 'get-status:reply') return undefined;
    return reply;
  };
}

async function runContentScript(): Promise<void> {
  const bust = String(Date.now()) + String(Math.random());
  await import(`../index.js?bust=${bust}`);
  // Microtasks for the get-status + render chain to resolve.
  for (let i = 0; i < 8; i++) {
    await new Promise<void>((r) => queueMicrotask(r));
  }
  // One macrotask tick so the loader-hold setTimeout(0) resolves cleanly.
  await new Promise<void>((r) => setTimeout(r, 10));
}

describe('content script — off-domain dispatch', () => {
  it('does not inject loader or shadow host on a non-anaf URL', async () => {
    setUrl('https://www.example.test/some-page');
    stub = installChromeContentStub(() => undefined);
    const before = document.documentElement.outerHTML;
    await runContentScript();
    expect(document.querySelector('#onegov-root')).toBeNull();
    expect(document.querySelector('#onegov-loader')).toBeNull();
    expect(document.querySelector('#onegov-hide-original')).toBeNull();
    expect(document.documentElement.outerHTML).toBe(before);
    // Dispatcher exits before sending get-status.
    expect(stub.messages.length).toBe(0);
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('content script — exits cleanly when status is unknown', () => {
  it('aborts the loader and does not append a shadow host', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: { kind: 'unknown' } }]),
    );
    await runContentScript();
    expect(document.querySelector('#onegov-root')).toBeNull();
    // Loader gets aborted on non-verified status, so it's removed too.
    expect(document.querySelector('#onegov-loader')).toBeNull();
    // Hide-original style removed by abort() so original page is restored.
    expect(document.querySelector('#onegov-hide-original')).toBeNull();
    expect(stub.messages).toHaveLength(1);
    expect(stub.messages[0]?.type).toBe('get-status');
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('content script — exits cleanly on lookalike', () => {
  it('does not append a shadow host', async () => {
    const lookalikeStatus: DomainStatus = {
      kind: 'lookalike',
      nearest: { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
      distance: 1,
      reason: 'levenshtein',
    };
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: lookalikeStatus }]),
    );
    await runContentScript();
    expect(document.querySelector('#onegov-root')).toBeNull();
  });
});

describe('content script — exits cleanly when SW unreachable', () => {
  it('does not append a shadow host on null reply', async () => {
    stub = installChromeContentStub(() => undefined);
    await runContentScript();
    expect(document.querySelector('#onegov-root')).toBeNull();
  });
});

describe('content script — happy path', () => {
  it('appends a closed shadow host and mounts the App tree', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
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
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    expect(stub.storageListenerCount()).toBe(1);
  });

  it('does NOT mutate any pre-existing element of the page', async () => {
    document.body.innerHTML = '<h1 id="page">Bun venit pe ANAF</h1>';
    const beforeH1 = document.getElementById('page')?.outerHTML;
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    const afterH1 = document.getElementById('page')?.outerHTML;
    expect(afterH1).toBe(beforeH1);
  });
});

describe('content script — full-viewport overlay', () => {
  it('applies position:fixed inset:0 z-index max isolation:isolate', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host).not.toBeNull();
    if (!host) return;
    expect(host.style.getPropertyValue('position')).toBe('fixed');
    expect(host.style.getPropertyPriority('position')).toBe('important');
    expect(host.style.getPropertyValue('inset')).toBe('0');
    expect(host.style.getPropertyValue('z-index')).toBe('2147483647');
    expect(host.style.getPropertyValue('isolation')).toBe('isolate');
  });

  it('uses an opaque background so the page is visually replaced', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
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
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('restores documentElement.style.overflow when overlay is hidden', async () => {
    document.documentElement.style.overflow = 'auto';
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    expect(document.documentElement.style.overflow).toBe('hidden');

    stub.fireStorageChanged({
      extensionEnabled: { newValue: false, oldValue: true },
    });
    for (let i = 0; i < 4; i++) await new Promise<void>((r) => queueMicrotask(r));
    expect(document.documentElement.style.overflow).toBe('auto');
  });
});

describe('content script — escape hatch (legacy showOriginal)', () => {
  it('hides the host when showOriginal flips to true', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host).not.toBeNull();
    if (!host) return;
    expect(host.style.getPropertyValue('display')).toBe('block');

    stub.fireStorageChanged({ showOriginal: { newValue: true, oldValue: false } });
    for (let i = 0; i < 4; i++) await new Promise<void>((r) => queueMicrotask(r));
    expect(host.style.getPropertyValue('display')).toBe('none');
    // Hide-original style should also have been removed → original page visible.
    expect(document.querySelector('#onegov-hide-original')).toBeNull();

    stub.fireStorageChanged({ showOriginal: { newValue: false, oldValue: true } });
    for (let i = 0; i < 4; i++) await new Promise<void>((r) => queueMicrotask(r));
    expect(host.style.getPropertyValue('display')).toBe('block');
    // Re-applied on toggle on.
    expect(document.querySelector('#onegov-hide-original')).not.toBeNull();
  });

  it('starts hidden when showOriginal is already true in storage', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    stub.storage['showOriginal'] = true;
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host?.style.getPropertyValue('display')).toBe('none');
    expect(document.documentElement.style.overflow).toBe('');
  });
});

describe('content script — escape hatch (extensionEnabled)', () => {
  it('hides the host when extensionEnabled flips to false', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
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
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    stub.storage['extensionEnabled'] = false;
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host?.style.getPropertyValue('display')).toBe('none');
  });

  it('treats unset extensionEnabled as true (default)', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    const host = document.getElementById('onegov-root') as HTMLDivElement | null;
    expect(host?.style.getPropertyValue('display')).toBe('block');
  });
});

describe('content script — density preference (replaces persona)', () => {
  it('writes data-density="simplu" by default on the host', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    const host = document.getElementById('onegov-root');
    expect(host?.getAttribute('data-density')).toBe('simplu');
  });

  it('honors stored uiDensity at mount', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    stub.storage['uiDensity'] = 'bogat';
    await runContentScript();
    const host = document.getElementById('onegov-root');
    expect(host?.getAttribute('data-density')).toBe('bogat');
  });

  it('updates data-density when storage changes', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    const hostBefore = document.getElementById('onegov-root');
    expect(hostBefore?.getAttribute('data-density')).toBe('simplu');

    stub.fireStorageChanged({ uiDensity: { newValue: 'minimal', oldValue: 'simplu' } });
    for (let i = 0; i < 4; i++) await new Promise<void>((r) => queueMicrotask(r));
    const hostAfter = document.getElementById('onegov-root');
    expect(hostAfter).toBe(hostBefore);
    expect(hostAfter?.getAttribute('data-density')).toBe('minimal');
  });

  it('ignores changes from non-local areas', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    const hostsBefore = document.querySelectorAll('#onegov-root').length;
    stub.fireStorageChanged({ uiDensity: { newValue: 'bogat', oldValue: 'simplu' } }, 'sync');
    expect(document.querySelectorAll('#onegov-root').length).toBe(hostsBefore);
  });
});
