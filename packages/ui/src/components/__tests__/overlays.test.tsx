import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Modal } from '../Modal.js';
import { Popover } from '../Popover.js';
import { Tooltip } from '../Tooltip.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Modal', () => {
  it('renders nothing when closed', () => {
    const root = mountInto();
    render(
      <Modal open={false} onClose={() => {}} title="t">
        body
      </Modal>,
      root,
    );
    expect(root.querySelector('.onegov-modal')).toBeNull();
  });

  it('renders dialog with role + aria-modal when open', () => {
    const root = mountInto();
    render(
      <Modal open onClose={() => {}} title="Hello">
        body
      </Modal>,
      root,
    );
    const dialog = root.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(root.querySelector('.onegov-modal__title')?.textContent).toBe('Hello');
  });

  it('clicking the close button calls onClose', () => {
    const root = mountInto();
    let closed = false;
    render(
      <Modal open onClose={() => (closed = true)} title="x">
        body
      </Modal>,
      root,
    );
    (root.querySelector('.onegov-modal__close') as HTMLButtonElement).click();
    expect(closed).toBe(true);
  });

  it('clicking the backdrop calls onClose', () => {
    const root = mountInto();
    let closed = false;
    render(
      <Modal open onClose={() => (closed = true)}>
        body
      </Modal>,
      root,
    );
    const backdrop = root.querySelector('.onegov-modal-backdrop') as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    // happy-dom dispatches with target=backdrop. Our handler expects target===currentTarget.
    expect(closed).toBe(true);
  });

  it('respects noBackdropClose', () => {
    const root = mountInto();
    let closed = false;
    render(
      <Modal open onClose={() => (closed = true)} noBackdropClose>
        body
      </Modal>,
      root,
    );
    const backdrop = root.querySelector('.onegov-modal-backdrop') as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(closed).toBe(false);
  });

  it('applies the size variant class', () => {
    const root = mountInto();
    render(
      <Modal open onClose={() => {}} size="lg">
        body
      </Modal>,
      root,
    );
    expect(root.querySelector('.onegov-modal--lg')).not.toBeNull();
  });

  it('renders a footer slot when supplied', () => {
    const root = mountInto();
    render(
      <Modal open onClose={() => {}} footer={<button>OK</button>}>
        body
      </Modal>,
      root,
    );
    expect(root.querySelector('.onegov-modal__footer button')?.textContent).toBe('OK');
  });

  it('applies danger tone affordance when requested', () => {
    const root = mountInto();
    render(
      <Modal open onClose={() => {}} title="Problem" tone="danger">
        body
      </Modal>,
      root,
    );
    expect(root.querySelector('.onegov-modal--danger')).not.toBeNull();
    expect(root.querySelector('.onegov-modal__status')?.textContent).toBe('!');
    expect(root.querySelector('[role="dialog"]')?.getAttribute('data-tone')).toBe('danger');
  });

  it('maps error boolean to error tone', () => {
    const root = mountInto();
    render(
      <Modal open onClose={() => {}} error>
        body
      </Modal>,
      root,
    );
    expect(root.querySelector('.onegov-modal--error')).not.toBeNull();
    expect(root.querySelector('[role="dialog"]')?.getAttribute('data-tone')).toBe('error');
  });
});

describe('Popover', () => {
  it('renders the trigger', () => {
    const root = mountInto();
    render(
      <Popover trigger={<span>open</span>}>content</Popover>,
      root,
    );
    expect(root.querySelector('[role="button"]')?.textContent).toBe('open');
  });

  it('renders the popover content when defaultOpen', () => {
    const root = mountInto();
    render(
      <Popover trigger={<span>open</span>} defaultOpen>
        panel content
      </Popover>,
      root,
    );
    expect(root.querySelector('.onegov-popover')?.textContent).toBe('panel content');
  });
});

describe('Tooltip', () => {
  it('renders trigger + tooltip side-by-side with role=tooltip', () => {
    const root = mountInto();
    render(
      <Tooltip text="hint" position="bottom">
        <button>trigger</button>
      </Tooltip>,
      root,
    );
    expect(root.querySelector('button')?.textContent).toBe('trigger');
    expect(root.querySelector('[role="tooltip"]')?.textContent).toBe('hint');
    expect(root.querySelector('.onegov-tooltip--bottom')).not.toBeNull();
  });
});
