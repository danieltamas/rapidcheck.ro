import { describe, expect, it } from 'bun:test';

import type { DomainStatus } from '../src/index.js';
import { assessSubmitRisk } from '../src/index.js';

const verified: DomainStatus = {
  kind: 'verified',
  domain: { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-02', source: 'https://anaf.ro' },
};
const unknown: DomainStatus = { kind: 'unknown' };
const lookalike: DomainStatus = {
  kind: 'lookalike',
  nearest: { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-02', source: 'https://anaf.ro' },
  distance: 0,
  reason: 'tld_swap',
};

describe('submit risk assessment', () => {
  it('marks verified same-origin HTTPS submits safe', () => {
    expect(
      assessSubmitRisk({
        pageStatus: verified,
        actionStatus: verified,
        sensitiveMatches: [],
        isHttps: true,
        sameOrigin: true,
      }).level,
    ).toBe('safe');
  });

  it('blocks lookalike pages', () => {
    expect(
      assessSubmitRisk({
        pageStatus: lookalike,
        actionStatus: unknown,
        sensitiveMatches: [],
        isHttps: true,
        sameOrigin: true,
      }).level,
    ).toBe('block');
  });

  it('warns on sensitive data submitted from unknown pages', () => {
    const risk = assessSubmitRisk({
      pageStatus: unknown,
      actionStatus: unknown,
      sensitiveMatches: [{ kind: 'cnp', evidence: 'checksum' }],
      isHttps: true,
      sameOrigin: true,
    });
    expect(risk.level).toBe('caution');
    expect(risk.reasons.join(' ')).toContain('date sensibile');
  });
});
