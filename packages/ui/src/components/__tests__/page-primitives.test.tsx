import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Hero } from '../Hero.js';
import { CardGrid } from '../CardGrid.js';
import { SearchBox } from '../SearchBox.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Hero', () => {
  it('renders title + description + actions', () => {
    const root = mountInto();
    render(
      <Hero
        eyebrow="Section"
        title="Welcome"
        description="Pitch line"
        actions={<button>Get started</button>}
      />,
      root,
    );
    expect(root.querySelector('.onegov-hero__eyebrow')?.textContent).toBe('Section');
    expect(root.querySelector('.onegov-hero__title')?.textContent).toBe('Welcome');
    expect(root.querySelector('.onegov-hero__description')?.textContent).toBe('Pitch line');
    expect(root.querySelector('.onegov-hero__actions button')?.textContent).toBe('Get started');
  });

  it('applies the centered modifier', () => {
    const root = mountInto();
    render(<Hero title="x" centered />, root);
    expect(root.querySelector('.onegov-hero--center')).not.toBeNull();
  });
});

describe('CardGrid', () => {
  it('renders the requested children', () => {
    const root = mountInto();
    render(
      <CardGrid cols={2}>
        <div>a</div>
        <div>b</div>
      </CardGrid>,
      root,
    );
    expect(root.querySelector('.onegov-cardgrid--cols-2')).not.toBeNull();
    expect(root.querySelectorAll('.onegov-cardgrid > div').length).toBe(2);
  });

  it('progressive cols class chain', () => {
    const root = mountInto();
    render(
      <CardGrid cols={4}>
        <div>x</div>
      </CardGrid>,
      root,
    );
    const grid = root.querySelector('.onegov-cardgrid') as HTMLElement;
    expect(grid.classList.contains('onegov-cardgrid--cols-2')).toBe(true);
    expect(grid.classList.contains('onegov-cardgrid--cols-3')).toBe(true);
    expect(grid.classList.contains('onegov-cardgrid--cols-4')).toBe(true);
  });
});

describe('SearchBox', () => {
  it('renders form with role=search', () => {
    const root = mountInto();
    render(<SearchBox value="" onValueChange={() => {}} />, root);
    expect(root.querySelector('[role="search"]')).not.toBeNull();
  });

  it('renders submit button when onSubmit provided', () => {
    const root = mountInto();
    render(<SearchBox value="" onValueChange={() => {}} onSubmit={() => {}} />, root);
    expect(root.querySelector('button[type="submit"]')).not.toBeNull();
  });

  it('uses the Romanian default placeholder', () => {
    const root = mountInto();
    render(<SearchBox value="" onValueChange={() => {}} />, root);
    expect(
      (root.querySelector('input[type="search"]') as HTMLInputElement)?.getAttribute('placeholder'),
    ).toBe('Caută...');
  });
});
