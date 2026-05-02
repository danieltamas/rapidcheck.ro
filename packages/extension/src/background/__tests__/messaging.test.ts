/**
 * Background SW message-handler tests (Track 4b extension).
 *
 * Exercises `handleRequest` directly so we don't depend on
 * `chrome.runtime.onMessage` plumbing here — that's covered by the existing
 * background SW listener-wiring suite in `index.test.ts`. We do install a
 * minimal `chrome.*` stub so `chrome.runtime.getURL` (called inside the
 * `loadBundled` fetcher) and `chrome.tabs.query` (called by
 * `resolveActiveUrl`) resolve.
 *
 * Coverage:
 *   - get-status with explicit URL → maps to verified / lookalike / unknown
 *   - get-status without URL falls back to the active tab
 *   - get-status with malformed URL → status null
 *   - load-pack returns the validated pack on success
 *   - load-pack returns null on fetch error
 *   - load-pack returns null on validation error (silently swallowed by handler)
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';

import type { VerifiedDomainList } from '@onegov/core';

import type { GetStatusReply, LoadPackReply, Request } from '../../messages.js';
import { handleRequest } from '../messaging.js';

const ROSTER: VerifiedDomainList = {
  version: '0.1.0-test',
  updatedAt: '2026-05-02',
  domains: [
    { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-02', source: 'https://anaf.ro' },
  ],
};

const VALID_PACK_JSON = {
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

interface FetchControl {
  ok: boolean;
  body: unknown;
  throws?: boolean;
}

const fetchControl: { current: FetchControl } = {
  current: { ok: true, body: VALID_PACK_JSON },
};

interface ChromeStub {
  activeTabUrl: string | undefined;
}

const chromeState: ChromeStub = { activeTabUrl: undefined };

beforeAll(() => {
  // Stub global fetch to read from `fetchControl`.
  const originalFetch = globalThis.fetch;
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async (
    _input: unknown,
  ): Promise<Response> => {
    if (fetchControl.current.throws) throw new Error('network down');
    if (!fetchControl.current.ok) {
      return new Response('not found', { status: 404 });
    }
    return new Response(JSON.stringify(fetchControl.current.body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  // Cleanup hook stashed on globalThis so afterAll can restore.
  (globalThis as unknown as { __originalFetch: typeof fetch }).__originalFetch = originalFetch;

  const chromeImpl = {
    runtime: {
      getURL(path: string): string {
        return `chrome-extension://test/${path}`;
      },
    },
    tabs: {
      query(_filter: Record<string, unknown>): Promise<Array<{ url?: string }>> {
        if (chromeState.activeTabUrl === undefined) return Promise.resolve([]);
        return Promise.resolve([{ url: chromeState.activeTabUrl }]);
      },
    },
  };
  (globalThis as unknown as { chrome: typeof chromeImpl }).chrome = chromeImpl;
});

afterAll(() => {
  delete (globalThis as Partial<{ chrome: unknown }>).chrome;
  const original = (globalThis as { __originalFetch?: typeof fetch }).__originalFetch;
  if (original) {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = original;
  }
});

beforeEach(() => {
  fetchControl.current = { ok: true, body: VALID_PACK_JSON };
  chromeState.activeTabUrl = undefined;
});

describe('handleRequest — get-status', () => {
  it('returns verified for a known domain', async () => {
    const req: Request = { type: 'get-status', url: 'https://anaf.ro/' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.type).toBe('get-status:reply');
    expect(reply.status?.kind).toBe('verified');
  });

  it('returns lookalike for a confusable host', async () => {
    const req: Request = { type: 'get-status', url: 'https://anaf-portal.ro/' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.status?.kind).toBe('lookalike');
  });

  it('returns unknown for an off-list host', async () => {
    const req: Request = { type: 'get-status', url: 'https://google.com/' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.status?.kind).toBe('unknown');
  });

  it('returns null status when URL is unparseable', async () => {
    const req: Request = { type: 'get-status', url: 'not a url' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.status).toBeNull();
  });

  it('falls back to active tab URL when caller omits url', async () => {
    chromeState.activeTabUrl = 'https://anaf.ro/';
    const req: Request = { type: 'get-status' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.status?.kind).toBe('verified');
  });

  it('returns null when no active tab and no url', async () => {
    chromeState.activeTabUrl = undefined;
    const req: Request = { type: 'get-status' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.status).toBeNull();
  });
});

describe('handleRequest — load-pack', () => {
  it('returns the validated pack on success', async () => {
    const req: Request = { type: 'load-pack', domain: 'anaf.ro' };
    const reply = (await handleRequest(req, ROSTER)) as LoadPackReply;
    expect(reply.type).toBe('load-pack:reply');
    expect(reply.pack?.domain).toBe('anaf.ro');
    expect(reply.pack?.routes).toHaveLength(1);
  });

  it('returns null when fetch fails (404)', async () => {
    fetchControl.current = { ok: false, body: null };
    const req: Request = { type: 'load-pack', domain: 'anaf.ro' };
    const reply = (await handleRequest(req, ROSTER)) as LoadPackReply;
    expect(reply.pack).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    fetchControl.current = { ok: true, body: null, throws: true };
    const req: Request = { type: 'load-pack', domain: 'anaf.ro' };
    const reply = (await handleRequest(req, ROSTER)) as LoadPackReply;
    expect(reply.pack).toBeNull();
  });

  it('returns null when the bundled JSON is malformed', async () => {
    fetchControl.current = { ok: true, body: { wrong: 'shape' } };
    const req: Request = { type: 'load-pack', domain: 'anaf.ro' };
    const reply = (await handleRequest(req, ROSTER)) as LoadPackReply;
    expect(reply.pack).toBeNull();
  });
});
