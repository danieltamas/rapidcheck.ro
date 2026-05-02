/**
 * Renderer integration tests.
 *
 * Lives in `packages/ui/tests/` (not under `src/`) because it needs the same
 * fixture across multiple personas, and the per-component tests already
 * cover atomic rendering. This file targets:
 *   - all four persona variants render given the same SemanticTree
 *   - re-rendering the same tree is idempotent (no duplicate <style>, no
 *     duplicate mount)
 *   - data-persona is set on the shadow host
 *   - shadow root mode is closed (inherited from caller — we just verify we
 *     accept a closed shadow root and operate on it)
 */

import { describe, it, expect, beforeAll } from 'bun:test';

import type { Persona, SemanticTree } from '@onegov/core';

import { render } from '../src/renderer.js';
import { makeShadowHost, setupDom } from './setup-dom.js';

beforeAll(() => {
  setupDom();
});

const fixture: SemanticTree = {
  url: 'https://anaf.ro/',
  domain: 'anaf.ro',
  layout: 'landing',
  nodes: [
    { id: 'page-title', type: 'heading', data: { text: 'ANAF', level: 1 } },
    {
      id: 'intro',
      type: 'paragraph',
      data: { text: 'Bun venit pe portalul ANAF.' },
    },
    {
      id: 'main-actions',
      type: 'link',
      data: { text: 'Verificare CUI', href: 'https://anaf.ro/cui' },
    },
    {
      id: 'taxes-table',
      type: 'table',
      data: {
        headers: ['An', 'Suma'],
        rows: [
          ['2024', '1500'],
          ['2025', '1800'],
        ],
      },
    },
    {
      id: 'rules',
      type: 'list',
      data: { items: ['Regula 1', 'Regula 2'] },
    },
  ],
};

const personas: Persona[] = ['standard', 'pensioner', 'pro', 'journalist'];

describe('render(tree, persona, ShadowRoot)', () => {
  for (const persona of personas) {
    it(`renders without error for persona=${persona}`, () => {
      const { host, shadow } = makeShadowHost();
      render(fixture, persona, shadow);
      expect(host.getAttribute('data-persona')).toBe(persona);
      expect(shadow.querySelector('#onegov-app')).not.toBeNull();
      expect(shadow.querySelector('h1')?.textContent).toBe('ANAF');
    });
  }

  it('injects exactly one <style data-onegov-theme="1"> across N renders', () => {
    const { shadow } = makeShadowHost();
    for (let i = 0; i < 5; i++) {
      render(fixture, 'standard', shadow);
    }
    const styles = shadow.querySelectorAll('style[data-onegov-theme="1"]');
    expect(styles.length).toBe(1);
  });

  it('keeps a single mount node across N renders (no DOM churn)', () => {
    const { shadow } = makeShadowHost();
    render(fixture, 'standard', shadow);
    const firstMount = shadow.querySelector('#onegov-app');
    render(fixture, 'standard', shadow);
    render(fixture, 'standard', shadow);
    const secondMount = shadow.querySelector('#onegov-app');
    expect(firstMount).toBe(secondMount);
  });

  it('updates data-persona on the host when persona changes', () => {
    const { host, shadow } = makeShadowHost();
    render(fixture, 'standard', shadow);
    expect(host.getAttribute('data-persona')).toBe('standard');
    render(fixture, 'pensioner', shadow);
    expect(host.getAttribute('data-persona')).toBe('pensioner');
  });

  it('selects the journalist layout for persona=journalist', () => {
    const { shadow } = makeShadowHost();
    render(fixture, 'journalist', shadow);
    // Journalist layout adds a copy-as-CSV affordance to tables.
    expect(shadow.querySelector('.onegov-table-tools')).not.toBeNull();
  });

  it('selects the pensioner layout for persona=pensioner', () => {
    const { shadow } = makeShadowHost();
    render(fixture, 'pensioner', shadow);
    // Pensioner layout wraps the first link in a card.
    expect(shadow.querySelector('.onegov-card--pensioner')).not.toBeNull();
  });

  it('selects the pro layout for persona=pro', () => {
    const { shadow } = makeShadowHost();
    render(fixture, 'pro', shadow);
    // Pro layout adds keyboard hints next to links.
    expect(shadow.querySelector('.onegov-kbd-hint')).not.toBeNull();
  });

  it('renders nothing surprising in standard layout', () => {
    const { shadow } = makeShadowHost();
    render(fixture, 'standard', shadow);
    expect(shadow.querySelector('.onegov-table-tools')).toBeNull();
    expect(shadow.querySelector('.onegov-kbd-hint')).toBeNull();
  });

  it('keeps the original page DOM untouched (only host attr + shadow root mutate)', () => {
    setupDom();
    const beforeBody = document.body.innerHTML;
    const { host, shadow } = makeShadowHost();
    // The shadow host itself was appended by makeShadowHost (the caller in
    // production is the content script); compute "after" excluding that.
    const afterAppend = document.body.innerHTML;
    expect(afterAppend).not.toBe(beforeBody);

    // First render sets data-persona on the host AND populates the shadow
    // root. The host attribute is the only thing that's allowed to change
    // outside the shadow root (it's the render target's host element, not
    // page content).
    render(fixture, 'standard', shadow);
    expect(host.getAttribute('data-persona')).toBe('standard');

    // Subsequent renders with the same persona must NOT mutate the body —
    // both the host attribute and the (closed) shadow content stay stable
    // from the page's perspective.
    const beforeRerender = document.body.innerHTML;
    render(fixture, 'standard', shadow);
    render(fixture, 'standard', shadow);
    const afterRerender = document.body.innerHTML;
    expect(afterRerender).toBe(beforeRerender);
  });
});
