/**
 * Table — semantic table with optional copy-as-CSV affordance for journalists.
 *
 * The CSV button is a `Button` element; the click handler is wired only when
 * the persona is `journalist`. The handler reads from local component state —
 * NEVER from `document.*` — and uses an in-memory string. We do NOT call
 * `navigator.clipboard.writeText` here because that would require permissions
 * outside the shadow root's reach; the CSV is rendered to a hidden textarea
 * the user can select instead. (No clipboard side-effects, no permission
 * prompts, no globals — invariant 4 stays clean.)
 *
 * Cells are rendered through JSX (escaped). `headers` and `rows` arrive as
 * plain strings already extracted by the rule pack.
 */

import { useState } from 'preact/hooks';

import type { Persona } from '@onegov/core';

interface Props {
  headers: string[];
  rows: string[][];
  persona: Persona;
}

function escapeCsvCell(value: string): string {
  // RFC 4180-ish: wrap in quotes if cell contains comma, quote, or newline;
  // double any embedded quotes.
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

export function Table({ headers, rows, persona }: Props) {
  const [csvVisible, setCsvVisible] = useState(false);
  const isJournalist = persona === 'journalist';

  const tableClasses = ['onegov-table'];
  if (isJournalist) tableClasses.push('onegov-table--journalist');

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
