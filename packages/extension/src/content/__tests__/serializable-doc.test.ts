/**
 * `wrapDocument` adapter tests — exercise the contract between the live
 * `Document` and `@onegov/core`'s extractor surface.
 *
 * Coverage:
 *   - `query` returns null on miss / element wrapper on hit
 *   - `queryAll` returns empty array on miss / wrapper array on hit
 *   - `tag` is lower-case
 *   - `text` is trimmed `textContent`
 *   - `attr` returns null for missing, raw string for present
 *   - `children` enumerates direct element children only (skips text nodes)
 *   - children is lazy and cached after first access
 *   - invalid selector strings yield null/empty (no crash)
 *   - adapter never mutates the wrapped DOM (round-trip equality)
 *   - works on a sub-element (any `ParentNode`, not just Document)
 */

import { describe, it, expect, beforeAll } from 'bun:test';

import { setupDom } from '../../../../ui/tests/setup-dom.js';
import { wrapDocument } from '../serializable-doc.js';

beforeAll(() => {
  setupDom();
});

function freshFixture(): HTMLDivElement {
  // Detached subtree so each test stays independent.
  const root = document.createElement('div');
  root.innerHTML = `
    <div class="brand">
      <h1 id="title">  Hello World  </h1>
      <p data-role="lead">First paragraph.</p>
      <p>Second paragraph.</p>
    </div>
    <ul>
      <li>One</li>
      <li>Two</li>
      <li>Three</li>
    </ul>
    <a href="https://anaf.ro" id="link-1">Link</a>
  `;
  return root;
}

describe('wrapDocument(root) — query', () => {
  it('returns null when no element matches', () => {
    const doc = wrapDocument(freshFixture());
    expect(doc.query('.does-not-exist')).toBeNull();
  });

  it('returns a SerializableEl on match', () => {
    const doc = wrapDocument(freshFixture());
    const el = doc.query('#title');
    expect(el).not.toBeNull();
    expect(el?.tag).toBe('h1');
  });

  it('does not throw on invalid selector — returns null instead', () => {
    const doc = wrapDocument(freshFixture());
    expect(doc.query('!!!not a valid selector')).toBeNull();
  });
});

describe('wrapDocument(root) — queryAll', () => {
  it('returns empty array when no element matches', () => {
    const doc = wrapDocument(freshFixture());
    expect(doc.queryAll('.nope')).toEqual([]);
  });

  it('returns one wrapper per match, in document order', () => {
    const doc = wrapDocument(freshFixture());
    const items = doc.queryAll('li');
    expect(items).toHaveLength(3);
    expect(items.map((el) => el.text)).toEqual(['One', 'Two', 'Three']);
  });

  it('does not throw on invalid selector — returns empty instead', () => {
    const doc = wrapDocument(freshFixture());
    expect(doc.queryAll('???invalid')).toEqual([]);
  });
});

describe('SerializableEl — properties', () => {
  it('exposes tag as lower-case', () => {
    const doc = wrapDocument(freshFixture());
    expect(doc.query('h1')?.tag).toBe('h1');
    expect(doc.query('a')?.tag).toBe('a');
  });

  it('trims textContent', () => {
    const doc = wrapDocument(freshFixture());
    expect(doc.query('#title')?.text).toBe('Hello World');
  });

  it('returns null for absent attributes', () => {
    const doc = wrapDocument(freshFixture());
    const el = doc.query('#title');
    expect(el?.attr('href')).toBeNull();
  });

  it('returns string value for present attributes', () => {
    const doc = wrapDocument(freshFixture());
    const link = doc.query('#link-1');
    expect(link?.attr('href')).toBe('https://anaf.ro');
  });

  it('children only includes element children (not text nodes)', () => {
    const doc = wrapDocument(freshFixture());
    const ul = doc.query('ul');
    expect(ul?.children).toHaveLength(3);
    expect(ul?.children.every((c) => c.tag === 'li')).toBe(true);
  });

  it('caches children across multiple accesses (returns the same array)', () => {
    const doc = wrapDocument(freshFixture());
    const ul = doc.query('ul');
    expect(ul).not.toBeNull();
    if (!ul) return;
    const a = ul.children;
    const b = ul.children;
    expect(a).toBe(b);
  });
});

describe('wrapDocument(root) — invariants', () => {
  it('never mutates the wrapped subtree', () => {
    const root = freshFixture();
    const before = root.outerHTML;
    const doc = wrapDocument(root);
    doc.query('#title');
    doc.queryAll('li').forEach((el) => {
      el.attr('class');
      void el.children;
    });
    expect(root.outerHTML).toBe(before);
  });

  it('works on a sub-element (any ParentNode)', () => {
    const root = freshFixture();
    const ul = root.querySelector('ul');
    expect(ul).not.toBeNull();
    if (!ul) return;
    const doc = wrapDocument(ul);
    // Selectors are scoped to the sub-element.
    expect(doc.queryAll('li')).toHaveLength(3);
    expect(doc.query('h1')).toBeNull(); // outside the subtree
  });

  it('works on the live document', () => {
    document.body.innerHTML = '<section id="bdy"><h2>X</h2></section>';
    const doc = wrapDocument(document);
    expect(doc.query('#bdy h2')?.text).toBe('X');
    document.body.innerHTML = ''; // cleanup
  });
});
