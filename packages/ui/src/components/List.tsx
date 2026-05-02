/**
 * List — ordered or unordered. Items are plain strings; JSX escapes them.
 *
 * Persona behaviour:
 *   - `pensioner` adds extra spacing between items (via class)
 *   - others use the default
 *
 * Tolerates an empty `items` array — renders an empty list element so the
 * caller can decide whether to omit it from the tree entirely.
 */

import type { Persona } from '@onegov/core';

interface Props {
  items: string[];
  ordered?: boolean;
  persona: Persona;
}

export function List({ items, ordered = false, persona }: Props) {
  const classes = ['onegov-list'];
  if (persona === 'pensioner') classes.push('onegov-list--pensioner');
  const cls = classes.join(' ');

  if (ordered) {
    return (
      <ol class={cls} data-persona={persona}>
        {items.map((item, i) => (
          <li key={`${i}-${item}`}>{item}</li>
        ))}
      </ol>
    );
  }
  return (
    <ul class={cls} data-persona={persona}>
      {items.map((item, i) => (
        <li key={`${i}-${item}`}>{item}</li>
      ))}
    </ul>
  );
}
