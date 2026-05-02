/**
 * Semantic extractor test suite.
 *
 * The extractor sits between the rule pack and the renderer; bugs here either
 * lose page content (under-extraction) or create phantom nodes (over-
 * extraction). Coverage matches the task spec:
 *
 *   - single extraction picks the first match
 *   - multiple: true returns all matches
 *   - missing element omits the node (no throw)
 *   - textContent attr mapping works
 *   - named attribute mapping works
 *   - empty rule list yields empty nodes
 *   - rule id preserved exactly (suffixed for multiple)
 */

import { describe, expect, it } from 'bun:test';

import { extract } from '../src/semantic-extractor.js';
import type {
  ExtractRule,
  SerializableDoc,
  SerializableEl,
} from '../src/index.js';

/** Shorthand for building synthetic elements in tests. */
function el(
  tag: string,
  text: string,
  attrs: Record<string, string> = {},
): SerializableEl {
  return {
    tag,
    text,
    children: [],
    attr: (n) => attrs[n] ?? null,
  };
}

/**
 * Build a SerializableDoc whose `query` / `queryAll` look up by a selector
 * key. Tests can register multiple matches per selector to exercise
 * `multiple: true`.
 */
function fakeDoc(map: Record<string, SerializableEl[]>): SerializableDoc {
  return {
    query: (sel) => map[sel]?.[0] ?? null,
    queryAll: (sel) => map[sel] ?? [],
  };
}

describe('extract()', () => {
  it('returns an empty tree for an empty rule list', () => {
    const doc = fakeDoc({});
    const tree = extract([], doc, 'https://anaf.ro/');
    expect(tree.nodes).toEqual([]);
    expect(tree.url).toBe('https://anaf.ro/');
    expect(tree.domain).toBe('');
    expect(tree.layout).toBe('');
  });

  it('single extraction picks the first match', () => {
    const doc = fakeDoc({
      h1: [el('h1', 'Primul'), el('h1', 'Al doilea')],
    });
    const rules: ExtractRule[] = [
      { id: 'page-title', selector: 'h1', type: 'heading', attrs: { text: 'textContent' } },
    ];
    const tree = extract(rules, doc, 'https://anaf.ro/');
    expect(tree.nodes).toHaveLength(1);
    expect(tree.nodes[0]?.id).toBe('page-title');
    expect(tree.nodes[0]?.data['text']).toBe('Primul');
  });

  it('multiple: true returns one node per match with indexed ids', () => {
    const doc = fakeDoc({
      'nav.principal a': [
        el('a', 'Acasă', { href: '/' }),
        el('a', 'Servicii', { href: '/servicii' }),
        el('a', 'Contact', { href: '/contact' }),
      ],
    });
    const rules: ExtractRule[] = [
      {
        id: 'main-actions',
        selector: 'nav.principal a',
        type: 'link',
        multiple: true,
        attrs: { text: 'textContent', href: 'href' },
      },
    ];
    const tree = extract(rules, doc, 'https://anaf.ro/');
    expect(tree.nodes).toHaveLength(3);
    expect(tree.nodes[0]?.id).toBe('main-actions.0');
    expect(tree.nodes[1]?.id).toBe('main-actions.1');
    expect(tree.nodes[2]?.id).toBe('main-actions.2');
    expect(tree.nodes[0]?.data['href']).toBe('/');
    expect(tree.nodes[2]?.data['text']).toBe('Contact');
  });

  it('omits the node when the selector finds nothing (single)', () => {
    const doc = fakeDoc({
      h1: [el('h1', 'Title')],
    });
    const rules: ExtractRule[] = [
      { id: 'page-title', selector: 'h1', type: 'heading', attrs: { text: 'textContent' } },
      // Missing selector, no match.
      { id: 'subtitle', selector: 'h2', type: 'heading', attrs: { text: 'textContent' } },
    ];
    const tree = extract(rules, doc, 'https://anaf.ro/');
    expect(tree.nodes).toHaveLength(1);
    expect(tree.nodes[0]?.id).toBe('page-title');
  });

  it('produces zero nodes for `multiple: true` when no elements match', () => {
    const doc = fakeDoc({});
    const rules: ExtractRule[] = [
      { id: 'links', selector: 'a', type: 'link', multiple: true, attrs: { href: 'href' } },
    ];
    const tree = extract(rules, doc, 'https://x/');
    expect(tree.nodes).toHaveLength(0);
  });

  it('textContent attr mapping reads the element text', () => {
    const doc = fakeDoc({ h1: [el('h1', 'ANAF — pagina principală')] });
    const rules: ExtractRule[] = [
      { id: 'title', selector: 'h1', type: 'heading', attrs: { text: 'textContent' } },
    ];
    const tree = extract(rules, doc, 'x');
    expect(tree.nodes[0]?.data['text']).toBe('ANAF — pagina principală');
  });

  it('named attribute mapping reads the DOM attribute', () => {
    const doc = fakeDoc({
      a: [el('a', 'click me', { href: 'https://anaf.ro/cui', target: '_blank' })],
    });
    const rules: ExtractRule[] = [
      {
        id: 'cta',
        selector: 'a',
        type: 'link',
        attrs: { href: 'href', target: 'target' },
      },
    ];
    const tree = extract(rules, doc, 'x');
    expect(tree.nodes[0]?.data['href']).toBe('https://anaf.ro/cui');
    expect(tree.nodes[0]?.data['target']).toBe('_blank');
  });

  it('returns empty string for missing named attributes', () => {
    const doc = fakeDoc({ a: [el('a', 'click me', {})] });
    const rules: ExtractRule[] = [
      { id: 'cta', selector: 'a', type: 'link', attrs: { href: 'href' } },
    ];
    const tree = extract(rules, doc, 'x');
    expect(tree.nodes[0]?.data['href']).toBe('');
  });

  it('preserves the type from the rule on the produced node', () => {
    const doc = fakeDoc({ table: [el('table', '', {})] });
    const rules: ExtractRule[] = [{ id: 'data', selector: 'table', type: 'table' }];
    const tree = extract(rules, doc, 'x');
    expect(tree.nodes[0]?.type).toBe('table');
  });

  it('produces empty data when attrs mapping is omitted', () => {
    const doc = fakeDoc({ p: [el('p', 'hello')] });
    const rules: ExtractRule[] = [{ id: 'lead', selector: 'p', type: 'paragraph' }];
    const tree = extract(rules, doc, 'x');
    expect(tree.nodes[0]?.data).toEqual({});
  });

  it('does not mutate the input rules array', () => {
    const rules: ExtractRule[] = [
      { id: 'h', selector: 'h1', type: 'heading', attrs: { text: 'textContent' } },
    ];
    const snapshot = JSON.stringify(rules);
    const doc = fakeDoc({ h1: [el('h1', 'x')] });
    extract(rules, doc, 'u');
    expect(JSON.stringify(rules)).toBe(snapshot);
  });

  it('preserves the URL on the output tree', () => {
    const tree = extract([], fakeDoc({}), 'https://anaf.ro/cui-lookup?q=42');
    expect(tree.url).toBe('https://anaf.ro/cui-lookup?q=42');
  });
});
