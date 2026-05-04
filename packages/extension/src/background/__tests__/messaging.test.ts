/**
 * Background SW message-handler tests (Path B).
 *
 * Exercises `handleRequest` directly. The chrome.* surface is stubbed
 * minimally — we only need `chrome.tabs.query` (for `resolveActiveUrl`),
 * `chrome.tabs.get`, and `chrome.scripting.insertCSS/removeCSS`.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test';

import type { VerifiedDomainList } from '@rapidcheck/core';

import type { GetStatusReply, Request } from '../../messages.js';
import { handleRequest } from '../messaging.js';

const ROSTER: VerifiedDomainList = {
  version: '0.1.0-test',
  updatedAt: '2026-05-03',
  domains: [
    { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-03', source: 'https://anaf.ro' },
  ],
};

interface ChromeStub {
  activeTabUrl: string | undefined;
  activeTabId: number | undefined;
}

const chromeState: ChromeStub = {
  activeTabUrl: undefined,
  activeTabId: undefined,
};

beforeAll(() => {
  const chromeImpl = {
    runtime: {
      getURL: (p: string) => `chrome-extension://test/${p}`,
    },
    tabs: {
      query: (_filter: Record<string, unknown>) => {
        if (chromeState.activeTabId === undefined) return Promise.resolve([]);
        return Promise.resolve([{ id: chromeState.activeTabId, url: chromeState.activeTabUrl }]);
      },
    },
  };
  (globalThis as unknown as { chrome: typeof chromeImpl }).chrome = chromeImpl;
});

afterAll(() => {
  delete (globalThis as Partial<{ chrome: unknown }>).chrome;
});

beforeEach(() => {
  chromeState.activeTabUrl = undefined;
  chromeState.activeTabId = undefined;
});

describe('handleRequest — get-status', () => {
  it('returns verified for a known domain', async () => {
    const req: Request = { type: 'get-status', url: 'https://anaf.ro/' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.type).toBe('get-status:reply');
    expect(reply.status?.kind).toBe('verified');
    expect(reply.entity?.shortName).toBe('ANAF');
  });

  it('returns lookalike for a confusable host', async () => {
    const req: Request = { type: 'get-status', url: 'https://anaf-portal.ro/' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.status?.kind).toBe('lookalike');
  });

  it('returns unknown for an off-list host', async () => {
    const req: Request = { type: 'get-status', url: 'https://example.com/' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.status?.kind).toBe('unknown');
    expect(reply.entity).toBeNull();
  });

  it('returns null status when URL is unparseable', async () => {
    const req: Request = { type: 'get-status', url: 'not a url' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.status).toBeNull();
  });

  it('falls back to active tab URL when caller omits url', async () => {
    chromeState.activeTabId = 1;
    chromeState.activeTabUrl = 'https://anaf.ro/';
    const req: Request = { type: 'get-status' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.status?.kind).toBe('verified');
  });

  it('returns null when no active tab and no url', async () => {
    const req: Request = { type: 'get-status' };
    const reply = (await handleRequest(req, ROSTER)) as GetStatusReply;
    expect(reply.status).toBeNull();
  });

  it('searches verified entities from the background worker', async () => {
    const reply = await handleRequest({ type: 'search-entities', query: 'BT', limit: 2 }, ROSTER);
    expect(reply.type).toBe('search-entities:reply');
    if (reply.type !== 'search-entities:reply') return;
    expect(reply.results[0]?.primaryDomain).toBe('bancatransilvania.ro');
  });
});

// Path C dropped toggle-original: master toggle is storage-driven, the
// content script subscribes and reloads. No SW message round-trip needed.
