import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';

import { verifyDomain, type DomainStatus } from '@rapidcheck/core';
import verifiedList from '../../../../../rule-packs/_verified-domains.json';
import { setupDom } from '../../__tests__/setup-dom.js';

setupDom();

interface ChromeStub {
  storage: Record<string, unknown>;
}

const stub: ChromeStub = { storage: {} };
const originalConfirm = window.confirm;

beforeAll(() => {
  (globalThis as unknown as { chrome: unknown }).chrome = {
    runtime: {
      sendMessage(req: { type: string; url?: string }) {
        let status: DomainStatus | null = null;
        let hostname: string | null = null;
        try {
          hostname = req.url ? new URL(req.url).hostname : null;
          status = hostname
            ? verifyDomain(hostname, verifiedList as Parameters<typeof verifyDomain>[1])
            : null;
        } catch {
          status = null;
          hostname = null;
        }
        return Promise.resolve({ type: 'get-status:reply', status, hostname });
      },
    },
    storage: {
      local: {
        get(keys: string | string[]) {
          const wanted = typeof keys === 'string' ? [keys] : keys;
          const out: Record<string, unknown> = {};
          for (const k of wanted) if (k in stub.storage) out[k] = stub.storage[k];
          return Promise.resolve(out);
        },
        set(values: Record<string, unknown>) {
          Object.assign(stub.storage, values);
          return Promise.resolve();
        },
      },
    },
  };
});

afterAll(() => {
  delete (globalThis as Partial<{ chrome: unknown }>).chrome;
  window.confirm = originalConfirm;
});

beforeEach(() => {
  stub.storage = {};
  sessionStorage.clear();
  document.getElementById('rapidcheck-trust-warning')?.remove();
  document.head.innerHTML = '';
  document.body.innerHTML = '<main><form id="f"><input name="cnp" value="1960529460012" /></form></main>';
  window.confirm = originalConfirm;
});

async function loadFor(url: string): Promise<void> {
  (window as unknown as { happyDOM: { setURL: (next: string) => void } }).happyDOM.setURL(url);
  await import(`../index.ts?case=${encodeURIComponent(url)}-${Date.now()}`);
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

describe('content trust layer', () => {
  it('blocks sensitive form submit on unknown domains when the user refuses', async () => {
    await loadFor('https://example.test/');
    let prompted = false;
    window.confirm = () => {
      prompted = true;
      return false;
    };
    const form = document.getElementById('f') as HTMLFormElement | null;
    expect(form).not.toBeNull();
    if (!form) return;
    form.action = 'https://evil.test/submit';
    const event = new Event('submit', { bubbles: true, cancelable: true });
    const allowed = form.dispatchEvent(event);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(prompted).toBe(true);
    expect(allowed).toBe(false);
  });

  it('shows a blocking warning on lookalike domains', async () => {
    await loadFor('https://anaf.com/');
    const warning = document.getElementById('rapidcheck-trust-warning');
    expect(warning).not.toBeNull();
    expect(warning?.textContent).toContain('anaf.ro');
  });

  it('does not alter verified pages by default', async () => {
    await loadFor('https://anaf.ro/');
    expect(document.getElementById('rapidcheck-trust-warning')).toBeNull();
    expect(document.getElementById('f')).not.toBeNull();
  });

  it('skips all guards when protection is disabled', async () => {
    stub.storage['protectionEnabled'] = false;
    await loadFor('https://anaf.com/');
    expect(document.getElementById('rapidcheck-trust-warning')).toBeNull();
  });
});
