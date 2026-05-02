import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Card, CardHeader, CardBody, CardFooter, CardMedia } from '../Card.js';
import { Panel } from '../Panel.js';
import { Box } from '../Box.js';
import { Callout } from '../Callout.js';
import { Banner } from '../Banner.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Card — extended variants', () => {
  it('applies the premium variant class', () => {
    const root = mountInto();
    render(<Card variant="premium">x</Card>, root);
    expect(root.querySelector('.onegov-card--premium')).not.toBeNull();
  });

  it('applies the interactive variant class', () => {
    const root = mountInto();
    render(<Card variant="interactive">x</Card>, root);
    expect(root.querySelector('.onegov-card--interactive')).not.toBeNull();
  });

  it('renders header / body / footer slots', () => {
    const root = mountInto();
    render(
      <Card variant="premium">
        <CardHeader>head</CardHeader>
        <CardBody>body</CardBody>
        <CardFooter>foot</CardFooter>
      </Card>,
      root,
    );
    expect(root.querySelector('.onegov-card__header')?.textContent).toBe('head');
    expect(root.querySelector('.onegov-card__body')?.textContent).toBe('body');
    expect(root.querySelector('.onegov-card__footer')?.textContent).toBe('foot');
  });

  it('renders CardMedia as img when src provided', () => {
    const root = mountInto();
    render(
      <Card variant="media">
        <CardMedia src="/img.png" alt="alt" />
        <CardBody>body</CardBody>
      </Card>,
      root,
    );
    expect((root.querySelector('img') as HTMLImageElement).getAttribute('src')).toBe('/img.png');
  });
});

describe('Panel', () => {
  it('renders header + body + footer slots', () => {
    const root = mountInto();
    render(
      <Panel header="head" footer="foot">
        body
      </Panel>,
      root,
    );
    expect(root.querySelector('.onegov-panel__header')?.textContent).toBe('head');
    expect(root.querySelector('.onegov-panel__body')?.textContent).toBe('body');
    expect(root.querySelector('.onegov-panel__footer')?.textContent).toBe('foot');
  });

  it('applies the elevated variant', () => {
    const root = mountInto();
    render(<Panel variant="elevated">x</Panel>, root);
    expect(root.querySelector('.onegov-panel--elevated')).not.toBeNull();
  });
});

describe('Box', () => {
  it('renders default with onegov-box class', () => {
    const root = mountInto();
    render(<Box>x</Box>, root);
    expect(root.querySelector('.onegov-box')).not.toBeNull();
  });

  it('applies the surface variant class', () => {
    const root = mountInto();
    render(<Box variant="surface">x</Box>, root);
    expect(root.querySelector('.onegov-box--surface')).not.toBeNull();
  });
});

describe('Callout', () => {
  it('renders the default info tone with role=status', () => {
    const root = mountInto();
    render(<Callout title="t">body</Callout>, root);
    expect(root.querySelector('.onegov-callout--info')).not.toBeNull();
    expect(root.querySelector('.onegov-callout')?.getAttribute('role')).toBe('status');
  });

  it('uses role=alert for danger tone', () => {
    const root = mountInto();
    render(<Callout tone="danger">body</Callout>, root);
    expect(root.querySelector('.onegov-callout')?.getAttribute('role')).toBe('alert');
  });
});

describe('Banner', () => {
  it('renders without close button when no onClose', () => {
    const root = mountInto();
    render(<Banner>announcement</Banner>, root);
    expect(root.querySelector('.onegov-banner__close')).toBeNull();
  });

  it('renders close button when onClose supplied', () => {
    const root = mountInto();
    let closed = false;
    render(<Banner onClose={() => (closed = true)}>x</Banner>, root);
    (root.querySelector('.onegov-banner__close') as HTMLButtonElement).click();
    expect(closed).toBe(true);
  });

  it('uses Romanian default close label', () => {
    const root = mountInto();
    render(<Banner onClose={() => {}}>x</Banner>, root);
    expect(root.querySelector('.onegov-banner__close')?.getAttribute('aria-label')).toBe('Închide');
  });

  it('applies the warning variant class', () => {
    const root = mountInto();
    render(<Banner tone="warning">x</Banner>, root);
    expect(root.querySelector('.onegov-banner--warning')).not.toBeNull();
  });
});
