import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Accordion } from '../Accordion.js';
import { Tabs } from '../Tabs.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Accordion', () => {
  const items = [
    { id: 'a', title: 'A', content: 'aaa' },
    { id: 'b', title: 'B', content: 'bbb' },
  ];

  it('renders one trigger per item', () => {
    const root = mountInto();
    render(<Accordion items={items} />, root);
    expect(root.querySelectorAll('.onegov-accordion-item__trigger').length).toBe(2);
  });

  it('starts closed by default', () => {
    const root = mountInto();
    render(<Accordion items={items} />, root);
    expect(root.querySelector('.onegov-accordion-item__panel')).toBeNull();
  });

  it('opens defaultOpen items', () => {
    const root = mountInto();
    render(<Accordion items={items} defaultOpen={['a']} />, root);
    expect(root.querySelector('.onegov-accordion-item__panel')?.textContent).toBe('aaa');
  });

  it('clicking a trigger expands it', async () => {
    const root = mountInto();
    render(<Accordion items={items} />, root);
    const trig = root.querySelectorAll<HTMLButtonElement>('.onegov-accordion-item__trigger');
    trig[0]?.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector('.onegov-accordion-item--open')).not.toBeNull();
    expect(
      root
        .querySelectorAll<HTMLButtonElement>('.onegov-accordion-item__trigger')[0]
        ?.getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('single-mode closes others when one opens', async () => {
    const root = mountInto();
    render(<Accordion items={items} defaultOpen={['a']} />, root);
    const trig = root.querySelectorAll<HTMLButtonElement>('.onegov-accordion-item__trigger');
    trig[1]?.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelectorAll('.onegov-accordion-item--open').length).toBe(1);
  });

  it('multiple-mode allows several open at once', async () => {
    const root = mountInto();
    render(<Accordion items={items} multiple defaultOpen={['a']} />, root);
    const trig = root.querySelectorAll<HTMLButtonElement>('.onegov-accordion-item__trigger');
    trig[1]?.click();
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelectorAll('.onegov-accordion-item--open').length).toBe(2);
  });
});

describe('Tabs', () => {
  const tabs = [
    { id: 'home', label: 'Home', content: 'home content' },
    { id: 'about', label: 'About', content: 'about content' },
  ];

  it('renders tablist + active panel', () => {
    const root = mountInto();
    render(<Tabs tabs={tabs} value="home" onChange={() => {}} />, root);
    expect(root.querySelector('[role="tablist"]')).not.toBeNull();
    expect(root.querySelectorAll('[role="tab"]').length).toBe(2);
    expect(root.querySelector('[role="tabpanel"]')?.textContent).toBe('home content');
  });

  it('marks the active tab as selected', () => {
    const root = mountInto();
    render(<Tabs tabs={tabs} value="about" onChange={() => {}} />, root);
    const tabs2 = root.querySelectorAll('[role="tab"]');
    expect(tabs2[0]?.getAttribute('aria-selected')).toBe('false');
    expect(tabs2[1]?.getAttribute('aria-selected')).toBe('true');
  });

  it('clicking a tab calls onChange with its id', () => {
    const root = mountInto();
    let picked = '';
    render(<Tabs tabs={tabs} value="home" onChange={(id) => (picked = id)} />, root);
    (root.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1] as HTMLButtonElement).click();
    expect(picked).toBe('about');
  });

  it('does not call onChange for disabled tabs', () => {
    const root = mountInto();
    let picked = '';
    render(
      <Tabs
        tabs={[tabs[0]!, { ...tabs[1]!, disabled: true }]}
        value="home"
        onChange={(id) => (picked = id)}
      />,
      root,
    );
    (root.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1] as HTMLButtonElement).click();
    expect(picked).toBe('');
  });

  it('applies vertical orientation class + aria-orientation', () => {
    const root = mountInto();
    render(<Tabs tabs={tabs} value="home" onChange={() => {}} orientation="vertical" />, root);
    expect(root.querySelector('.onegov-tabs--vertical')).not.toBeNull();
    expect(root.querySelector('[role="tablist"]')?.getAttribute('aria-orientation')).toBe(
      'vertical',
    );
  });
});
