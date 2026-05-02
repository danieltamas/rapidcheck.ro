/**
 * Cross-context message contract.
 *
 * Three contexts exchange messages via `chrome.runtime.sendMessage`:
 *
 *   - Content script (per-tab) ↔ Background SW
 *     - `get-status` — content asks SW to classify its current URL via the
 *       same verifier the icon state machine uses, instead of bundling the
 *       verifier + roster into content.js (Track 4a's psl + idna-uts46-hx
 *       transitive deps weigh ~105 KB; far over the 80 KB content budget).
 *     - `load-pack` — content asks SW to fetch + validate the bundled rule
 *       pack JSON for a verified domain. SW owns the Zod validator so the
 *       content bundle stays free of Zod (~10 KB gzipped).
 *
 *   - Popup ↔ Background SW
 *     - `get-status` — popup asks SW for the active tab's status so it can
 *       render the correct status pill colour.
 *
 * Messages are plain JSON-serialisable objects. No functions, no DOM nodes,
 * no class instances cross the boundary. Discriminated by `type`.
 */

import type { DomainStatus, RulePack } from '@onegov/core';

/** Asks background SW to classify a URL. `url` is the page being scored. */
export interface GetStatusRequest {
  type: 'get-status';
  /**
   * The URL whose status the caller wants. Content scripts pass
   * `location.href`; the popup passes the active tab's URL (or omits it and
   * the SW resolves the active tab itself).
   */
  url?: string;
}

/** Reply to `get-status`. */
export interface GetStatusReply {
  type: 'get-status:reply';
  /**
   * `null` when the SW could not resolve a URL (no active tab, internal
   * page like `chrome://`, etc.). Callers render the gray/neutral state.
   */
  status: DomainStatus | null;
}

/** Asks background SW to fetch + validate a bundled rule pack. */
export interface LoadPackRequest {
  type: 'load-pack';
  /** eTLD+1, e.g. `"anaf.ro"`. SW fetches `rule-packs/{domain}.json`. */
  domain: string;
}

/** Reply to `load-pack`. */
export interface LoadPackReply {
  type: 'load-pack:reply';
  /** `null` when the pack is missing or fails validation. */
  pack: RulePack | null;
}

/** Union of every request the background SW understands. */
export type Request = GetStatusRequest | LoadPackRequest;

/** Union of every reply the background SW emits. */
export type Reply = GetStatusReply | LoadPackReply;
