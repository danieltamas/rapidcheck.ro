/**
 * Domain verifier test suite.
 *
 * `verifyDomain` is the public entry point for the per-tab icon decision and
 * the content-script gate. The lookalike layer is tested exhaustively in
 * `lookalike.test.ts`; this file focuses on the verifier's own contract:
 *
 *   - exact eTLD+1 match
 *   - subdomain handling via psl
 *   - normalisation (case, trailing dot, IDN)
 *   - defensive behaviour on garbage input (never throws, always classifies)
 *
 * The roster mirrors the SPEC §Appendix A seed list, trimmed to what the
 * tests actually need. Keep it small — every domain here is an additional
 * Levenshtein candidate, which can mask bugs.
 */

import { describe, expect, it } from 'bun:test';

import { verifyDomain } from '../src/domain-verifier.js';
import type { VerifiedDomainList } from '../src/index.js';

const ROSTER: VerifiedDomainList = {
  version: '0.1.0-test',
  updatedAt: '2026-05-02',
  domains: [
    { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-02', source: 'https://anaf.ro' },
    { domain: 'onrc.ro', category: 'gov', addedAt: '2026-05-02', source: 'https://onrc.ro' },
    { domain: 'gov.ro', category: 'gov', addedAt: '2026-05-02', source: 'https://gov.ro' },
    {
      domain: 'mai.gov.ro',
      category: 'gov',
      addedAt: '2026-05-02',
      source: 'https://mai.gov.ro',
    },
  ],
};

describe('verifyDomain() — verified path', () => {
  it('returns verified for exact eTLD+1 match', () => {
    const status = verifyDomain('anaf.ro', ROSTER);
    expect(status.kind).toBe('verified');
    if (status.kind === 'verified') {
      expect(status.domain.domain).toBe('anaf.ro');
      expect(status.domain.category).toBe('gov');
    }
  });

  it('returns verified for subdomain (www.anaf.ro)', () => {
    const status = verifyDomain('www.anaf.ro', ROSTER);
    expect(status.kind).toBe('verified');
    if (status.kind === 'verified') {
      expect(status.domain.domain).toBe('anaf.ro');
    }
  });

  it('returns verified for deep subdomain (spv.anaf.ro)', () => {
    const status = verifyDomain('spv.anaf.ro', ROSTER);
    expect(status.kind).toBe('verified');
  });

  it('handles psl-defined public suffix collapse (mai.gov.ro → gov.ro eTLD+1)', () => {
    // psl treats `gov.ro` as a registrable name; `mai.gov.ro` reduces to
    // `gov.ro` and matches the verified entry. The roster carries both
    // `mai.gov.ro` and `gov.ro` so this asserts the verifier picks the
    // psl-derived match (which is `gov.ro`), not a different roster row.
    const status = verifyDomain('mai.gov.ro', ROSTER);
    expect(status.kind).toBe('verified');
    if (status.kind === 'verified') {
      expect(status.domain.domain).toBe('gov.ro');
    }
  });

  it('normalises ANAF.RO → anaf.ro', () => {
    const status = verifyDomain('ANAF.RO', ROSTER);
    expect(status.kind).toBe('verified');
  });

  it('normalises trailing dot anaf.ro. → anaf.ro', () => {
    const status = verifyDomain('anaf.ro.', ROSTER);
    expect(status.kind).toBe('verified');
  });

  it('trims surrounding whitespace', () => {
    const status = verifyDomain('  anaf.ro  ', ROSTER);
    expect(status.kind).toBe('verified');
  });
});

describe('verifyDomain() — lookalike path', () => {
  it('flags anaf-portal.ro as lookalike (suffix attack → levenshtein bucket)', () => {
    const status = verifyDomain('anaf-portal.ro', ROSTER);
    expect(status.kind).toBe('lookalike');
    if (status.kind === 'lookalike') {
      expect(status.reason).toBe('levenshtein');
      expect(status.nearest.domain).toBe('anaf.ro');
    }
  });

  it('flags anaf.com as lookalike (TLD swap)', () => {
    const status = verifyDomain('anaf.com', ROSTER);
    expect(status.kind).toBe('lookalike');
    if (status.kind === 'lookalike') {
      expect(status.reason).toBe('tld_swap');
    }
  });

  it('flags Cyrillic а homograph as lookalike', () => {
    const status = verifyDomain('\u0430naf.ro', ROSTER);
    expect(status.kind).toBe('lookalike');
    if (status.kind === 'lookalike') {
      expect(status.reason).toBe('homograph');
      expect(status.nearest.domain).toBe('anaf.ro');
    }
  });

  it('flags Punycode IDN that decodes to a homograph as lookalike', () => {
    // xn--naf-5cd.ro is the Punycode of 'аnaf.ro' (Cyrillic а U+0430).
    const status = verifyDomain('xn--naf-5cd.ro', ROSTER);
    expect(status.kind).toBe('lookalike');
    if (status.kind === 'lookalike') {
      expect(status.reason).toBe('homograph');
    }
  });
});

describe('verifyDomain() — unknown path', () => {
  it('returns unknown for an off-list domain (google.com)', () => {
    const status = verifyDomain('google.com', ROSTER);
    expect(status.kind).toBe('unknown');
  });

  it('returns unknown for empty string (no throw)', () => {
    expect(verifyDomain('', ROSTER).kind).toBe('unknown');
  });

  it('returns unknown for whitespace-only input', () => {
    expect(verifyDomain('   ', ROSTER).kind).toBe('unknown');
  });

  it('returns unknown for IPv4 literal', () => {
    expect(verifyDomain('127.0.0.1', ROSTER).kind).toBe('unknown');
  });

  it('returns unknown for IPv6 literal', () => {
    expect(verifyDomain('::1', ROSTER).kind).toBe('unknown');
  });

  it('returns unknown for localhost', () => {
    expect(verifyDomain('localhost', ROSTER).kind).toBe('unknown');
  });

  it('returns unknown for single-label hostname', () => {
    expect(verifyDomain('intranet', ROSTER).kind).toBe('unknown');
  });

  it('returns unknown when given an empty roster', () => {
    const empty: VerifiedDomainList = {
      version: '0.0.0',
      updatedAt: '2026-05-02',
      domains: [],
    };
    expect(verifyDomain('anaf.ro', empty).kind).toBe('unknown');
  });
});

describe('verifyDomain() — defensive behaviour', () => {
  it('does not throw on roster with no domains array (returns unknown)', () => {
    // Cast through unknown — the runtime input may be a malformed JSON.
    const malformed = { version: 'x', updatedAt: 'x' } as unknown as VerifiedDomainList;
    expect(verifyDomain('anaf.ro', malformed).kind).toBe('unknown');
  });

  it('does not mutate the input roster', () => {
    const snapshot = JSON.parse(JSON.stringify(ROSTER)) as VerifiedDomainList;
    verifyDomain('anaf.ro', ROSTER);
    verifyDomain('anaf.com', ROSTER);
    verifyDomain('xn--naf-5cd.ro', ROSTER);
    expect(ROSTER).toEqual(snapshot);
  });
});
