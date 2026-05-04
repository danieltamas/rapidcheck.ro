/**
 * Domain verifier.
 *
 * Given an arbitrary hostname (subdomain, raw, IDN, fully-qualified, mixed
 * case), produces the `DomainStatus` that drives the per-tab browser action
 * icon and the content-script gate. Pure function over the bundled verified
 * roster — no I/O, no `chrome.*`.
 *
 * Decision flow:
 *   1. Normalise the hostname (lowercase, trim, drop trailing dot).
 *   2. IDN-decode + fold confusables (so `аnaf.ro` → `anaf.ro` for matching).
 *   3. Extract the eTLD+1 via `psl`. If `psl` cannot parse — IPv4 literal,
 *      `localhost`, single-label hostname — return `unknown`. The verifier
 *      never throws on garbage input.
 *   4. Exact eTLD+1 match against the roster → `verified`.
 *   5. Otherwise delegate to `findNearest` for the lookalike layer.
 *   6. Otherwise → `unknown`.
 *
 * Subdomain-of-verified is handled implicitly: `psl` reduces `spv.anaf.ro`
 * to its eTLD+1 `anaf.ro`, which matches the roster directly.
 */

import { parse } from 'psl';

import type { DomainStatus, VerifiedDomainList } from './types.js';
import { findNearest, normalizeHomograph } from './lookalike.js';

/**
 * Map a hostname onto a `DomainStatus`. Pure; never throws.
 */
export function verifyDomain(hostname: string, list: VerifiedDomainList): DomainStatus {
  if (typeof hostname !== 'string' || hostname.length === 0) {
    return { kind: 'unknown' };
  }
  if (!list || !Array.isArray(list.domains)) {
    return { kind: 'unknown' };
  }

  const trimmed = hostname.trim().toLowerCase();
  if (trimmed.length === 0) return { kind: 'unknown' };
  const stripped = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
  if (stripped.length === 0) return { kind: 'unknown' };

  // Try the raw stripped form first. This is the only path that can land an
  // exact `verified` match — homograph-folded inputs that match a verified
  // entry are deliberately routed through the lookalike layer so the user
  // sees the red icon instead of being silently trusted.
  const rawETLD = parseETLD(stripped);
  if (rawETLD) {
    // Exact eTLD+1 match
    const exact = list.domains.find((d) => d.domain === rawETLD);
    if (exact) return { kind: 'verified', domain: exact };
    // Subdomain match: diaspora.bancatransilvania.ro → bancatransilvania.ro
    const asSubdomain = list.domains.find((d) => d.domain !== rawETLD && stripped.endsWith('.' + d.domain));
    if (asSubdomain) return { kind: 'verified', domain: asSubdomain };
  }

  // Lookalike layer takes the raw input so it can apply its own normalisation
  // (homograph fold, TLD swap, Levenshtein).
  const lookalike = findNearest(stripped, list);
  if (lookalike) return lookalike;

  // Edge case: input is non-ASCII (or Punycode) and folds to a verified entry,
  // but `findNearest` already rejected an exact-equal candidate to avoid
  // double-counting verified hits. Re-check explicitly so a Cyrillic gov
  // domain that isn't on the roster doesn't accidentally come back as
  // `unknown`. If the folded eTLD+1 is on the roster we treat the original
  // as a homograph lookalike — never silently verify it.
  const folded = normalizeHomograph(stripped);
  if (folded !== stripped) {
    const foldedETLD = parseETLD(folded);
    if (foldedETLD) {
      const hit = list.domains.find((d) => d.domain === foldedETLD);
      if (hit) {
        return { kind: 'lookalike', nearest: hit, distance: 0, reason: 'homograph' };
      }
    }
  }

  return { kind: 'unknown' };
}

/**
 * Internal helper: extract the eTLD+1 via `psl`, swallowing parse errors and
 * returning `null` for inputs `psl` cannot classify (IPs, single-label hosts).
 */
function parseETLD(host: string): string | null {
  try {
    const parsed = parse(host);
    if ('domain' in parsed && parsed.domain) return parsed.domain;
  } catch {
    /* fall through */
  }
  return null;
}
