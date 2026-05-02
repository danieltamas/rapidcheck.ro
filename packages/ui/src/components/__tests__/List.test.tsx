import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { List } from '../List.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('List', () => {
  it('renders an unordered list by default', () => {
    const root = mountInto();
    render(<List items={['a', 'b']} persona="standard" />, root);
    expect(root.querySelector('ul')).not.toBeNull();
    expect(root.querySelector('ol')).toBeNull();
  });

  it('renders an ordered list when ordered=true', () => {
    const root = mountInto();
    render(<List items={['a']} ordered persona="standard" />, root);
    expect(root.querySelector('ol')).not.toBeNull();
  });

  it('renders one <li> per item', () => {
    const root = mountInto();
    render(<List items={['a', 'b', 'c']} persona="standard" />, root);
    expect(root.querySelectorAll('li').length).toBe(3);
  });

  it('tolerates empty items', () => {
    const root = mountInto();
    render(<List items={[]} persona="standard" />, root);
    expect(root.querySelector('ul')).not.toBeNull();
    expect(root.querySelectorAll('li').length).toBe(0);
  });

  it('adds pensioner class when persona=pensioner', () => {
    const root = mountInto();
    render(<List items={['a']} persona="pensioner" />, root);
    expect(root.querySelector('ul')?.getAttribute('class')).toContain('onegov-list--pensioner');
  });

  it('escapes item text', () => {
    const root = mountInto();
    render(<List items={['<b>x</b>']} persona="standard" />, root);
    expect(root.querySelector('li b')).toBeNull();
    expect(root.querySelector('li')?.textContent).toBe('<b>x</b>');
  });
});
