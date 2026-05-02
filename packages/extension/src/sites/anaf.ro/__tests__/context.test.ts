/**
 * Context extractor tests.
 *
 * happy-dom is sufficient — the extractor only reads textContent + a tiny
 * set of selectors.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';

import { setupDom } from '../../../../../ui/tests/setup-dom.js';
import { extractContext } from '../context.js';

beforeAll(() => {
  setupDom();
});

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('extractContext', () => {
  it('returns a populated context for an anaf-shaped page', () => {
    document.body.innerHTML = '<h1>Calendar fiscal</h1><nav><a href="#">Servicii</a></nav>';
    const ctx = extractContext(document, new URL('https://www.anaf.ro/anaf/internet/ANAF/'));
    expect(ctx.url).toBe('https://www.anaf.ro/anaf/internet/ANAF/');
    expect(ctx.pageTitle).toBe('Calendar fiscal');
    expect(ctx.loggedIn).toBe(false);
    expect(ctx.route.kind).toBe('home');
  });

  it('detects a logged-in shell from a logout-style link', () => {
    document.body.innerHTML = '<a href="/logout">Ieșire din cont</a>';
    const ctx = extractContext(document, new URL('https://www.anaf.ro/'));
    expect(ctx.loggedIn).toBe(true);
  });

  it('returns null pageTitle when no h1 exists', () => {
    document.body.innerHTML = '<div>plain page</div>';
    const ctx = extractContext(document, new URL('https://www.anaf.ro/'));
    expect(ctx.pageTitle).toBeNull();
  });

  it('classifies the route into the context', () => {
    const ctx = extractContext(
      document,
      new URL('https://www.anaf.ro/anaf/internet/ANAF/?cui=14841555'),
    );
    expect(ctx.route.kind).toBe('cui');
    if (ctx.route.kind === 'cui') {
      expect(ctx.route.cui).toBe('14841555');
    }
  });

  it('never mutates the document', () => {
    document.body.innerHTML = '<h1>Title</h1><p>Body</p>';
    const before = document.body.outerHTML;
    extractContext(document, new URL('https://www.anaf.ro/'));
    expect(document.body.outerHTML).toBe(before);
  });
});
