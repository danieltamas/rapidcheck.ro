/**
 * SideNav — vertical navigation with section grouping.
 *
 * Sections: each has an optional title + a list of items. Used inside the
 * AppShell `aside` slot for app-style navigation. For top-level page nav,
 * use TopNav.
 */

import type { ComponentChildren } from 'preact';

export interface SideNavItem {
  label: string;
  href?: string;
  active?: boolean;
  icon?: ComponentChildren;
  onClick?: (e: MouseEvent) => void;
}

export interface SideNavSection {
  title?: string;
  items: SideNavItem[];
}

interface Props {
  sections: SideNavSection[];
  /** Localised aria-label for the navigation. Default: "Navigare laterală". */
  ariaLabel?: string;
  class?: string;
}

export function SideNav({ sections, ariaLabel = 'Navigare laterală', class: className }: Props) {
  const classes = ['onegov-sidenav'];
  if (className) classes.push(className);
  return (
    <nav aria-label={ariaLabel}>
      <ul class={classes.join(' ')}>
        {sections.map((section, sIdx) => (
          <li key={sIdx} class="onegov-sidenav__section">
            {section.title ? (
              <div class="onegov-sidenav__section-title">{section.title}</div>
            ) : null}
            {section.items.map((it, iIdx) => (
              <a
                key={iIdx}
                class={`onegov-sidenav__item ${it.active ? 'onegov-sidenav__item--active' : ''}`}
                href={it.href ?? '#'}
                aria-current={it.active ? 'page' : undefined}
                onClick={it.onClick}
              >
                {it.icon ? <span aria-hidden="true">{it.icon}</span> : null}
                <span>{it.label}</span>
              </a>
            ))}
          </li>
        ))}
      </ul>
    </nav>
  );
}
