import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Link, sanitizeHref } from '../Link.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('sanitizeHref (security boundary)', () => {
  const allowed: Array<[string, string]> = [
    ['https://anaf.ro/', 'https://anaf.ro/'],
    ['http://anaf.ro/', 'http://anaf.ro/'],
    ['mailto:contact@anaf.ro', 'mailto:contact@anaf.ro'],
    ['tel:+40212345678', 'tel:+40212345678'],
  ];
  for (const [input, expected] of allowed) {
    it(`accepts ${input}`, () => {
      expect(sanitizeHref(input)).toBe(expected);
    });
  }

  const blocked = [
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'ftp://example.com',
    '//evil.com/path',
    'chrome-extension://abcdef/',
    '   javascript:alert(1)   ',
    '',
    '   ',
  ];
  for (const input of blocked) {
    it(`blocks ${JSON.stringify(input)}`, () => {
      expect(sanitizeHref(input)).toBeNull();
    });
  }

  it('accepts site-relative paths', () => {
    expect(sanitizeHref('/page')).toBe('/page');
    expect(sanitizeHref('/page?x=1')).toBe('/page?x=1');
    expect(sanitizeHref('#anchor')).toBe('#anchor');
    expect(sanitizeHref('?q=x')).toBe('?q=x');
  });

  it('accepts bare relative names without colons', () => {
    expect(sanitizeHref('about.html')).toBe('about.html');
  });

  it('rejects bare names with colons', () => {
    expect(sanitizeHref('jav&Tab;ascript:alert(1)')).toBeNull();
  });
});

describe('Link', () => {
  it('renders an anchor for safe https hrefs', () => {
    const root = mountInto();
    render(<Link text="ANAF" href="https://anaf.ro/" persona="standard" />, root);
    const a = root.querySelector('a');
    expect(a).not.toBeNull();
    expect(a?.getAttribute('href')).toBe('https://anaf.ro/');
    expect(a?.textContent).toBe('ANAF');
  });

  it('adds noopener+noreferrer+target=_blank for external https', () => {
    const root = mountInto();
    render(<Link text="X" href="https://anaf.ro/" persona="standard" />, root);
    const a = root.querySelector('a');
    expect(a?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(a?.getAttribute('target')).toBe('_blank');
  });

  it('renders mailto without target=_blank', () => {
    const root = mountInto();
    render(<Link text="Email" href="mailto:x@y.ro" persona="standard" />, root);
    const a = root.querySelector('a');
    expect(a?.getAttribute('href')).toBe('mailto:x@y.ro');
    expect(a?.getAttribute('target')).toBeNull();
  });

  it('renders a relative href without target=_blank', () => {
    const root = mountInto();
    render(<Link text="page" href="/about" persona="standard" />, root);
    const a = root.querySelector('a');
    expect(a?.getAttribute('href')).toBe('/about');
    expect(a?.getAttribute('target')).toBeNull();
  });

  it('renders javascript: as plain text, not a link (security)', () => {
    const root = mountInto();
    render(<Link text="Click" href="javascript:alert(1)" persona="standard" />, root);
    expect(root.querySelector('a')).toBeNull();
    const span = root.querySelector('span.onegov-link--blocked');
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe('Click');
  });

  it('renders data: as plain text, not a link', () => {
    const root = mountInto();
    render(
      <Link text="t" href="data:text/html,<script>alert(1)</script>" persona="standard" />,
      root,
    );
    expect(root.querySelector('a')).toBeNull();
  });

  it('escapes link text', () => {
    const root = mountInto();
    render(<Link text="<b>x</b>" href="https://x.ro/" persona="standard" />, root);
    expect(root.querySelector('a b')).toBeNull();
    expect(root.querySelector('a')?.textContent).toBe('<b>x</b>');
  });

  it('reflects persona via data-persona', () => {
    const root = mountInto();
    render(<Link text="x" href="/y" persona="pro" />, root);
    expect(root.querySelector('a')?.getAttribute('data-persona')).toBe('pro');
  });
});
