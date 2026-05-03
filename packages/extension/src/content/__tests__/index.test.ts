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
  document.head.innerHTML = '';
  document.body.innerHTML = '<header id="old">old anaf chrome</header><main><h1>Bun venit pe ANAF</h1></main>';
  setUrl('https://www.anaf.ro/anaf/internet/ANAF/');
});

afterEach(() => {
  uninstallChromeContentStub();
  document.head.innerHTML = '';
  document.body.innerHTML = '';
});

function setUrl(url: string): void {
  const w = window as unknown as { happyDOM?: { setURL: (u: string) => void } };
  w.happyDOM?.setURL(url);
}

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
  for (let i = 0; i < 10; i++) await new Promise<void>((r) => queueMicrotask(r));
}

describe('content script v0.3 dispatch', () => {
  it('does nothing on unsupported domains', async () => {
    setUrl('https://example.test/');
    stub = installChromeContentStub(() => undefined);
    const before = document.documentElement.outerHTML;
    await runContentScript();
    expect(document.documentElement.outerHTML).toBe(before);
    expect(stub.messages).toHaveLength(0);
  });

  it('does nothing when the verified-domain check fails', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: { kind: 'unknown' } }]),
    );
    await runContentScript();
    expect(document.querySelector('#onegov-bar-root')).toBeNull();
    expect(document.querySelector('#onegov-app')).toBeNull();
    expect(document.querySelector('#old')).not.toBeNull();
  });

  it('replaces the body with a normal DOM bar and app when active', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();

    const bar = document.querySelector('#onegov-bar-root');
    const app = document.querySelector('#onegov-app');
    expect(bar).not.toBeNull();
    expect(app).not.toBeNull();
    expect(document.body.firstElementChild).toBe(bar);
    expect(document.body.children[1]).toBe(app);
    expect((bar as HTMLElement).shadowRoot).toBeNull();
    expect((app as HTMLElement).shadowRoot).toBeNull();
    expect(document.querySelector('#old')).toBeNull();
    expect(document.body.textContent).toContain('Agenția Națională de Administrare Fiscală');
  });

  it('keeps the full-width activation bar while restoring the original body', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();

    stub.fireStorageChanged({ extensionEnabled: { newValue: false, oldValue: true } });
    for (let i = 0; i < 6; i++) await new Promise<void>((r) => queueMicrotask(r));

    const bar = document.querySelector('#onegov-bar-root');
    expect(document.body.firstElementChild).toBe(bar);
    expect(document.querySelector('#old')).not.toBeNull();
    expect(document.querySelector('#onegov-app')).toBeNull();
    expect(document.body.textContent).toContain('Activează interfața ONEGOV');
  });

  it('reactivates the app from the same storage switch', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    stub.fireStorageChanged({ extensionEnabled: { newValue: false, oldValue: true } });
    for (let i = 0; i < 4; i++) await new Promise<void>((r) => queueMicrotask(r));
    stub.fireStorageChanged({ extensionEnabled: { newValue: true, oldValue: false } });
    for (let i = 0; i < 4; i++) await new Promise<void>((r) => queueMicrotask(r));

    expect(document.querySelector('#onegov-app')).not.toBeNull();
    expect(document.querySelector('#old')).toBeNull();
  });

  it('updates density without remounting a shadow host', async () => {
    stub = installChromeContentStub(
      makeResponder([{ type: 'get-status:reply', status: VERIFIED_STATUS }]),
    );
    await runContentScript();
    const app = document.querySelector('#onegov-app');
    expect(app?.getAttribute('data-density')).toBe('simplu');

    stub.fireStorageChanged({ uiDensity: { newValue: 'bogat', oldValue: 'simplu' } });
    for (let i = 0; i < 6; i++) await new Promise<void>((r) => queueMicrotask(r));

    expect(document.querySelector('#onegov-app')).toBe(app);
    expect(app?.getAttribute('data-density')).toBe('bogat');
    expect(document.body.textContent).toContain('Formulare și declarații');
  });
});
