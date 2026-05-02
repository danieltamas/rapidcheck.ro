/**
 * Background service worker — per-tab icon state machine.
 *
 * Wires three Chrome event sources into the pure `decideIcon()` helper, then
 * paints the resulting colour onto the browser action icon for the affected
 * tab. The SW is the only `chrome.*` consumer in this slice; all decision
 * logic lives in the sibling `decide-icon.ts` module so it can be unit-tested
 * without mocking the WebExtension API.
 *
 * Event wiring:
 *   - `webNavigation.onCommitted` (top frame only) — the canonical hook for
 *     "the user committed to a new page". Fires once per real navigation,
 *     after redirects resolve, with the final URL in `details.url`. Subframe
 *     events are ignored: they don't change which site owns the tab.
 *   - `tabs.onActivated`           — the user switched to a tab the SW has
 *     not painted since its last restart (service workers idle out and lose
 *     in-memory icon state, but `setIcon` is per-tab and persists across SW
 *     wake/sleep). We re-derive the colour from the tab's current URL.
 *   - `runtime.onInstalled`        — first-install / update fires on every
 *     existing open tab so the user sees correct colours immediately, not
 *     after the next navigation.
 *
 * No polling. No `setInterval`. No `setTimeout`. The worker idles between
 * events. No network requests beyond the bundled JSON roster (statically
 * imported, ships inside `background.js` — no runtime fetch).
 *
 * The roster is loaded via Vite's native JSON import. It deliberately keeps
 * the SW startup synchronous: no `await` between event registration and the
 * worker becoming idle. Validation against the Zod schema lives in the rule-
 * pack-loader module; here we trust the bundled file because we shipped it.
 */

import type { VerifiedDomainList } from '@onegov/core';

import { decideIcon, iconPath, type IconColor } from './decide-icon.js';
import verifiedList from '../../../../rule-packs/_verified-domains.json';

// The JSON import is typed as `unknown` to keep the cast explicit. The
// shape is guaranteed by the bundled file + validation in the rule-pack
// loader; if it ever drifts, the verifier itself returns `unknown` for
// every input rather than throwing.
const ROSTER = verifiedList as unknown as VerifiedDomainList;

/**
 * Apply the per-tab icon for `tabId` based on `url`. No-op on falsy URL —
 * `chrome.tabs.get` may resolve to a tab without a URL (e.g. the New Tab
 * page in a fresh window) and we'd rather skip than paint gray-then-correct.
 */
function applyIconForUrl(tabId: number, url: string | undefined): void {
  if (!url) return;
  const color: IconColor = decideIcon(url, ROSTER);
  // setIcon returns a Promise in MV3; we don't await — failure here is non-
  // fatal (the tab may have closed mid-flight). Catch silently to keep the
  // SW from logging unhandled-rejection noise on tab churn.
  void chrome.action.setIcon({ tabId, path: iconPath(color) }).catch(() => {});
}

// 1. Real navigations.
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return; // only top frame
  applyIconForUrl(details.tabId, details.url);
});

// 2. Tab switches — re-paint the now-active tab in case the SW was idle
// when its previous navigation committed.
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs
    .get(tabId)
    .then((tab) => applyIconForUrl(tabId, tab.url))
    .catch(() => {
      // Tab may have closed before the get resolves; nothing to paint.
    });
});

// 3. Install / update — paint every open tab once so existing windows
// reflect verified status without requiring a navigation.
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs
    .query({})
    .then((tabs) => {
      for (const tab of tabs) {
        if (typeof tab.id === 'number') applyIconForUrl(tab.id, tab.url);
      }
    })
    .catch(() => {
      // No `tabs` permission would land us here; we currently use only the
      // narrow `Tab.url`/`Tab.id` fields that work without it. If a future
      // permission tightening removes `tabs.query` access, the install pass
      // becomes a no-op — navigation events will still paint correctly.
    });
});

export {};
