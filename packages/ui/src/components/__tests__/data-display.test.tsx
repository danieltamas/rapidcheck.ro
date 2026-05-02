import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { TableShell, TableHead, TableBody, TableRow, TableCell, TableSortHeader } from '../Table.js';
import { ActionList, DefinitionList, List } from '../List.js';
import { Badge } from '../Badge.js';
import { Avatar } from '../Avatar.js';
import { StatusIndicator } from '../StatusIndicator.js';
import { Divider } from '../Divider.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('TableShell composition API', () => {
  it('renders shell + head + body + cells', () => {
    const root = mountInto();
    render(
      <TableShell sticky>
        <TableHead>
          <TableRow>
            <TableCell header>Anul</TableCell>
            <TableCell header align="right">
              Suma
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>2024</TableCell>
            <TableCell align="right">1500</TableCell>
          </TableRow>
        </TableBody>
      </TableShell>,
      root,
    );
    expect(root.querySelector('.onegov-table--sticky')).not.toBeNull();
    expect(root.querySelectorAll('th').length).toBe(2);
    expect(root.querySelectorAll('td').length).toBe(2);
  });

  it('SortHeader renders aria-sort and triggers callback', () => {
    const root = mountInto();
    let count = 0;
    render(
      <TableShell>
        <TableHead>
          <TableRow>
            <TableSortHeader label="Year" direction="asc" onSort={() => count++} />
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </TableShell>,
      root,
    );
    expect(root.querySelector('[aria-sort="ascending"]')).not.toBeNull();
    (root.querySelector('.onegov-table__sort') as HTMLButtonElement).click();
    expect(count).toBe(1);
  });
});

describe('List variants', () => {
  it('renders a divided list with the divided class', () => {
    const root = mountInto();
    render(<List items={['a', 'b']} variant="divided" />, root);
    expect(root.querySelector('.onegov-list--divided')).not.toBeNull();
  });
});

describe('ActionList', () => {
  it('renders a button row when no href', () => {
    const root = mountInto();
    let clicked = '';
    render(
      <ActionList
        items={[
          { id: 'a', label: 'A', onClick: () => (clicked = 'A') },
          { id: 'b', label: 'B', href: '/b' },
        ]}
      />,
      root,
    );
    expect(root.querySelectorAll('.onegov-list-action__row').length).toBe(2);
    expect(root.querySelectorAll('button.onegov-list-action__row').length).toBe(1);
    expect(root.querySelectorAll('a.onegov-list-action__row').length).toBe(1);
    (root.querySelector('button.onegov-list-action__row') as HTMLButtonElement).click();
    expect(clicked).toBe('A');
  });
});

describe('DefinitionList', () => {
  it('renders dt/dd pairs', () => {
    const root = mountInto();
    render(
      <DefinitionList
        items={[
          { term: 'CUI', description: '14841555' },
          { term: 'Stare', description: 'activ' },
        ]}
      />,
      root,
    );
    expect(root.querySelectorAll('dt').length).toBe(2);
    expect(root.querySelectorAll('dd').length).toBe(2);
  });
});

describe('Badge', () => {
  it('applies tone + size classes', () => {
    const root = mountInto();
    render(
      <Badge tone="success" size="lg">
        ok
      </Badge>,
      root,
    );
    expect(root.querySelector('.onegov-badge--success')).not.toBeNull();
    expect(root.querySelector('.onegov-badge--lg')).not.toBeNull();
  });

  it('applies the pill class', () => {
    const root = mountInto();
    render(<Badge pill>x</Badge>, root);
    expect(root.querySelector('.onegov-badge--pill')).not.toBeNull();
  });
});

describe('Avatar', () => {
  it('renders an img when src is provided', () => {
    const root = mountInto();
    render(<Avatar src="/me.jpg" alt="me" />, root);
    expect((root.querySelector('img') as HTMLImageElement).getAttribute('src')).toBe('/me.jpg');
  });

  it('renders initials from name when no src', () => {
    const root = mountInto();
    render(<Avatar name="Daniel Tamas" />, root);
    expect(root.querySelector('span > span')?.textContent).toBe('DT');
  });

  it('applies size variants', () => {
    const root = mountInto();
    render(<Avatar name="X" size="lg" />, root);
    expect(root.querySelector('.onegov-avatar--lg')).not.toBeNull();
  });
});

describe('StatusIndicator', () => {
  it('renders dot + label', () => {
    const root = mountInto();
    render(<StatusIndicator tone="success" label="Online" />, root);
    expect(root.querySelector('.onegov-status--success')).not.toBeNull();
    expect(root.querySelector('.onegov-status__dot')).not.toBeNull();
    expect(root.textContent).toContain('Online');
  });

  it('applies pulse class when pulse=true', () => {
    const root = mountInto();
    render(<StatusIndicator pulse />, root);
    expect(root.querySelector('.onegov-status--pulse')).not.toBeNull();
  });
});

describe('Divider', () => {
  it('renders an <hr> by default', () => {
    const root = mountInto();
    render(<Divider />, root);
    expect(root.querySelector('hr')).not.toBeNull();
  });

  it('renders a vertical separator when orientation=vertical', () => {
    const root = mountInto();
    render(<Divider orientation="vertical" />, root);
    expect(root.querySelector('[role="separator"]')?.getAttribute('aria-orientation')).toBe(
      'vertical',
    );
  });
});
