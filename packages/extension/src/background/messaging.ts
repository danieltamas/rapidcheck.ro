/**
 * Background SW — message handler. Path C exposes only `get-status`: the popup
 * asks for the active tab's domain classification + hostname so it can render
 * the correct status pill. The master toggle is storage-driven (the content
 * script subscribes); the SW does not need a `toggle-original` round-trip.
 */

import { MERKLE_ROOT } from '@rapidcheck/core';
import type { DomainStatus, VerifiedDomainList } from '@rapidcheck/core';
import { verifyDomain } from '@rapidcheck/core';
import {
  entitySummaryForDomainInDirectory,
  loadDirectory,
  searchEntitiesInDirectory,
  type VerifiedDirectory,
} from '@rapidcheck/directory';

import type {
  GetDirectoryIntegrityReply,
  GetStatusReply,
  Reply,
  Request,
  SearchEntitiesReply,
} from '../messages.js';

export interface MessageContext {
  roster: VerifiedDomainList;
  directory: VerifiedDirectory;
  integrity: Omit<GetDirectoryIntegrityReply, 'type'>;
}

type MessageContextProvider = () => MessageContext | Promise<MessageContext>;

function statusForUrl(url: string | undefined, roster: VerifiedDomainList): DomainStatus | null {
  if (!url) return null;
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return null;
  }
  if (hostname.length === 0) return null;
  return verifyDomain(hostname, roster);
}

function hostnameForUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const h = new URL(url).hostname;
    return h.length > 0 ? h : null;
  } catch {
    return null;
  }
}

async function resolveActiveUrl(explicit: string | undefined): Promise<string | undefined> {
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab?.url ?? undefined;
  } catch {
    return undefined;
  }
}

export async function handleRequest(
  req: Request,
  roster: VerifiedDomainList,
  directory: VerifiedDirectory = loadDirectory(),
  integrity: Omit<GetDirectoryIntegrityReply, 'type'> = {
    source: 'bundled',
    bundledMerkleRoot: MERKLE_ROOT,
    activeMerkleRoot: MERKLE_ROOT,
    updatedAt: directory.updatedAt,
  },
): Promise<Reply> {
  switch (req.type) {
    case 'get-status': {
      const url = await resolveActiveUrl(req.url);
      const status = statusForUrl(url, roster);
      const hostname = hostnameForUrl(url);
      const entity = hostname ? entitySummaryForDomainInDirectory(directory, hostname) : null;
      const reply: GetStatusReply = { type: 'get-status:reply', status, hostname, entity };
      return reply;
    }
    case 'search-entities': {
      const reply: SearchEntitiesReply = {
        type: 'search-entities:reply',
        results: searchEntitiesInDirectory(directory, req.query, req.limit ?? 5),
      };
      return reply;
    }
    case 'get-directory-integrity':
      return { type: 'get-directory-integrity:reply', ...integrity };
  }
}

function fallbackReply(reqType: Request['type']): Reply {
  if (reqType === 'search-entities') return { type: 'search-entities:reply', results: [] };
  return { type: 'get-status:reply', status: null, hostname: null, entity: null };
}

export function registerMessageHandlers(contextProvider: MessageContextProvider): void {
  chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
    if (!isRequest(raw)) return false;
    Promise.resolve(contextProvider())
      .then((context) => handleRequest(raw, context.roster, context.directory, context.integrity))
      .then((reply) => sendResponse(reply))
      .catch(() => sendResponse(fallbackReply(raw.type)));
    return true;
  });
}

function isRequest(value: unknown): value is Request {
  if (typeof value !== 'object' || value === null) return false;
  const t = (value as { type?: unknown }).type;
  return t === 'get-status' || t === 'search-entities' || t === 'get-directory-integrity';
}
