import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Spinner } from '../Spinner.js';
import { ProgressBar } from '../ProgressBar.js';
import { Skeleton, SkeletonText } from '../Skeleton.js';
import { Alert } from '../Alert.js';
import { EmptyState } from '../EmptyState.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Spinner', () => {
  it('renders with role=status and a hidden label', () => {
    const root = mountInto();
    render(<Spinner />, root);
    expect(root.querySelector('[role="status"]')).not.toBeNull();
    expect(root.textContent).toContain('Se încarcă');
  });

  it('applies size variant class', () => {
    const root = mountInto();
    render(<Spinner size="lg" />, root);
    expect(root.querySelector('.onegov-spinner--lg')).not.toBeNull();
  });
});

describe('ProgressBar', () => {
  it('renders determinate with aria-valuenow', () => {
    const root = mountInto();
    render(<ProgressBar value={42} />, root);
    expect(root.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('42');
  });

  it('clamps value to 0–100', () => {
    const root = mountInto();
    render(<ProgressBar value={150} />, root);
    expect(root.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
  });

  it('renders indeterminate without aria-valuenow when value omitted', () => {
    const root = mountInto();
    render(<ProgressBar />, root);
    expect(root.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe(null);
    expect(root.querySelector('.onegov-progress--indeterminate')).not.toBeNull();
  });
});

describe('Skeleton', () => {
  it('renders with onegov-skeleton class', () => {
    const root = mountInto();
    render(<Skeleton width="200px" height="32px" />, root);
    expect(root.querySelector('.onegov-skeleton')).not.toBeNull();
  });

  it('applies circle variant', () => {
    const root = mountInto();
    render(<Skeleton variant="circle" width="40px" height="40px" />, root);
    expect(root.querySelector('.onegov-skeleton--circle')).not.toBeNull();
  });
});

describe('SkeletonText', () => {
  it('renders the requested number of lines', () => {
    const root = mountInto();
    render(<SkeletonText lines={5} />, root);
    expect(root.querySelectorAll('.onegov-skeleton').length).toBe(5);
  });
});

describe('Alert', () => {
  it('uses role=alert for danger and warning', () => {
    const root = mountInto();
    render(<Alert tone="danger">x</Alert>, root);
    expect(root.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('uses role=status for info and success', () => {
    const root = mountInto();
    render(<Alert tone="success">x</Alert>, root);
    expect(root.querySelector('[role="status"]')).not.toBeNull();
  });

  it('renders close button when onClose supplied', () => {
    const root = mountInto();
    let closed = false;
    render(<Alert onClose={() => (closed = true)}>x</Alert>, root);
    (root.querySelector('.onegov-alert__close') as HTMLButtonElement).click();
    expect(closed).toBe(true);
  });
});

describe('EmptyState', () => {
  it('renders illustration + title + description + action', () => {
    const root = mountInto();
    render(
      <EmptyState
        title="No results"
        description="Try a different search term"
        action={<button>Reset</button>}
      />,
      root,
    );
    expect(root.querySelector('.onegov-empty__title')?.textContent).toBe('No results');
    expect(root.querySelector('.onegov-empty__description')?.textContent).toBe(
      'Try a different search term',
    );
    expect(root.querySelector('button')?.textContent).toBe('Reset');
  });
});
