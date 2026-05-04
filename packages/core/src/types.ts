/**
 * @rapidcheck/core — public type definitions.
 *
 * Constraints:
 *   - No DOM types. No browser globals. No `chrome.*`.
 *   - Strict, no `any`. Use `unknown` and narrow at call sites.
 */

/**
 * A domain that has been vetted as a legitimate Romanian government or
 * public-interest service. Stored as the eTLD+1 (e.g. "anaf.ro", not
 * "www.anaf.ro" or "https://anaf.ro/").
 */
export interface VerifiedDomain {
  /** eTLD+1 form, e.g. "anaf.ro". */
  domain: string;
  /** Coarse classification driving rendering decisions. */
  category: 'gov' | 'public-interest';
  /** ISO-8601 date the entry was added. */
  addedAt: string;
  /** URL evidence supporting the entry. */
  source: string;
}

/**
 * The bundled, shipped roster of verified domains.
 */
export interface VerifiedDomainList {
  /** Roster version (semver). Bump on every edit. */
  version: string;
  /** ISO-8601 date the roster was last updated. */
  updatedAt: string;
  /** All verified entries. Order is not significant. */
  domains: VerifiedDomain[];
}

/**
 * Outcome of running `verifyDomain(hostname, list)`.
 *
 *   - `verified`  → the page's eTLD+1 matches a list entry exactly.
 *   - `lookalike` → the eTLD+1 is suspiciously close to a list entry; the
 *                   browser action goes red and RapidCheck does not alter the page.
 *   - `unknown`   → off-list. Extension stays inactive.
 */
export type DomainStatus =
  | { kind: 'verified'; domain: VerifiedDomain }
  | {
      kind: 'lookalike';
      nearest: VerifiedDomain;
      distance: number;
      reason: 'levenshtein' | 'homograph' | 'tld_swap';
    }
  | { kind: 'unknown' };
