import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Heading } from '../Heading.js';
import { Paragraph } from '../Paragraph.js';
import { Text } from '../Text.js';
import { Kbd } from '../Kbd.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Heading — extended', () => {
  it('renders levels 4 / 5 / 6 with the matching tag', () => {
    const root = mountInto();
    render(<Heading level={4} text="four" />, root);
    expect(root.querySelector('h4')).not.toBeNull();
    render(<Heading level={5} text="five" />, root);
    expect(root.querySelector('h5')).not.toBeNull();
    render(<Heading level={6} text="six" />, root);
    expect(root.querySelector('h6')).not.toBeNull();
  });

  it('applies the display variant class', () => {
    const root = mountInto();
    render(<Heading level={1} text="big" display />, root);
    expect((root.querySelector('h1') as HTMLElement).classList.contains('onegov-h--display')).toBe(
      true,
    );
  });

  it('renders eyebrow and subtitle when provided', () => {
    const root = mountInto();
    render(<Heading text="Title" eyebrow="Section" subtitle="The pitch" />, root);
    expect(root.querySelector('.onegov-eyebrow')?.textContent).toBe('Section');
    expect(root.querySelector('.onegov-subtitle')?.textContent).toBe('The pitch');
  });

  it('accepts children in place of text prop', () => {
    const root = mountInto();
    render(<Heading level={2}>composed</Heading>, root);
    expect(root.querySelector('h2')?.textContent).toBe('composed');
  });

  it('forwards a custom class', () => {
    const root = mountInto();
    render(<Heading text="x" class="hero-heading" />, root);
    expect((root.querySelector('h1') as HTMLElement).classList.contains('hero-heading')).toBe(true);
  });
});

describe('Paragraph — variants', () => {
  it('applies the lead variant class', () => {
    const root = mountInto();
    render(<Paragraph text="big lede" variant="lead" />, root);
    expect(root.querySelector('.onegov-p--lead')).not.toBeNull();
  });

  it('renders children when no text prop is supplied', () => {
    const root = mountInto();
    render(<Paragraph>composed</Paragraph>, root);
    expect(root.querySelector('p')?.textContent).toBe('composed');
  });

  it('forwards a custom class', () => {
    const root = mountInto();
    render(<Paragraph text="x" class="lede" />, root);
    expect((root.querySelector('p') as HTMLElement).classList.contains('lede')).toBe(true);
  });
});

describe('Text', () => {
  it('renders a span', () => {
    const root = mountInto();
    render(<Text>label</Text>, root);
    expect(root.querySelector('span')?.textContent).toBe('label');
  });

  it('applies size, weight and tone via inline style', () => {
    const root = mountInto();
    render(
      <Text size="lg" weight="bold" tone="primary">
        x
      </Text>,
      root,
    );
    const style = (root.querySelector('span') as HTMLElement).getAttribute('style') ?? '';
    expect(style).toContain('font-size');
    expect(style).toContain('font-weight');
    expect(style).toContain('color');
  });

  it('applies truncation styles', () => {
    const root = mountInto();
    render(<Text truncate>very long</Text>, root);
    const style = (root.querySelector('span') as HTMLElement).getAttribute('style') ?? '';
    expect(style).toContain('text-overflow');
  });
});

describe('Kbd', () => {
  it('renders a <kbd> with the hint class', () => {
    const root = mountInto();
    render(<Kbd>⌘K</Kbd>, root);
    const node = root.querySelector('kbd') as HTMLElement;
    expect(node).not.toBeNull();
    expect(node.classList.contains('onegov-kbd-hint')).toBe(true);
    expect(node.textContent).toBe('⌘K');
  });
});
