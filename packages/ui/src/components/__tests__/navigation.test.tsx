import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { TopNav } from '../TopNav.js';
import { SideNav } from '../SideNav.js';
import { Breadcrumb } from '../Breadcrumb.js';
import { Pagination } from '../Pagination.js';
import { Footer, FooterColumn } from '../Footer.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('TopNav', () => {
  it('renders brand + items', () => {
    const root = mountInto();
    render(
      <TopNav
        brand="onegov.ro"
        items={[
          { label: 'Home', href: '/', active: true },
          { label: 'About', href: '/about' },
        ]}
      />,
      root,
    );
    expect(root.querySelector('.onegov-topnav__brand')?.textContent).toBe('onegov.ro');
    expect(root.querySelectorAll('.onegov-topnav__item').length).toBe(2);
    expect(root.querySelector('.onegov-topnav__item--active')).not.toBeNull();
  });

  it('uses Romanian default toggle label', () => {
    const root = mountInto();
    render(<TopNav items={[]} />, root);
    expect(root.querySelector('.onegov-topnav__toggle')?.getAttribute('aria-label')).toBe('Meniu');
  });
});

describe('SideNav', () => {
  it('renders sections + items', () => {
    const root = mountInto();
    render(
      <SideNav
        sections={[
          {
            title: 'Cont',
            items: [
              { label: 'Profil', href: '/me', active: true },
              { label: 'Setări', href: '/settings' },
            ],
          },
        ]}
      />,
      root,
    );
    expect(root.querySelector('.onegov-sidenav__section-title')?.textContent).toBe('Cont');
    expect(root.querySelectorAll('.onegov-sidenav__item').length).toBe(2);
    expect(root.querySelector('.onegov-sidenav__item--active')).not.toBeNull();
  });
});

describe('Breadcrumb', () => {
  it('renders crumbs with separator and current item', () => {
    const root = mountInto();
    render(
      <Breadcrumb
        items={[
          { label: 'Acasă', href: '/' },
          { label: 'Servicii', href: '/services' },
          { label: 'Verificare CUI' },
        ]}
      />,
      root,
    );
    expect(root.querySelectorAll('.onegov-breadcrumb__item').length).toBe(3);
    expect(root.querySelector('.onegov-breadcrumb__item--current')?.textContent).toBe(
      'Verificare CUI',
    );
    // Two separators between three crumbs
    expect(root.querySelectorAll('.onegov-breadcrumb__sep').length).toBe(2);
  });
});

describe('Pagination', () => {
  it('renders page buttons + prev/next', () => {
    const root = mountInto();
    render(<Pagination current={3} total={10} onChange={() => {}} />, root);
    const buttons = root.querySelectorAll<HTMLButtonElement>('.onegov-pagination__btn');
    expect(buttons.length).toBeGreaterThan(2);
    expect(root.querySelector('[aria-current="page"]')?.textContent).toBe('3');
  });

  it('disables prev on first page', () => {
    const root = mountInto();
    render(<Pagination current={1} total={10} onChange={() => {}} />, root);
    expect(
      root.querySelectorAll<HTMLButtonElement>('.onegov-pagination__btn')[0]?.disabled,
    ).toBe(true);
  });

  it('clicking a number calls onChange', () => {
    const root = mountInto();
    let picked = -1;
    render(<Pagination current={3} total={5} onChange={(p) => (picked = p)} />, root);
    const fiveBtn = Array.from(
      root.querySelectorAll<HTMLButtonElement>('.onegov-pagination__btn'),
    ).find((b) => b.textContent === '5') as HTMLButtonElement | undefined;
    fiveBtn?.click();
    expect(picked).toBe(5);
  });

  it('renders ellipsis when range is wide', () => {
    const root = mountInto();
    render(<Pagination current={5} total={20} onChange={() => {}} />, root);
    expect(root.querySelectorAll('.onegov-pagination__ellipsis').length).toBeGreaterThan(0);
  });
});

describe('Footer', () => {
  it('renders columns + bottom slot', () => {
    const root = mountInto();
    render(
      <Footer bottom={<span>v0.1.0</span>}>
        <FooterColumn title="Despre">about</FooterColumn>
        <FooterColumn title="Resurse">resources</FooterColumn>
      </Footer>,
      root,
    );
    expect(root.querySelectorAll('.onegov-footer__col').length).toBe(2);
    expect(root.querySelector('.onegov-footer__bottom')?.textContent).toBe('v0.1.0');
  });
});
