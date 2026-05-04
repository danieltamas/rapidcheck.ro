import { describe, expect, it } from 'bun:test';

import {
  verifyDomain,
  findNearest,
  type DomainStatus,
  type VerifiedDomain,
  type VerifiedDomainList,
} from '../src/index.js';

describe('@rapidcheck/core public type contract', () => {
  it('constructs a VerifiedDomain', () => {
    const d: VerifiedDomain = {
      domain: 'anaf.ro',
      category: 'gov',
      addedAt: '2026-05-03',
      source: 'https://anaf.ro/',
    };
    expect(d.domain).toBe('anaf.ro');
  });

  it('constructs a VerifiedDomainList', () => {
    const list: VerifiedDomainList = {
      version: '1.0.0',
      updatedAt: '2026-05-03',
      domains: [],
    };
    expect(list.domains).toEqual([]);
  });

  it('verifyDomain returns a DomainStatus discriminated union', () => {
    const list: VerifiedDomainList = {
      version: '1.0.0',
      updatedAt: '2026-05-03',
      domains: [
        { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-03', source: 'https://anaf.ro/' },
      ],
    };
    const verified: DomainStatus = verifyDomain('www.anaf.ro', list);
    expect(verified.kind).toBe('verified');

    const unknown: DomainStatus = verifyDomain('example.com', list);
    expect(unknown.kind).toBe('unknown');
  });

  it('re-exports findNearest', () => {
    expect(typeof findNearest).toBe('function');
  });
});
