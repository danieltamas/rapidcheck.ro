import { describe, expect, it } from 'bun:test';

import type { DomainStatus } from '@rapidcheck/core';
import { statusToBadge } from '../index.js';

// NOTE: statusToBadge is exported for test only. The SERP script
// no longer renders unknown badges — they are skipped entirely.
// Only verified and lookalike are badged.

describe('SERP badge module', () => {
  it('maps verified status to verified badge', () => {
    const status: DomainStatus = {
      kind: 'verified',
      domain: { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
    };
    const badge = statusToBadge(status);
    expect(badge.variant).toBe('verified');
    expect(badge.label).toBe('Verificat');
  });

  it('maps lookalike status to lookalike badge with nearest domain', () => {
    const status: DomainStatus = {
      kind: 'lookalike',
      nearest: { domain: 'anaf.ro', category: 'gov', addedAt: '', source: '' },
      distance: 1,
      reason: 'levenshtein',
    };
    const badge = statusToBadge(status);
    expect(badge.variant).toBe('lookalike');
    expect(badge.label).toContain('anaf.ro');
  });

  it('maps unknown status to unknown badge (unused in rendering)', () => {
    const badge = statusToBadge({ kind: 'unknown' });
    expect(badge.variant).toBe('unknown');
  });

  it('maps null status to unknown badge (unused in rendering)', () => {
    const badge = statusToBadge(null);
    expect(badge.variant).toBe('unknown');
  });
});