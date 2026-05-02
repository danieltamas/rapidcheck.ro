/**
 * Persona override application test suite.
 *
 * Covers the four permitted operations (`hide`, `emphasize`, `layout`,
 * no-override identity) plus the combination case, plus a mutation guard.
 */

import { describe, expect, it } from 'bun:test';

import { applyPersonaOverrides } from '../src/persona.js';
import type { ExtractRule, Route } from '../src/index.js';

const RULES: ExtractRule[] = [
  { id: 'header', selector: 'header', type: 'heading' },
  { id: 'main-actions', selector: 'nav.principal a', type: 'link', multiple: true },
  { id: 'secondary-nav', selector: 'nav.secondary a', type: 'link', multiple: true },
  { id: 'lead', selector: '.lead', type: 'paragraph' },
  { id: 'footer-links', selector: 'footer a', type: 'link', multiple: true },
];

const ROUTE: Route = {
  match: { pattern: '^/$' },
  layout: 'landing',
  extract: RULES,
  personas: {
    pensioner: {
      layout: 'landing-simplified',
      hide: ['secondary-nav', 'footer-links'],
      emphasize: ['main-actions'],
    },
    pro: { layout: 'landing-dense' },
    journalist: { emphasize: ['lead', 'main-actions'] },
    standard: {},
  },
};

describe('applyPersonaOverrides()', () => {
  it('returns the input route when no persona overrides exist (no `personas` field)', () => {
    const bare: Route = {
      match: { pattern: '^/$' },
      layout: 'landing',
      extract: RULES,
    };
    const out = applyPersonaOverrides(bare, 'pensioner');
    expect(out).toBe(bare); // referentially same — no work to do
    expect(out.layout).toBe('landing');
    expect(out.extract).toBe(RULES);
  });

  it('returns the input route when the named persona has no override entry', () => {
    const route: Route = {
      ...ROUTE,
      personas: { pensioner: { layout: 'x' } },
    };
    const out = applyPersonaOverrides(route, 'pro');
    // pro has no entry → unchanged
    expect(out.layout).toBe('landing');
  });

  it('returns the input route when the persona override is empty (e.g. standard)', () => {
    const out = applyPersonaOverrides(ROUTE, 'standard');
    expect(out.layout).toBe('landing');
    expect(out.extract.map((r) => r.id)).toEqual([
      'header',
      'main-actions',
      'secondary-nav',
      'lead',
      'footer-links',
    ]);
  });

  it('hide removes the matching rules', () => {
    const out = applyPersonaOverrides(ROUTE, 'pensioner');
    const ids = out.extract.map((r) => r.id);
    expect(ids).not.toContain('secondary-nav');
    expect(ids).not.toContain('footer-links');
    // surviving rules retain their order, modulo emphasize
    expect(ids).toContain('header');
    expect(ids).toContain('lead');
  });

  it('emphasize lifts the listed ids to the head, preserving emphasize order', () => {
    const out = applyPersonaOverrides(ROUTE, 'journalist');
    const ids = out.extract.map((r) => r.id);
    // 'lead' + 'main-actions' first, in that order
    expect(ids[0]).toBe('lead');
    expect(ids[1]).toBe('main-actions');
    // The rest keep their original relative order
    const tail = ids.slice(2);
    expect(tail).toEqual(['header', 'secondary-nav', 'footer-links']);
  });

  it('layout overrides the route default', () => {
    const out = applyPersonaOverrides(ROUTE, 'pro');
    expect(out.layout).toBe('landing-dense');
  });

  it('combination — pensioner applies hide + emphasize + layout together', () => {
    const out = applyPersonaOverrides(ROUTE, 'pensioner');
    expect(out.layout).toBe('landing-simplified');
    const ids = out.extract.map((r) => r.id);
    expect(ids).toEqual(['main-actions', 'header', 'lead']);
  });

  it('does not mutate the input route', () => {
    const snapshot = JSON.stringify(ROUTE);
    applyPersonaOverrides(ROUTE, 'pensioner');
    applyPersonaOverrides(ROUTE, 'pro');
    applyPersonaOverrides(ROUTE, 'journalist');
    expect(JSON.stringify(ROUTE)).toBe(snapshot);
  });

  it('does not mutate the input extract array', () => {
    const snapshotIds = RULES.map((r) => r.id).join(',');
    applyPersonaOverrides(ROUTE, 'pensioner');
    expect(RULES.map((r) => r.id).join(',')).toBe(snapshotIds);
  });

  it('emphasize on an id that does not exist is a no-op (silently ignored)', () => {
    const route: Route = {
      ...ROUTE,
      personas: { pensioner: { emphasize: ['nonexistent', 'main-actions'] } },
    };
    const out = applyPersonaOverrides(route, 'pensioner');
    const ids = out.extract.map((r) => r.id);
    expect(ids[0]).toBe('main-actions');
    expect(ids).toHaveLength(RULES.length);
  });

  it('hide on an id that does not exist is a no-op', () => {
    const route: Route = {
      ...ROUTE,
      personas: { pensioner: { hide: ['nonexistent'] } },
    };
    const out = applyPersonaOverrides(route, 'pensioner');
    expect(out.extract).toHaveLength(RULES.length);
  });

  it('hide+emphasize on the same id: hide wins (id never appears)', () => {
    const route: Route = {
      ...ROUTE,
      personas: { pensioner: { hide: ['main-actions'], emphasize: ['main-actions'] } },
    };
    const out = applyPersonaOverrides(route, 'pensioner');
    const ids = out.extract.map((r) => r.id);
    expect(ids).not.toContain('main-actions');
  });

  it('persists the route.match pattern through overrides', () => {
    const out = applyPersonaOverrides(ROUTE, 'pensioner');
    expect(out.match.pattern).toBe('^/$');
  });
});
