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
 *     closed shadow root.
 *   - On `unknown` / `lookalike` / null status → no shadow host appended,
 *     `documentElement.outerHTML` stays byte-equal.
 *   - On verified but no matching pack → no shadow host appended.
 *   - Persona switch via `storage.onChanged` → re-renders inside the same
 *     shadow root (no DOM churn).
 *   - showOriginal toggle via `storage.onChanged` → flips host.style.display.
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
  // Reset the document and module cache so each import re-runs the IIFE.
  document.body.innerHTML = '<h1>Bun venit pe ANAF</h1>';
  // Force happy-dom URL to root path so the route matcher finds `^/$`.
  // happy-dom's location is mutable via `window.history.replaceState`.
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  uninstallChromeContentStub();
  document.body.innerHTML = '';
  // Drop the script from the module cache so the next import re-runs the IIFE.
  // Bun's require cache key is the resolved file path; for ESM under bun:test
  // we exploit `Loader.cache` clearing via dynamic import + bust.
  // The simplest portable approach is to use a query-string cache buster on
  // each dynamic import in the test below.
});

function makeResponder(replies: Reply[]): (req: Request) => Reply | undefined {
  return (req) => {
    const reply = replies.shift();
    if (!reply) return undefined;
    // Sanity: keep the reply matched to the request shape so tests fail loud
    // if the script's order changes silently.
    if (req.type === 'get-status' && reply.type !== 'get-status:reply') return undefined;
    if (req.type === 'load-pack' && reply.type !== 'load-pack:reply') return undefined;
    return reply;
  };
}

async function runContentScript(): Promise<void> {
  // Cache-bust query so each call re-evaluates the IIFE.
  const bust = String(Date.now()) + String(Math.random());
  await import(`../index.js?bust=${bust}`);
  // Two microtasks for the get-status + load-pack chain to resolve.
  await new Promise<void>((r) => queueMicrotask(r));
  await new Promise<void>((r) => queueMicrotask(r));
  await new Promise<void>((r) => queueMicrotask(r));
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
    // Sent exactly one message.
    expect(stub.messages).toHaveLength(1);
    expect(stub.messages[0]?.type).toBe('get-status');
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
    // Closed shadow root → `host.shadowRoot` returns null. happy-dom matches
    // this contract.
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

describe('content script — escape hatch', () => {
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
    expect(host.style.display).toBe('');

    stub.fireStorageChanged({
      showOriginal: { newValue: true, oldValue: false },
    });
    expect(host.style.display).toBe('none');

    stub.fireStorageChanged({
      showOriginal: { newValue: false, oldValue: true },
    });
    expect(host.style.display).toBe('');
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
    expect(host?.style.display).toBe('none');
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
    // Same host element survives — persona switch is in-place.
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
      {
        persona: { newValue: 'pensioner', oldValue: 'standard' },
      },
      'sync',
    );
    expect(document.querySelectorAll('#onegov-root').length).toBe(hostsBefore);
  });
});
