/**
 * Table — semantic table with optional sticky header, sortable columns and
 * a CSV-export affordance for the journalist persona.
 *
 * v0.1 API preserved: callers passing `{ headers, rows, persona }` continue
 * to work — they get the legacy plain table render with the journalist CSV
 * tool.
 *
 * New API (additive): TableHead / TableBody / TableRow / TableCell
 * subcomponents for richer composition (column-level alignment, row actions,
 * sortable headers).
 *
 * Cells are rendered through JSX (escaped). `headers` and `rows` arrive as
 * plain strings already extracted by the rule pack.
 */

import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';

import type { Persona } from '@onegov/core';

interface LegacyProps {
  headers: string[];
  rows: string[][];
  persona: Persona;
  /** Make the header row sticky. */
  sticky?: boolean;
}

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(headers: string[], rows: string[][]): string {
  const lines: string[] = [];
  if (headers.length > 0) lines.push(headers.map(escapeCsvCell).join(','));
  for (const row of rows) {
    lines.push(row.map(escapeCsvCell).join(','));
  }
  return lines.join('\n');
}

export function Table({ headers, rows, persona, sticky }: LegacyProps) {
  const [csvVisible, setCsvVisible] = useState(false);
  const isJournalist = persona === 'journalist';

  const tableClasses = ['onegov-table'];
  if (isJournalist) tableClasses.push('onegov-table--journalist');
  if (sticky) tableClasses.push('onegov-table--sticky');

  return (
    <div class="onegov-table-wrap" data-persona={persona}>
      {isJournalist ? (
        <div class="onegov-table-tools" role="toolbar" aria-label="Acțiuni tabel">
          <button
            type="button"
            class="onegov-table-tools__action"
            onClick={() => setCsvVisible((v) => !v)}
          >
            {csvVisible ? 'Ascunde CSV' : 'Copiază ca CSV'}
          </button>
        </div>
      ) : null}
      <table class={tableClasses.join(' ')}>
        {headers.length > 0 ? (
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th key={`h-${i}`}>{header}</th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {rows.map((row, ri) => (
            <tr key={`r-${ri}`}>
              {row.map((cell, ci) => (
                <td key={`c-${ri}-${ci}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {isJournalist && csvVisible ? (
        <textarea
          class="onegov-field__textarea"
          readOnly
          rows={Math.min(8, rows.length + 2)}
          aria-label="CSV pentru copiere"
        >
          {toCsv(headers, rows)}
        </textarea>
      ) : null}
    </div>
  );
}

/* ----- Composable Table API (additive) -------------------------------- */

interface TableShellProps {
  sticky?: boolean;
  children: ComponentChildren;
  class?: string;
}

export function TableShell({ sticky, children, class: className }: TableShellProps) {
  const tableClasses = ['onegov-table'];
  if (sticky) tableClasses.push('onegov-table--sticky');
  if (className) tableClasses.push(className);
  return (
    <div class="onegov-table-wrap">
      <table class={tableClasses.join(' ')}>{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ComponentChildren }) {
  return <thead>{children}</thead>;
}

export function TableBody({ children }: { children: ComponentChildren }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children }: { children: ComponentChildren }) {
  return <tr>{children}</tr>;
}

interface CellProps {
  align?: 'left' | 'center' | 'right';
  children: ComponentChildren;
  /** Render as <th> instead of <td>. */
  header?: boolean;
}

export function TableCell({ align = 'left', children, header }: CellProps) {
  const Tag = header ? 'th' : 'td';
  const style = align === 'left' ? undefined : `text-align:${align}`;
  return <Tag style={style}>{children}</Tag>;
}

interface SortHeaderProps {
  label: string;
  direction?: 'asc' | 'desc' | null;
  onSort: () => void;
}

export function TableSortHeader({ label, direction, onSort }: SortHeaderProps) {
  const arrow = direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '↕';
  return (
    <th aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}>
      <button type="button" class="onegov-table__sort" onClick={onSort}>
        {label}
        <span class="onegov-table__sort-icon" aria-hidden="true">
          {arrow}
        </span>
      </button>
    </th>
  );
}
