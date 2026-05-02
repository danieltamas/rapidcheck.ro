import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Card } from '../Card.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Card', () => {
  it('renders a <section> with children', () => {
    const root = mountInto();
    render(
      <Card persona="standard">
        <p>inside</p>
      </Card>,
      root,
    );
    expect(root.querySelector('section')).not.toBeNull();
    expect(root.querySelector('section p')?.textContent).toBe('inside');
  });

  it('renders the title as <h3> when provided', () => {
    const root = mountInto();
    render(
      <Card title="Despre" persona="standard">
        <p>x</p>
      </Card>,
      root,
    );
    expect(root.querySelector('h3.onegov-card__title')?.textContent).toBe('Despre');
  });

  it('omits the title element when title is missing', () => {
    const root = mountInto();
    render(
      <Card persona="standard">
        <p>x</p>
      </Card>,
      root,
    );
    expect(root.querySelector('h3.onegov-card__title')).toBeNull();
  });

  it('adds the pensioner variant class for pensioner persona', () => {
    const root = mountInto();
    render(
      <Card persona="pensioner">
        <p>x</p>
      </Card>,
      root,
    );
    expect(root.querySelector('section')?.getAttribute('class')).toContain('--pensioner');
  });

  it('escapes the title text', () => {
    const root = mountInto();
    render(
      <Card title="<b>boom</b>" persona="standard">
        <p>x</p>
      </Card>,
      root,
    );
    expect(root.querySelector('h3 b')).toBeNull();
  });
});
