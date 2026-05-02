/**
 * TopNav — horizontal main navigation with mobile hamburger collapse.
 *
 * Layout: brand (left) → items (centre, hidden on mobile until toggled) →
 * trailing slot (right, e.g. account avatar). On viewports < 768px the
 * items collapse and a hamburger button toggles them.
 *
 * Items are passed as `{ label, href, active? }` plus an optional onClick
 * for SPA-style navigation. The current item gets the active styling.
 */

import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';

export interface NavItem {
  label: string;
  href?: string;
  active?: boolean;
  onClick?: (e: MouseEvent) => void;
}

interface Props {
  brand?: ComponentChildren;
  items: NavItem[];
  trailing?: ComponentChildren;
  /** Localised aria-label for the hamburger toggle. Default: "Meniu". */
  toggleLabel?: string;
  class?: string;
}

export function TopNav({
  brand,
  items,
  trailing,
  toggleLabel = 'Meniu',
  class: className,
}: Props) {
  const [open, setOpen] = useState(false);
  const classes = ['onegov-topnav'];
  if (className) classes.push(className);
  const itemsStyle = open ? 'display:flex !important;' : undefined;
  return (
    <nav class={classes.join(' ')} aria-label="Principal">
      {brand ? <span class="onegov-topnav__brand">{brand}</span> : null}
      <ul class="onegov-topnav__items" style={itemsStyle}>
        {items.map((it, i) => (
          <li key={i}>
            <a
              class={`onegov-topnav__item ${it.active ? 'onegov-topnav__item--active' : ''}`}
              href={it.href ?? '#'}
              aria-current={it.active ? 'page' : undefined}
              onClick={it.onClick}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
      {trailing ? <span style="margin-left:auto;display:inline-flex;align-items:center;gap:var(--onegov-sp-3)">{trailing}</span> : null}
      <button
        type="button"
        class="onegov-topnav__toggle"
        aria-expanded={open}
        aria-label={toggleLabel}
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>
    </nav>
  );
}
