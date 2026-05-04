/**
 * Pure decision function: a URL string + the bundled verified-domain roster
 * collapse to one of three per-tab states. Lives outside the service-worker
 * `chrome.*` glue so it can be unit-tested in plain bun:test without mocking
 * the entire WebExtension API surface.
 *
 * v0.1.1 simplification: the per-tab state used to drive both an icon-color
 * swap (3 PNG variants) AND a toolbar badge. The owner observed that the
 * badge alone carries enough signal — `✓` green for verified, `!` red for
 * lookalike, blank for unknown — so the icon was reduced to a single neutral
 * brand mark. This file is kept (instead of renamed) to preserve the import
 * path other modules and tests already use; the name `decide-icon` is now a
 * misnomer in spirit (it decides the BADGE, not the icon) but renaming would
 * churn 6 import sites for cosmetic gain.
 *
 * Decision flow:
 *   1. Parse the URL via the WHATWG `URL` constructor. Anything `URL` rejects
 *      (about:blank, chrome:// pages, malformed strings, javascript: URLs)
 *      collapses to `unknown` — no badge on browser-internal pages.
 *   2. Hand the hostname to `verifyDomain`. The verifier itself is total and
 *      never throws — see `packages/core/src/domain-verifier.ts`.
 *   3. Map the resulting `DomainStatus.kind` onto the badge style.
 *
 * Hard constraint: this module imports nothing from `chrome.*`. The whole
 * point of extracting it is keeping the SW thin and the decision testable.
 */

// Deep-relative import for the verifier function only — the `@rapidcheck/core`
// barrel re-exports `loadBundled` + `validate` from `rule-pack-loader.ts`,
// which pulls Zod into the SW bundle even though the SW never validates a
// rule pack itself (the content script does that). Skipping the barrel saves
// ~15KB gzipped without weakening any invariant — the verifier is still the
// canonical implementation in `packages/core`. Types come from the barrel
// (free — erased at compile time).
import { verifyDomain } from '../../../core/src/domain-verifier.js';
import type { VerifiedDomainList } from '@rapidcheck/core';

/** The classified state for a single tab — mirrors `DomainStatus['kind']`. */
export type TabState = 'verified' | 'lookalike' | 'unknown';

/**
 * Decide the badge state for a given page URL against the bundled
 * verified-domain roster. Returns `unknown` for any input the URL parser
 * rejects so the SW can call this unconditionally on every navigation event
 * without defensive try/catch.
 */
export function decideTabState(url: string, list: VerifiedDomainList): TabState {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return 'unknown';
  }
  if (hostname.length === 0) return 'unknown';

  const status = verifyDomain(hostname, list);
  switch (status.kind) {
    case 'verified':
      return 'verified';
    case 'lookalike':
      return 'lookalike';
    case 'unknown':
      return 'unknown';
  }
}

/**
 * Visual badge overlaid on the toolbar icon by `chrome.action.setBadgeText`
 * + `setBadgeBackgroundColor`. Reinforces the verified/lookalike/unknown
 * state with a glyph that's legible at toolbar zoom levels and impossible
 * to miss for the lookalike state where attention matters most.
 *
 *   verified  → "✓"  on accessible green
 *   lookalike → "!"  on accessible red    (alarm)
 *   unknown   → ""   (no badge — keeps the toolbar clean on off-list sites)
 *
 * Chrome MV3 `setBadgeText` allows up to 4 chars; we ship a single glyph so
 * Chrome's automatic font scaling never truncates. Badge text colour defaults
 * to white in MV3 across both light and dark themes.
 */
export interface BadgeStyle {
  /** 0–4 chars. Empty string clears the badge. */
  text: string;
  /** Hex string `#RRGGBB`. Ignored when `text === ''`. */
  backgroundColor: string;
}

const BADGE_VERIFIED: BadgeStyle = { text: '\u2713', backgroundColor: '#0F8A4F' }; // ✓
const BADGE_LOOKALIKE: BadgeStyle = { text: '!', backgroundColor: '#C62828' };
const BADGE_NONE: BadgeStyle = { text: '', backgroundColor: '#000000' };

export function badgeStyle(state: TabState): BadgeStyle {
  switch (state) {
    case 'verified':
      return BADGE_VERIFIED;
    case 'lookalike':
      return BADGE_LOOKALIKE;
    case 'unknown':
      return BADGE_NONE;
  }
}

// ─── Backwards-compatibility shims ───────────────────────────────────────
// Other code (and tests) used `IconColor` + `decideIcon` + `iconPath` from
// the v0.1 era when the SW swapped the toolbar icon. We keep these as
// thin shims so existing imports compile, but they no longer drive any
// runtime icon swap — the SW simply doesn't call `chrome.action.setIcon`
// anymore. `iconPath` returns the canonical brand path triple so any
// caller that did call setIcon gets the neutral mark.

export type IconColor = TabState;

/** @deprecated use {@link decideTabState}. Returns the same value. */
export function decideIcon(url: string, list: VerifiedDomainList): IconColor {
  return decideTabState(url, list);
}

/**
 * @deprecated The SW no longer swaps the icon per-tab; the manifest's
 * default brand icon is the only one shown. This returns the canonical
 * brand path triple so any legacy caller that does invoke `setIcon`
 * still paints the correct (neutral) mark.
 */
export function iconPath(_state?: IconColor): Record<number, string> {
  return {
    16: 'icons/rapidcheck-16.png',
    32: 'icons/rapidcheck-32.png',
    48: 'icons/rapidcheck-48.png',
  };
}
