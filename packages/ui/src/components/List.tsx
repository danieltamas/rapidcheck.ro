/**
 * List — semantic list with multiple variants.
 *
 * v0.1 API preserved: callers passing `{ items, ordered?, persona }` get the
 * legacy bullet/number list.
 *
 * New `variant` prop:
 *   unordered    bullet list (default for items[])
 *   ordered      numbered list (alias for ordered=true; kept for symmetry)
 *   divided      no bullet — each item separated by a horizontal rule
 *   action       interactive rows (button/link semantics), see ActionList
 *   definition   key/value pairs — renders <dl><dt><dd>
 *
 * For richer item composition (icons, badges, multi-line items), use the
 * <ActionList> component below instead of the items[] string array.
 */

import type { ComponentChildren } from 'preact';

import type { Persona } from '@onegov/core';

type Variant = 'unordered' | 'ordered' | 'divided';

interface Props {
  items: string[];
  ordered?: boolean;
  persona?: Persona;
  variant?: Variant;
  class?: string;
}

export function List({ items, ordered = false, persona = 'standard', variant, class: className }: Props) {
  const resolved: Variant = variant ?? (ordered ? 'ordered' : 'unordered');
  const classes = ['onegov-list'];
  if (resolved === 'divided') classes.push('onegov-list--divided');
  if (persona === 'pensioner') classes.push('onegov-list--pensioner');
  if (className) classes.push(className);
  const cls = classes.join(' ');

  if (resolved === 'ordered' || ordered) {
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

/* ----- ActionList: interactive list (clickable rows) ------------------- */

export interface ActionListItem {
  id: string;
  label: ComponentChildren;
  description?: ComponentChildren;
  href?: string;
  icon?: ComponentChildren;
  trailing?: ComponentChildren;
  onClick?: (e: MouseEvent) => void;
}

interface ActionListProps {
  items: ActionListItem[];
  class?: string;
}

export function ActionList({ items, class: className }: ActionListProps) {
  const classes = ['onegov-list', 'onegov-list--action'];
  if (className) classes.push(className);
  return (
    <ul class={classes.join(' ')}>
      {items.map((item) => {
        const inner = (
          <>
            {item.icon ? <span class="onegov-list-action__icon" aria-hidden="true">{item.icon}</span> : null}
            <span class="onegov-list-action__body">
              <span style="display:block;font-weight:var(--onegov-fw-semibold)">{item.label}</span>
              {item.description ? (
                <span style="display:block;font-size:var(--onegov-fs-sm);color:var(--onegov-color-muted);margin-top:2px">
                  {item.description}
                </span>
              ) : null}
            </span>
            {item.trailing ? (
              <span style="margin-left:auto" aria-hidden="true">
                {item.trailing}
              </span>
            ) : null}
          </>
        );
        return (
          <li key={item.id}>
            {item.href ? (
              <a class="onegov-list-action__row" href={item.href} onClick={item.onClick}>
                {inner}
              </a>
            ) : (
              <button
                type="button"
                class="onegov-list-action__row"
                onClick={item.onClick}
              >
                {inner}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ----- DefinitionList: key / value pairs ------------------------------- */

export interface DefinitionListEntry {
  term: ComponentChildren;
  description: ComponentChildren;
}

interface DefinitionListProps {
  items: DefinitionListEntry[];
  class?: string;
}

export function DefinitionList({ items, class: className }: DefinitionListProps) {
  const classes = ['onegov-list--definition'];
  if (className) classes.push(className);
  return (
    <dl class={classes.join(' ')}>
      {items.map((entry, i) => (
        <>
          <dt key={`dt-${i}`}>{entry.term}</dt>
          <dd key={`dd-${i}`}>{entry.description}</dd>
        </>
      ))}
    </dl>
  );
}
