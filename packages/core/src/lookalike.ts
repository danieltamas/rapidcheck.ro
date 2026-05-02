/**
 * Lookalike detection — Levenshtein distance, IDNA homograph normalisation,
 * TLD-swap detection.
 *
 * STATUS: Stubs. Track 2 owns the real implementations and the ≥20 test cases
 * required by TESTING.md (Cyrillic homographs, TLD swaps, suffix attacks,
 * negative cases).
 */

import type { DomainStatus, VerifiedDomainList } from './types.js';

/**
 * Classic Levenshtein edit distance. Returns -1 on stub.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function levenshtein(_a: string, _b: string): number {
  // TODO(Track 2 / lookalike-and-verifier): two-row DP, O(min(a,b)) memory.
  return -1;
}

/**
 * Convert IDNA / Cyrillic / Greek confusable characters to their ASCII
 * canonical form (e.g. `аnaf.ro` with U+0430 → `anaf.ro`).
 */
export function normalizeHomograph(input: string): string {
  // TODO(Track 2 / lookalike-and-verifier): use `idna-uts46-hx` plus an
  // explicit confusable map to catch homographs that IDNA itself does not.
  return input;
}

/**
 * Shape returned by `findNearest`. `null` is returned when no entry on the
 * list is close enough by any of the three reasons.
 */
export type LookalikeMatch = Extract<DomainStatus, { kind: 'lookalike' }>;

/**
 * Find the verified entry, if any, that the given hostname is suspiciously
 * close to. Returns `null` when no entry crosses the lookalike thresholds.
 */
export function findNearest(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _hostname: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _list: VerifiedDomainList,
): LookalikeMatch | null {
  // TODO(Track 2 / lookalike-and-verifier): Levenshtein ≤ 2, homograph match
  // after normalisation, TLD swap (same SLD different public suffix).
  return null;
}
