/**
 * Domain verifier.
 *
 * Maps an arbitrary hostname onto a `DomainStatus` against the bundled
 * verified-domain roster.
 *
 * STATUS: Stub. Track 2 implements eTLD+1 matching via `psl` and delegates to
 * `lookalike.findNearest` for fuzzy detection. The signature here is the
 * contract Track 4 (extension shell) wires its background icon state machine
 * against — do not change it without updating SPEC.md §5.1.
 */

import type { DomainStatus, VerifiedDomainList } from './types.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function verifyDomain(_hostname: string, _list: VerifiedDomainList): DomainStatus {
  // TODO(Track 2 / lookalike-and-verifier): Real implementation. The unknown
  // fallback keeps the icon gray in the meantime, which is the correct safe
  // default — no rule packs render until verification is real.
  return { kind: 'unknown' };
}
