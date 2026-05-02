import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Stack } from '../Stack.js';
import { Cluster } from '../Cluster.js';
import { Inline } from '../Inline.js';
import { Container } from '../Container.js';
import { AppShell } from '../AppShell.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Stack', () => {
  it('renders children with default md gap class', () => {
    const root = mountInto();
    render(
      <Stack>
        <span>a</span>
        <span>b</span>
      </Stack>,
      root,
    );
    const node = root.querySelector('.onegov-stack') as HTMLElement;
    expect(node).not.toBeNull();
    expect(node.classList.contains('onegov-stack--md')).toBe(true);
    expect(node.children.length).toBe(2);
  });

  it('applies the gap variant class', () => {
    const root = mountInto();
    render(<Stack gap="xl">x</Stack>, root);
    expect(root.querySelector('.onegov-stack--xl')).not.toBeNull();
  });

  it('applies the alignment class', () => {
    const root = mountInto();
    render(<Stack align="center">x</Stack>, root);
    expect(root.querySelector('.onegov-stack--align-center')).not.toBeNull();
  });

  it('forwards a custom class on the root', () => {
    const root = mountInto();
    render(<Stack class="custom">x</Stack>, root);
    expect((root.querySelector('.onegov-stack') as HTMLElement).classList.contains('custom')).toBe(
      true,
    );
  });
});

describe('Cluster', () => {
  it('renders with default md gap and no justify', () => {
    const root = mountInto();
    render(
      <Cluster>
        <span>a</span>
      </Cluster>,
      root,
    );
    const node = root.querySelector('.onegov-cluster') as HTMLElement;
    expect(node.classList.contains('onegov-cluster--md')).toBe(true);
  });

  it('applies justify variant when supplied', () => {
    const root = mountInto();
    render(<Cluster justify="between">x</Cluster>, root);
    expect(root.querySelector('.onegov-cluster--justify-between')).not.toBeNull();
  });
});

describe('Inline', () => {
  it('renders an inline-flex span', () => {
    const root = mountInto();
    render(<Inline>x</Inline>, root);
    const node = root.querySelector('.onegov-inline') as HTMLElement;
    expect(node.tagName.toLowerCase()).toBe('span');
  });
});

describe('Container', () => {
  it('renders with the default xl width', () => {
    const root = mountInto();
    render(<Container>x</Container>, root);
    expect(root.querySelector('.onegov-container--xl')).not.toBeNull();
  });

  it('applies the supplied width', () => {
    const root = mountInto();
    render(<Container width="md">x</Container>, root);
    expect(root.querySelector('.onegov-container--md')).not.toBeNull();
  });
});

describe('AppShell', () => {
  it('renders main only when no header/footer/aside', () => {
    const root = mountInto();
    render(<AppShell>body</AppShell>, root);
    expect(root.querySelector('.onegov-shell-v2__main')).not.toBeNull();
    expect(root.querySelector('.onegov-shell-v2__header')).toBeNull();
    expect(root.querySelector('.onegov-shell-v2__footer')).toBeNull();
    expect(root.querySelector('.onegov-shell-v2__aside')).toBeNull();
  });

  it('renders header / footer / aside slots when provided', () => {
    const root = mountInto();
    render(
      <AppShell header={<span>H</span>} footer={<span>F</span>} aside={<span>A</span>}>
        body
      </AppShell>,
      root,
    );
    expect(root.querySelector('.onegov-shell-v2__header')).not.toBeNull();
    expect(root.querySelector('.onegov-shell-v2__footer')).not.toBeNull();
    expect(root.querySelector('.onegov-shell-v2__aside')).not.toBeNull();
    expect(root.querySelector('.onegov-shell-v2--with-aside')).not.toBeNull();
  });

  it('adds sticky class when stickyHeader is true', () => {
    const root = mountInto();
    render(
      <AppShell header={<span>H</span>} stickyHeader>
        body
      </AppShell>,
      root,
    );
    expect(root.querySelector('.onegov-shell-v2__sticky-header')).not.toBeNull();
  });
});
