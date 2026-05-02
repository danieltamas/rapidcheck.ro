import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Paragraph } from '../Paragraph.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Paragraph', () => {
  it('renders a <p> with the given text', () => {
    const root = mountInto();
    render(<Paragraph text="Salut" persona="standard" />, root);
    expect(root.querySelector('p')?.textContent).toBe('Salut');
  });

  it('omits the muted class by default', () => {
    const root = mountInto();
    render(<Paragraph text="x" persona="standard" />, root);
    expect(root.querySelector('p')?.getAttribute('class')).not.toContain('--muted');
  });

  it('adds the muted class when muted=true', () => {
    const root = mountInto();
    render(<Paragraph text="x" persona="standard" muted />, root);
    expect(root.querySelector('p')?.getAttribute('class')).toContain('onegov-p--muted');
  });

  it('adds the pensioner variant class for pensioner persona', () => {
    const root = mountInto();
    render(<Paragraph text="x" persona="pensioner" />, root);
    expect(root.querySelector('p')?.getAttribute('class')).toContain('onegov-p--pensioner');
  });

  it('escapes text (no HTML injection)', () => {
    const root = mountInto();
    render(<Paragraph text="<img src=x onerror=alert(1)>" persona="standard" />, root);
    expect(root.querySelector('img')).toBeNull();
  });

  it('reflects persona in data-persona', () => {
    const root = mountInto();
    render(<Paragraph text="x" persona="journalist" />, root);
    expect(root.querySelector('p')?.getAttribute('data-persona')).toBe('journalist');
  });
});
