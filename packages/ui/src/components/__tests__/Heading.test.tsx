import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Heading } from '../Heading.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Heading', () => {
  it('renders an <h1> by default', () => {
    const root = mountInto();
    render(<Heading text="Titlu" persona="standard" />, root);
    const h1 = root.querySelector('h1');
    expect(h1).not.toBeNull();
    expect(h1?.textContent).toBe('Titlu');
  });

  it('renders <h2> when level=2', () => {
    const root = mountInto();
    render(<Heading text="Sub" level={2} persona="standard" />, root);
    expect(root.querySelector('h2')).not.toBeNull();
    expect(root.querySelector('h1')).toBeNull();
  });

  it('renders <h3> when level=3', () => {
    const root = mountInto();
    render(<Heading text="Sub-sub" level={3} persona="standard" />, root);
    expect(root.querySelector('h3')).not.toBeNull();
  });

  it('applies pensioner-specific class when persona=pensioner', () => {
    const root = mountInto();
    render(<Heading text="Mare" persona="pensioner" />, root);
    const h1 = root.querySelector('h1');
    expect(h1?.getAttribute('class')).toContain('onegov-h1--pensioner');
  });

  it('omits the pensioner class for other personas', () => {
    const root = mountInto();
    render(<Heading text="Standard" persona="standard" />, root);
    const h1 = root.querySelector('h1');
    expect(h1?.getAttribute('class')).not.toContain('--pensioner');
  });

  it('sets data-persona on the rendered element', () => {
    const root = mountInto();
    render(<Heading text="X" persona="pro" />, root);
    expect(root.querySelector('h1')?.getAttribute('data-persona')).toBe('pro');
  });

  it('escapes text content (no HTML injection)', () => {
    const root = mountInto();
    const evil = '<script>alert(1)</script>';
    render(<Heading text={evil} persona="standard" />, root);
    const h1 = root.querySelector('h1');
    expect(h1?.querySelector('script')).toBeNull();
    expect(h1?.textContent).toBe(evil);
  });
});
