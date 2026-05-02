/**
 * Type-contract smoke test.
 *
 * The scaffold task's invariant is: `packages/core/src/types.ts` exports the
 * full SPEC §5.1 surface and the barrel re-exports it. This test imports
 * every named type via the barrel and constructs a minimal valid value.
 *
 * If a future change drops a type, this file fails to compile (caught by
 * `bun run check`) AND fails to run (caught by `bun test`).
 */

import { describe, it, expect } from 'bun:test';

import {
  applyPersonaOverrides,
  extract,
  findNearest,
  loadBundled,
  validate,
  verifyDomain,
  type DomainStatus,
  type ExtractRule,
  type Persona,
  type PersonaOverride,
  type Route,
  type RulePack,
  type SemanticNode,
  type SemanticTree,
  type SerializableDoc,
  type SerializableEl,
  type VerifiedDomain,
  type VerifiedDomainList,
} from '../src/index.js';

describe('@onegov/core type contract (SPEC §5.1)', () => {
  it('constructs a VerifiedDomain', () => {
    const d: VerifiedDomain = {
      domain: 'anaf.ro',
      category: 'gov',
      addedAt: '2026-05-02',
      source: 'https://www.anaf.ro',
    };
    expect(d.domain).toBe('anaf.ro');
  });

  it('constructs a VerifiedDomainList', () => {
    const list: VerifiedDomainList = {
      version: '0.1.0',
      updatedAt: '2026-05-02',
      domains: [
        { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-02', source: 'https://www.anaf.ro' },
        {
          domain: 'demoanaf.ro',
          category: 'public-interest',
          addedAt: '2026-05-02',
          source: 'https://demoanaf.ro',
        },
      ],
    };
    expect(list.domains).toHaveLength(2);
  });

  it('models all three DomainStatus variants', () => {
    const verified: DomainStatus = {
      kind: 'verified',
      domain: { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-02', source: 'x' },
    };
    const lookalike: DomainStatus = {
      kind: 'lookalike',
      nearest: { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-02', source: 'x' },
      distance: 1,
      reason: 'levenshtein',
    };
    const unknown: DomainStatus = { kind: 'unknown' };
    expect([verified.kind, lookalike.kind, unknown.kind]).toEqual([
      'verified',
      'lookalike',
      'unknown',
    ]);
  });

  it('lists every Persona', () => {
    const personas: Persona[] = ['pensioner', 'standard', 'pro', 'journalist'];
    expect(personas).toHaveLength(4);
  });

  it('constructs a RulePack with a Route, ExtractRule, and PersonaOverride', () => {
    const rule: ExtractRule = {
      id: 'page-title',
      selector: 'h1',
      type: 'heading',
      attrs: { text: 'textContent' },
    };
    const override: PersonaOverride = {
      layout: 'landing-simplified',
      hide: ['secondary-nav'],
      emphasize: ['main-actions'],
    };
    const route: Route = {
      match: { pattern: '^/$' },
      layout: 'landing',
      extract: [rule],
      personas: { pensioner: override },
    };
    const pack: RulePack = {
      $schema: 'https://onegov.ro/schemas/rule-pack-v1.json',
      domain: 'anaf.ro',
      version: '0.1.0',
      routes: [route],
    };
    expect(pack.routes[0]?.extract[0]?.id).toBe('page-title');
    expect(pack.routes[0]?.personas?.pensioner?.layout).toBe('landing-simplified');
  });

  it('constructs a SerializableDoc / SerializableEl', () => {
    const el: SerializableEl = {
      tag: 'h1',
      text: 'ANAF',
      children: [],
      attr: (n) => (n === 'class' ? 'title' : null),
    };
    const doc: SerializableDoc = {
      query: () => el,
      queryAll: () => [el],
    };
    expect(doc.query('h1')?.text).toBe('ANAF');
    expect(doc.queryAll('h1')).toHaveLength(1);
    expect(el.attr('class')).toBe('title');
    expect(el.attr('missing')).toBeNull();
  });

  it('constructs a SemanticTree with SemanticNode entries', () => {
    const node: SemanticNode = {
      id: 'page-title',
      type: 'heading',
      data: { text: 'ANAF' },
    };
    const tree: SemanticTree = {
      url: 'https://anaf.ro/',
      domain: 'anaf.ro',
      layout: 'landing',
      nodes: [node],
    };
    expect(tree.nodes[0]?.data['text']).toBe('ANAF');
  });
});

describe('@onegov/core barrel exports the engine surface', () => {
  it('re-exports verifyDomain (returns unknown in scaffold stub)', () => {
    const list: VerifiedDomainList = { version: '0.0.0', updatedAt: '2026-05-02', domains: [] };
    const status = verifyDomain('example.com', list);
    expect(status.kind).toBe('unknown');
  });

  it('re-exports findNearest', () => {
    const list: VerifiedDomainList = { version: '0.0.0', updatedAt: '2026-05-02', domains: [] };
    const result = findNearest('anaf.com', list);
    expect(result).toBeNull();
  });

  it('re-exports validate and loadBundled (loadBundled returns null on failure)', async () => {
    const pack = await loadBundled('does-not-exist.ro', async () => {
      throw new Error('not found');
    });
    expect(pack).toBeNull();
    expect(() => validate(null)).toThrow();
  });

  it('re-exports extract (returns empty tree in scaffold stub)', () => {
    const doc: SerializableDoc = { query: () => null, queryAll: () => [] };
    const tree = extract([], doc, 'https://example.com/');
    expect(tree.nodes).toEqual([]);
    expect(tree.url).toBe('https://example.com/');
  });

  it('re-exports applyPersonaOverrides (identity in scaffold stub)', () => {
    const route: Route = { match: { pattern: '^/$' }, layout: 'landing', extract: [] };
    const out = applyPersonaOverrides(route, 'pensioner');
    expect(out.layout).toBe('landing');
  });
});
