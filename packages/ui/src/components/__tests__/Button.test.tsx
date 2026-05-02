import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Button } from '../Button.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Button', () => {
  it('renders a <button type="button"> with the given label', () => {
    const root = mountInto();
    render(<Button label="Click" onClick={() => {}} persona="standard" />, root);
    const btn = root.querySelector('button');
    expect(btn).not.toBeNull();
    expect(btn?.getAttribute('type')).toBe('button');
    expect(btn?.textContent).toBe('Click');
  });

  it('fires onClick when clicked', () => {
    const root = mountInto();
    let count = 0;
    render(
      <Button label="Inc" onClick={() => (count += 1)} persona="standard" />,
      root,
    );
    (root.querySelector('button') as HTMLButtonElement).click();
    expect(count).toBe(1);
  });

  it('applies the secondary variant class', () => {
    const root = mountInto();
    render(
      <Button label="x" onClick={() => {}} persona="standard" variant="secondary" />,
      root,
    );
    const cls = root.querySelector('button')?.getAttribute('class') ?? '';
    expect(cls).toContain('onegov-button--secondary');
  });

  it('reflects variant via data-variant', () => {
    const root = mountInto();
    render(
      <Button label="x" onClick={() => {}} persona="standard" variant="secondary" />,
      root,
    );
    expect(root.querySelector('button')?.getAttribute('data-variant')).toBe('secondary');
  });

  it('applies pensioner persona class', () => {
    const root = mountInto();
    render(<Button label="x" onClick={() => {}} persona="pensioner" />, root);
    expect(root.querySelector('button')?.getAttribute('class')).toContain('--pensioner');
  });

  it('honours disabled', () => {
    const root = mountInto();
    let count = 0;
    render(
      <Button label="x" onClick={() => (count += 1)} persona="standard" disabled />,
      root,
    );
    const btn = root.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    btn.click();
    expect(count).toBe(0);
  });

  it('escapes label text', () => {
    const root = mountInto();
    render(
      <Button label="<script>x</script>" onClick={() => {}} persona="standard" />,
      root,
    );
    expect(root.querySelector('button script')).toBeNull();
  });
});
