import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Table } from '../Table.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Table', () => {
  it('renders headers in <th>', () => {
    const root = mountInto();
    render(<Table headers={['A', 'B']} rows={[]} persona="standard" />, root);
    const ths = root.querySelectorAll('th');
    expect(ths.length).toBe(2);
    expect(ths[0]?.textContent).toBe('A');
    expect(ths[1]?.textContent).toBe('B');
  });

  it('renders rows in <tr><td>', () => {
    const root = mountInto();
    render(
      <Table headers={['A']} rows={[['1'], ['2']]} persona="standard" />,
      root,
    );
    const trs = root.querySelectorAll('tbody tr');
    expect(trs.length).toBe(2);
    expect(trs[0]?.querySelectorAll('td')[0]?.textContent).toBe('1');
  });

  it('does NOT show CSV affordance for non-journalist personas', () => {
    const root = mountInto();
    render(<Table headers={['A']} rows={[['1']]} persona="standard" />, root);
    expect(root.querySelector('.onegov-table-tools')).toBeNull();
  });

  it('shows CSV affordance for journalist persona', () => {
    const root = mountInto();
    render(<Table headers={['A']} rows={[['1']]} persona="journalist" />, root);
    expect(root.querySelector('.onegov-table-tools')).not.toBeNull();
    expect(root.querySelector('.onegov-table-tools__action')).not.toBeNull();
  });

  it('tolerates empty rows', () => {
    const root = mountInto();
    render(<Table headers={[]} rows={[]} persona="standard" />, root);
    expect(root.querySelector('table')).not.toBeNull();
    expect(root.querySelector('thead')).toBeNull();
  });

  it('reflects journalist class on the table when persona=journalist', () => {
    const root = mountInto();
    render(<Table headers={['A']} rows={[['1']]} persona="journalist" />, root);
    expect(root.querySelector('table')?.getAttribute('class')).toContain(
      'onegov-table--journalist',
    );
  });

  it('escapes cell content', () => {
    const root = mountInto();
    render(
      <Table headers={['<h1>x</h1>']} rows={[['<script>y</script>']]} persona="standard" />,
      root,
    );
    expect(root.querySelector('th h1')).toBeNull();
    expect(root.querySelector('td script')).toBeNull();
    expect(root.querySelector('th')?.textContent).toBe('<h1>x</h1>');
  });
});
