/**
 * Pure decision function: a URL string + the bundled verified-domain roster
 * collapse to one of three icon colours. Lives outside the service-worker
 * `chrome.*` glue so it can be unit-tested in plain bun:test without mocking
 * the entire WebExtension API surface.
 *
 * Decision flow:
 *   1. Parse the URL via the WHATWG `URL` constructor. Anything `URL` rejects
 *      (about:blank, chrome:// pages, malformed strings, javascript: URLs)
 *      collapses to `gray` — the icon stays neutral on browser-internal pages
 *      and we never throw out of a `webNavigation.onCommitted` callback.
 *   2. Hand the hostname to `verifyDomain`. The verifier itself is total and
 *      never throws — see `packages/core/src/domain-verifier.ts`.
 *   3. Map the resulting `DomainStatus.kind` onto the colour name the caller
 *      will splice into the icon path.
 *
 * Hard constraint: this module imports nothing from `chrome.*`. The whole
 * point of extracting it is keeping the SW thin and the decision testable.
 */

// Deep-relative import for the verifier function only — the `@onegov/core`
// barrel re-exports `loadBundled` + `validate` from `rule-pack-loader.ts`,
// which pulls Zod into the SW bundle even though the SW never validates a
// rule pack itself (the content script does that). Skipping the barrel saves
// ~15KB gzipped without weakening any invariant — the verifier is still the
// canonical implementation in `packages/core`. Types come from the barrel
// (free — erased at compile time).
import { verifyDomain } from '../../../core/src/domain-verifier.js';
import type { VerifiedDomainList } from '@onegov/core';

/**
 * The three icon variants shipped under `packages/extension/icons/`.
 * Maps 1:1 to file name prefixes (`green-16.png`, `gray-32.png`, …).
 */
export type IconColor = 'green' | 'gray' | 'red';

/**
 * Decide which icon variant should represent a given page URL against the
 * bundled verified-domain roster.
 *
 * Returns `gray` for any input the URL parser rejects so the SW can call this
 * unconditionally on every navigation event without defensive try/catch.
 */
export function decideIcon(url: string, list: VerifiedDomainList): IconColor {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return 'gray';
  }
  if (hostname.length === 0) return 'gray';

  const status = verifyDomain(hostname, list);
  switch (status.kind) {
    case 'verified':
      return 'green';
    case 'lookalike':
      return 'red';
    case 'unknown':
      return 'gray';
  }
}

/**
 * Build the `path` map `chrome.action.setIcon` expects for a given colour.
 * Pulled into its own helper so the SW glue is one function call wide and
 * the path string never appears twice (any future icon-size change only
 * touches this single source of truth).
 */
export function iconPath(color: IconColor): Record<number, string> {
  return {
    16: `icons/${color}-16.png`,
    32: `icons/${color}-32.png`,
    48: `icons/${color}-48.png`,
  };
}
