/**
 * Background SW message handlers.
 *
 * Splits the cross-context message routing out of `index.ts` so the icon
 * state machine (Track 4a) and the rule-pack/verifier glue (Track 4b) can be
 * unit-tested independently. The handlers cover the two operations the
 * content script and popup need from the SW:
 *
 *   - `get-status` — reuse the same `verifyDomain` the icon machine uses, so
 *     content + popup never bundle psl + idna-uts46-hx (~105 KB gz).
 *   - `load-pack` — fetch a bundled rule-pack JSON via
 *     `chrome.runtime.getURL` (the only allowed network op per Invariant #4)
 *     and validate it through the Zod schema. The content script never sees
 *     Zod or the loader; it consumes the validated `RulePack` directly.
 *
 * Why centralise here:
 *   1. Bundle size — content.js stays under the 80 KB cap.
 *   2. Trust boundary — the SW is the only thing that touches
 *      `chrome.runtime.getURL` for rule packs; content script never gets a
 *      handle that could be repurposed for arbitrary URLs.
 *   3. Re-validation — every load goes through `loadBundled`, so a corrupt
 *      bundled pack surfaces with a Zod error in the SW (loud), not silently
 *      via stale renderings in the page.
 *
 * Hard rules carried over from CLAUDE.md:
 *   - No `eval`, no `Function`, no `innerHTML`. Validator is declarative Zod.
 *   - No external network. Only `chrome.runtime.getURL` paths.
 *   - Listener returns `true` whenever it answers asynchronously, per
 *     Chrome's MV3 contract for `runtime.onMessage`.
 */

import { loadBundled } from '@onegov/core';
import type { DomainStatus, RulePack, VerifiedDomainList } from '@onegov/core';

import { verifyDomain } from '../../../core/src/domain-verifier.js';

import type { GetStatusReply, LoadPackReply, Reply, Request } from '../messages.js';

/**
 * Resolve a URL to a `DomainStatus` using the SW's own roster. Identical to
 * the icon state machine's classification path so the popup/content overlay
 * and the toolbar icon never disagree.
 */
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

/**
 * Build the JSON fetcher `loadBundled` requires. The SW is the only context
 * that calls this with `chrome.runtime.getURL` so the path stays a bundled
 * extension-origin URL (Invariant #4).
 */
function makeFetcher(): (path: string) => Promise<unknown> {
  return async (path) => {
    const res = await fetch(chrome.runtime.getURL(path));
    if (!res.ok) throw new Error(`pack fetch failed: ${String(res.status)}`);
    return res.json();
  };
}

/**
 * Resolve the URL the popup is asking about. Order:
 *   1. Caller-supplied `url` (content script always passes its own URL).
 *   2. Active tab in the focused window (popup convenience path).
 */
async function resolveActiveUrl(explicit: string | undefined): Promise<string | undefined> {
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    return tab?.url ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Handle a single request and produce its typed reply. Pure-ish — the only
 * side effects are the `chrome.runtime.getURL` fetch (for `load-pack`) and
 * `chrome.tabs.query` (for `get-status` without an explicit URL).
 *
 * Errors never leak to the caller as rejections — replies always come back
 * shaped per the contract with a `null` payload on failure.
 */
export async function handleRequest(req: Request, roster: VerifiedDomainList): Promise<Reply> {
  switch (req.type) {
    case 'get-status': {
      const url = await resolveActiveUrl(req.url);
      const status = statusForUrl(url, roster);
      const reply: GetStatusReply = { type: 'get-status:reply', status };
      return reply;
    }
    case 'load-pack': {
      let pack: RulePack | null = null;
      try {
        pack = await loadBundled(req.domain, makeFetcher());
      } catch {
        // Validation error or unexpected throw → null. The SW logs nothing
        // (no telemetry) and the content script renders nothing.
        pack = null;
      }
      const reply: LoadPackReply = { type: 'load-pack:reply', pack };
      return reply;
    }
  }
}

/**
 * Wire the handler into `chrome.runtime.onMessage`. Returns `true` from the
 * listener so Chrome keeps the response channel open across the async
 * `handleRequest` call (per MV3 contract).
 */
export function registerMessageHandlers(roster: VerifiedDomainList): void {
  chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
    if (!isRequest(raw)) return false;
    handleRequest(raw, roster)
      .then((reply) => sendResponse(reply))
      .catch(() => {
        // Should never happen — handleRequest swallows internally — but if
        // something throws we must still close the channel cleanly so the
        // sender's promise resolves. Reply with the matching null shape.
        const fallback: Reply =
          raw.type === 'load-pack'
            ? { type: 'load-pack:reply', pack: null }
            : { type: 'get-status:reply', status: null };
        sendResponse(fallback);
      });
    return true;
  });
}

/**
 * Type guard for incoming messages. Discards anything that doesn't look like
 * one of the two known request shapes. Defensive against page-script abuse if
 * a hostile site somehow gets `chrome.runtime` access (it shouldn't, but).
 */
function isRequest(value: unknown): value is Request {
  if (typeof value !== 'object' || value === null) return false;
  const t = (value as { type?: unknown }).type;
  if (t === 'get-status') return true;
  if (t === 'load-pack') {
    const d = (value as { domain?: unknown }).domain;
    return typeof d === 'string' && d.length > 0;
  }
  return false;
}
