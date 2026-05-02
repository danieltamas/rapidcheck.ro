import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Button } from '../Button.js';
import { Link } from '../Link.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Button — extended variants', () => {
  it('applies the ghost variant class', () => {
    const root = mountInto();
    render(<Button label="x" variant="ghost" />, root);
    expect(root.querySelector('.onegov-button--ghost')).not.toBeNull();
  });

  it('applies the danger variant class', () => {
    const root = mountInto();
    render(<Button label="x" variant="danger" />, root);
    expect(root.querySelector('.onegov-button--danger')).not.toBeNull();
  });

  it('applies the link variant class', () => {
    const root = mountInto();
    render(<Button label="x" variant="link" />, root);
    expect(root.querySelector('.onegov-button--link')).not.toBeNull();
  });

  it('applies size variants', () => {
    const root = mountInto();
    render(<Button label="x" size="sm" />, root);
    expect(root.querySelector('.onegov-button--sm')).not.toBeNull();
    render(<Button label="x" size="lg" />, root);
    expect(root.querySelector('.onegov-button--lg')).not.toBeNull();
  });

  it('applies fullWidth class', () => {
    const root = mountInto();
    render(<Button label="x" fullWidth />, root);
    expect(root.querySelector('.onegov-button--full')).not.toBeNull();
  });

  it('shows a spinner and disables clicking when loading', () => {
    const root = mountInto();
    let count = 0;
    render(<Button label="x" loading onClick={() => count++} />, root);
    expect(root.querySelector('.onegov-button__spinner')).not.toBeNull();
    expect((root.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
    (root.querySelector('button') as HTMLButtonElement).click();
    expect(count).toBe(0);
  });

  it('renders leading and trailing icons in non-loading state', () => {
    const root = mountInto();
    render(
      <Button
        label="x"
        leadingIcon={<span class="lead">L</span>}
        trailingIcon={<span class="trail">T</span>}
      />,
      root,
    );
    expect(root.querySelector('.lead')).not.toBeNull();
    expect(root.querySelector('.trail')).not.toBeNull();
  });

  it('accepts children in place of label', () => {
    const root = mountInto();
    render(<Button>Composed</Button>, root);
    expect(root.querySelector('button')?.textContent).toBe('Composed');
  });

  it('forwards a custom class', () => {
    const root = mountInto();
    render(<Button label="x" class="cta" />, root);
    expect((root.querySelector('button') as HTMLElement).classList.contains('cta')).toBe(true);
  });
});

describe('Link — extended variants', () => {
  it('applies the quiet variant class', () => {
    const root = mountInto();
    render(<Link href="https://anaf.ro/" text="x" variant="quiet" />, root);
    expect(root.querySelector('.onegov-link--quiet')).not.toBeNull();
  });

  it('respects the external prop overriding scheme detection', () => {
    const root = mountInto();
    render(<Link href="/local" text="x" external />, root);
    expect(root.querySelector('a')?.getAttribute('target')).toBe('_blank');
  });

  it('accepts children in place of text', () => {
    const root = mountInto();
    render(<Link href="https://anaf.ro/">Composed</Link>, root);
    expect(root.querySelector('a')?.textContent).toBe('Composed');
  });

  it('forwards a custom class', () => {
    const root = mountInto();
    render(<Link href="https://anaf.ro/" text="x" class="nav-link" />, root);
    expect((root.querySelector('a') as HTMLElement).classList.contains('nav-link')).toBe(true);
  });
});
