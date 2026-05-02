/**
 * Persona-layout tests (v0.1.1).
 *
 * Coverage:
 *   - All four personas wrap their content in the premium app shell
 *     (.onegov-shell + .onegov-shell__topbar + .onegov-shell__footer)
 *   - Sparse extraction (< 3 nodes) renders the diagnostic banner
 *   - Diagnostic banner reports the actual node count, not a stub
 *   - Each persona retains its signature affordance under the new shell
 *     (pensioner card, pro grid + kbd hint, journalist table tools)
 *
 * Persona layouts are pure-render functions; we mount them via the renderer
 * (which sets data-persona on the host + injects the theme stylesheet).
 */

import { describe, it, expect, beforeAll } from 'bun:test';

import type { Persona, SemanticTree } from '@onegov/core';

import { render } from '../../renderer.js';
import { isSparse } from '../diagnostic.js';
import { makeShadowHost, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

const PERSONAS: ReadonlyArray<Persona> = ['standard', 'pensioner', 'pro', 'journalist'];

const fullTree: SemanticTree = {
  url: 'https://anaf.ro/',
  domain: 'anaf.ro',
  layout: 'landing',
  nodes: [
    { id: 'h', type: 'heading', data: { text: 'ANAF', level: 1 } },
    { id: 'p', type: 'paragraph', data: { text: 'Bun venit pe portalul ANAF.' } },
    { id: 'a', type: 'link', data: { text: 'Verificare CUI', href: 'https://anaf.ro/cui' } },
    {
      id: 't',
      type: 'table',
      data: {
        headers: ['An', 'Suma'],
        rows: [
          ['2024', '1500'],
          ['2025', '1800'],
        ],
      },
    },
    { id: 'l', type: 'list', data: { items: ['Regula 1', 'Regula 2'] } },
  ],
};

const sparseTree: SemanticTree = {
  url: 'https://anaf.ro/foo',
  domain: 'anaf.ro',
  layout: 'unknown',
  nodes: [{ id: 'p', type: 'paragraph', data: { text: 'Doar un paragraf' } }],
};

const emptyTree: SemanticTree = {
  url: 'https://anaf.ro/foo',
  domain: 'anaf.ro',
  layout: 'unknown',
  nodes: [],
};

describe('isSparse()', () => {
  it('returns true for fewer than 3 nodes', () => {
    expect(isSparse(0)).toBe(true);
    expect(isSparse(1)).toBe(true);
    expect(isSparse(2)).toBe(true);
  });

  it('returns false for 3+ nodes', () => {
    expect(isSparse(3)).toBe(false);
    expect(isSparse(10)).toBe(false);
  });
});

describe('persona layouts — premium app shell', () => {
  for (const persona of PERSONAS) {
    it(`${persona} wraps content in .onegov-shell with topbar + footer`, () => {
      const { shadow } = makeShadowHost();
      render(fullTree, persona, shadow);
      expect(shadow.querySelector('.onegov-shell')).not.toBeNull();
      expect(shadow.querySelector('.onegov-shell__topbar')).not.toBeNull();
      expect(shadow.querySelector('.onegov-shell__footer')).not.toBeNull();
      // Brand mark "g" present
      const mark = shadow.querySelector('.onegov-shell__brand-mark');
      expect(mark?.textContent).toBe('g');
      // Footer mentions the domain
      const footer = shadow.querySelector('.onegov-shell__footer');
      expect(footer?.textContent).toContain('anaf.ro');
    });
  }

  it('journalist uses the wide inner column variant', () => {
    const { shadow } = makeShadowHost();
    render(fullTree, 'journalist', shadow);
    expect(shadow.querySelector('.onegov-shell__inner--wide')).not.toBeNull();
  });

  it('pensioner does NOT use the wide inner column variant', () => {
    const { shadow } = makeShadowHost();
    render(fullTree, 'pensioner', shadow);
    expect(shadow.querySelector('.onegov-shell__inner--wide')).toBeNull();
  });
});

describe('persona layouts — sparse extraction fallback', () => {
  for (const persona of PERSONAS) {
    it(`${persona} renders the diagnostic banner when nodes < 3`, () => {
      const { shadow } = makeShadowHost();
      render(sparseTree, persona, shadow);
      expect(shadow.querySelector('.onegov-diag')).not.toBeNull();
      const title = shadow.querySelector('.onegov-diag__title');
      expect(title?.textContent).toContain('Layer onegov activ');
      expect(title?.textContent).toContain('anaf.ro');
    });

    it(`${persona} renders the diagnostic banner when nodes is empty`, () => {
      const { shadow } = makeShadowHost();
      render(emptyTree, persona, shadow);
      expect(shadow.querySelector('.onegov-diag')).not.toBeNull();
    });
  }

  it('diagnostic banner reports the actual node count', () => {
    const { shadow } = makeShadowHost();
    render(sparseTree, 'standard', shadow);
    const summary = shadow.querySelector('.onegov-diag__summary');
    expect(summary?.textContent).toContain('1 element');
  });

  it('diagnostic banner with empty tree reports zero nodes', () => {
    const { shadow } = makeShadowHost();
    render(emptyTree, 'standard', shadow);
    const summary = shadow.querySelector('.onegov-diag__summary');
    expect(summary?.textContent).toContain('0 elemente');
  });
});

describe('persona layouts — signature affordances retained', () => {
  it('pensioner promotes the first link into a card', () => {
    const { shadow } = makeShadowHost();
    render(fullTree, 'pensioner', shadow);
    expect(shadow.querySelector('.onegov-card--pensioner')).not.toBeNull();
  });

  it('pro adds keyboard-hint badges next to links', () => {
    const { shadow } = makeShadowHost();
    render(fullTree, 'pro', shadow);
    expect(shadow.querySelector('.onegov-kbd-hint')).not.toBeNull();
    expect(shadow.querySelector('.onegov-pro-grid')).not.toBeNull();
  });

  it('journalist exposes the copy-as-CSV affordance on tables', () => {
    const { shadow } = makeShadowHost();
    render(fullTree, 'journalist', shadow);
    expect(shadow.querySelector('.onegov-table-tools')).not.toBeNull();
  });

  it('standard wraps card-candidate nodes in premium cards', () => {
    const { shadow } = makeShadowHost();
    render(fullTree, 'standard', shadow);
    // Premium card class applied to non-heading/paragraph nodes.
    const premiumCards = shadow.querySelectorAll('.onegov-card--premium');
    expect(premiumCards.length).toBeGreaterThan(0);
  });
});
