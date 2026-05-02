/**
 * Accordion — vertical list of expandable / collapsible sections.
 *
 * The Accordion owns the open-state map; consumers pass an array of
 * `{ id, title, content }` items. Set `multiple` to allow multiple panels
 * to be open at once; otherwise opening one closes the rest.
 *
 * Keyboard: Each header is a button (Enter/Space toggles). Arrow Up/Down
 * moves focus between headers. Home / End jump to first / last.
 *
 * Accessibility: each header gets aria-expanded + aria-controls. The panel
 * gets role='region' + aria-labelledby pointing back at the header.
 */

import type { ComponentChildren } from 'preact';
import { useState, useCallback } from 'preact/hooks';

export interface AccordionItem {
  id: string;
  title: string;
  content: ComponentChildren;
}

interface Props {
  items: AccordionItem[];
  /** Allow multiple panels open simultaneously. Defaults to single-open. */
  multiple?: boolean;
  /** IDs that start open. */
  defaultOpen?: ReadonlyArray<string>;
  class?: string;
}

export function Accordion({ items, multiple = false, defaultOpen = [], class: className }: Props) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set(defaultOpen));

  const toggle = useCallback(
    (id: string) => {
      setOpen((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (!multiple) next.clear();
          next.add(id);
        }
        return next;
      });
    },
    [multiple],
  );

  function handleKey(e: KeyboardEvent, idx: number) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusHeader(e, idx + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusHeader(e, idx - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusHeader(e, 0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusHeader(e, items.length - 1);
    }
  }

  function focusHeader(e: KeyboardEvent, idx: number) {
    const ix = (idx + items.length) % items.length;
    const target = e.currentTarget as HTMLElement;
    const list = target.closest('.onegov-accordion');
    const next = list?.querySelectorAll<HTMLButtonElement>('.onegov-accordion-item__trigger')[ix];
    next?.focus();
  }

  const classes = ['onegov-accordion'];
  if (className) classes.push(className);

  return (
    <div class={classes.join(' ')}>
      {items.map((item, idx) => {
        const isOpen = open.has(item.id);
        const triggerId = `${item.id}-trigger`;
        const panelId = `${item.id}-panel`;
        return (
          <div
            key={item.id}
            class={`onegov-accordion-item ${isOpen ? 'onegov-accordion-item--open' : ''}`}
          >
            <h3 style="margin:0;">
              <button
                type="button"
                id={triggerId}
                class="onegov-accordion-item__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                onKeyDown={(e) => handleKey(e, idx)}
              >
                <span>{item.title}</span>
                <span class="onegov-accordion-item__chevron" aria-hidden="true">
                  ▾
                </span>
              </button>
            </h3>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                class="onegov-accordion-item__panel"
              >
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
