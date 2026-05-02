/**
 * Lookalike detection — Levenshtein distance, IDNA / homograph normalisation,
 * TLD-swap detection.
 *
 * The detector is security-critical: false negatives let phishing domains
 * masquerade as gov sites, false positives turn the icon red on legitimate
 * traffic. The strategy is layered, deterministic, and side-effect-free:
 *
 *   1. Normalise the input — lowercase, trim, IDN-decode (Punycode → Unicode),
 *      then fold confusable Cyrillic / Greek letters to their ASCII canonical.
 *      Two domains that compare equal after this step trigger a `homograph`
 *      reason regardless of edit distance.
 *   2. Exact eTLD+1 equality after normalisation → the verifier handles the
 *      verified case; the lookalike path only fires when the *raw* input is
 *      not on the verified list but *normalised* input matches one.
 *   3. TLD swap — same SLD, different public suffix → `tld_swap`.
 *   4. Levenshtein ≤ 2 against any verified eTLD+1 → `levenshtein`.
 *
 * Confusable letter set is derived from Unicode TR39 §4 "Confusables", trimmed
 * to the homographs that map a non-ASCII character to a Latin-1 letter most
 * commonly found in Romanian-relevant gov domains. Citing the source so the
 * map can be audited / extended without spelunking the algorithm:
 *   https://www.unicode.org/Public/security/latest/confusables.txt
 */

import { toUnicode } from 'idna-uts46-hx';
import { parse } from 'psl';

import type { DomainStatus, VerifiedDomain, VerifiedDomainList } from './types.js';

/**
 * Maximum Levenshtein distance (inclusive) between two eTLD+1 strings to be
 * considered a lookalike. Two edits is the empirical sweet spot — covers
 * typo-squat and suffix attacks (`anaf-portal`, `anafportal`) without firing
 * on visually distinct gov peers.
 */
const MAX_LOOKALIKE_DISTANCE = 2;

/**
 * Confusable folding table. Keys are Unicode characters that visually resemble
 * the Latin-1 letter on the right. Source: Unicode TR39 confusables.txt
 * (single-script confusables collapsed to the ASCII target).
 *
 * The table is intentionally small. Adding entries is a security-policy
 * decision: every new entry expands the lookalike search radius and risks
 * false positives. Document the source URL in the commit when extending.
 */
const CONFUSABLES: Readonly<Record<string, string>> = Object.freeze({
  // Cyrillic
  '\u0430': 'a', // а
  '\u0435': 'e', // е
  '\u043E': 'o', // о
  '\u0440': 'p', // р
  '\u0441': 'c', // с
  '\u0445': 'x', // х
  '\u0443': 'y', // у
  '\u0456': 'i', // і
  '\u0458': 'j', // ј
  '\u04CF': 'l', // ӏ
  '\u051B': 'q', // ԛ
  '\u0455': 's', // ѕ
  // Greek
  '\u03BF': 'o', // ο
  '\u03B1': 'a', // α
  '\u03B5': 'e', // ε
  '\u03C1': 'p', // ρ
  '\u03BD': 'v', // ν
  '\u03C7': 'x', // χ
  // Latin-extended look-alikes
  '\u0131': 'i', // ı (dotless i)
});

/**
 * Two-row dynamic-programming Levenshtein distance. O(min(|a|,|b|)) memory,
 * O(|a|·|b|) time. Pure; safe to call with empty strings.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Always iterate over the shorter string to keep the row buffer small.
  let short = a;
  let long = b;
  if (a.length > b.length) {
    short = b;
    long = a;
  }

  const shortLen = short.length;
  const longLen = long.length;

  let prev: number[] = new Array<number>(shortLen + 1);
  let curr: number[] = new Array<number>(shortLen + 1);

  for (let i = 0; i <= shortLen; i++) prev[i] = i;

  for (let j = 1; j <= longLen; j++) {
    curr[0] = j;
    const longChar = long.charCodeAt(j - 1);
    for (let i = 1; i <= shortLen; i++) {
      const cost = short.charCodeAt(i - 1) === longChar ? 0 : 1;
      // prev[i-1] = diagonal, prev[i] = up, curr[i-1] = left
      const del = (prev[i] ?? 0) + 1;
      const ins = (curr[i - 1] ?? 0) + 1;
      const sub = (prev[i - 1] ?? 0) + cost;
      let min = del;
      if (ins < min) min = ins;
      if (sub < min) min = sub;
      curr[i] = min;
    }
    // Swap rows; reuse prev as the next curr to avoid allocations.
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[shortLen] ?? 0;
}

/**
 * Lowercase + trim + strip a single trailing dot. The trailing dot is the
 * "fully qualified" form (`anaf.ro.`) that browsers and some hostnames use;
 * `psl.parse` is happy without it and the verified roster never stores it.
 */
function normaliseHost(input: string): string {
  let host = input.trim().toLowerCase();
  if (host.endsWith('.')) host = host.slice(0, -1);
  return host;
}

/**
 * Decode Punycode (`xn--…`) labels to Unicode and fold Cyrillic / Greek
 * confusables to their ASCII canonical. The result is a pure-ASCII string
 * suitable for direct equality / Levenshtein comparison against the verified
 * roster (which is itself ASCII).
 *
 * Returns the input unchanged when it contains no IDN markers and no
 * confusables — cheap pass-through for the common case.
 */
export function normalizeHomograph(input: string): string {
  const host = normaliseHost(input);
  if (host.length === 0) return host;

  // Step 1 — IDN decode. `toUnicode` is a no-op for pure ASCII input and
  // converts Punycode (xn--) to its Unicode form. We swallow exceptions: a
  // malformed input cannot be a homograph, so just fall through.
  let decoded: string;
  try {
    decoded = toUnicode(host);
  } catch {
    decoded = host;
  }

  // Step 2 — fold confusables. We walk by code-point so surrogate pairs are
  // handled correctly; any character not in the table passes through.
  let folded = '';
  for (const ch of decoded) {
    folded += CONFUSABLES[ch] ?? ch;
  }
  return folded;
}

/**
 * Extract the eTLD+1 from a hostname using `psl`. Returns the input itself
 * when `psl` cannot parse (e.g. IPv4 literal, `localhost`); callers must
 * decide what to do with non-public-suffix inputs.
 */
function eTLDPlusOne(host: string): string | null {
  try {
    const parsed = parse(host);
    if ('domain' in parsed && parsed.domain) return parsed.domain;
  } catch {
    /* fall through to null */
  }
  return null;
}

/**
 * Split an eTLD+1 into its second-level label and public suffix. `null` if
 * the input is not a recognisable public-suffix domain. Used by TLD-swap
 * detection: same `sld` + different `tld` = swap candidate.
 */
function splitDomain(host: string): { sld: string; tld: string } | null {
  try {
    const parsed = parse(host);
    if ('sld' in parsed && parsed.sld && parsed.tld) {
      return { sld: parsed.sld, tld: parsed.tld };
    }
  } catch {
    /* fall through */
  }
  return null;
}

/**
 * Shape returned by `findNearest`. Re-derived from the canonical
 * `DomainStatus` so any change to the public type ripples here automatically.
 */
export type LookalikeMatch = Extract<DomainStatus, { kind: 'lookalike' }>;

/**
 * Find the verified entry, if any, that the given hostname is suspiciously
 * close to. Returns `null` when no entry crosses any of the three lookalike
 * thresholds (homograph, TLD swap, Levenshtein ≤ 2).
 *
 * Pure: never mutates `list`, never throws on malformed input.
 */
export function findNearest(hostname: string, list: VerifiedDomainList): LookalikeMatch | null {
  if (typeof hostname !== 'string' || hostname.length === 0) return null;
  if (!list || !Array.isArray(list.domains) || list.domains.length === 0) return null;

  const normalised = normaliseHost(hostname);
  if (normalised.length === 0) return null;

  // Resolve the eTLD+1 of the candidate; if `psl` rejects, fall back to the
  // raw normalised string so we still catch suffix attacks against odd inputs.
  const candidateETLD = eTLDPlusOne(normalised) ?? normalised;

  // Pre-skip: if the candidate IS a verified eTLD+1, that's the verifier's
  // job. We only flag close-but-not-equal.
  const exact = list.domains.find((d) => d.domain === candidateETLD);
  if (exact) return null;

  // 1. Homograph check — fold and compare against every verified entry.
  const folded = normalizeHomograph(candidateETLD);
  if (folded !== candidateETLD) {
    const homographHit = list.domains.find((d) => d.domain === folded);
    if (homographHit) {
      return {
        kind: 'lookalike',
        nearest: homographHit,
        distance: 0,
        reason: 'homograph',
      };
    }
  }

  // 2. TLD-swap check — same SLD, different public suffix. We compare against
  // the FOLDED candidate to catch homograph + swap combos (rare but possible).
  const candidateSplit = splitDomain(folded);
  if (candidateSplit) {
    const swap = list.domains.find((d) => {
      const verifiedSplit = splitDomain(d.domain);
      if (!verifiedSplit) return false;
      return verifiedSplit.sld === candidateSplit.sld && verifiedSplit.tld !== candidateSplit.tld;
    });
    if (swap) {
      return {
        kind: 'lookalike',
        nearest: swap,
        distance: 0,
        reason: 'tld_swap',
      };
    }
  }

  // 3. Suffix-attack detection. A common phishing pattern is to register
  // `<verified-sld><separator><tail>.<tld>` — `anaf-portal.ro`,
  // `anafportal.ro`, `anaf.gov.ro.example.ro`. Pure Levenshtein at distance
  // ≤ 2 cannot catch these because the inserted tail is many edits long.
  // Spec (task §lookalike) groups these under `reason: 'levenshtein'`.
  if (candidateSplit) {
    const suffixHit = list.domains.find((d) => {
      const verifiedSplit = splitDomain(d.domain);
      if (!verifiedSplit) return false;
      // Same TLD: candidate SLD starts with the verified SLD followed by a
      // separator (`-`, `.`, `_`) or directly concatenated (`anafportal`).
      // Bare equality is excluded above (verified hit already returned null).
      if (verifiedSplit.tld !== candidateSplit.tld) return false;
      const vSld = verifiedSplit.sld;
      const cSld = candidateSplit.sld;
      if (cSld === vSld) return false;
      if (!cSld.startsWith(vSld)) return false;
      // Anything beyond the verified SLD counts as a suffix attack candidate.
      const tail = cSld.slice(vSld.length);
      return tail.length > 0;
    });
    if (suffixHit) {
      const verifiedSplit = splitDomain(suffixHit.domain);
      const distance = verifiedSplit
        ? levenshtein(folded, suffixHit.domain)
        : MAX_LOOKALIKE_DISTANCE + 1;
      return {
        kind: 'lookalike',
        nearest: suffixHit,
        distance,
        reason: 'levenshtein',
      };
    }
  }

  // 4. Levenshtein — find the closest verified entry within MAX distance.
  let bestEntry: VerifiedDomain | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  // Use the folded candidate so Punycode + Cyrillic reach the metric in their
  // ASCII form, while still being labelled `levenshtein` (homograph already
  // rejected above).
  for (const entry of list.domains) {
    const d = levenshtein(folded, entry.domain);
    if (d < bestDistance) {
      bestDistance = d;
      bestEntry = entry;
    }
  }
  if (bestEntry && bestDistance > 0 && bestDistance <= MAX_LOOKALIKE_DISTANCE) {
    return {
      kind: 'lookalike',
      nearest: bestEntry,
      distance: bestDistance,
      reason: 'levenshtein',
    };
  }

  return null;
}
