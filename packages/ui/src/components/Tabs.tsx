/**
 * Tabs — horizontal or vertical tabbed content switcher.
 *
 * Consumer-controlled: pass `value` + `onChange`. The component renders the
 * tab list and the active panel. Keyboard:
 *   ArrowLeft  / ArrowRight   horizontal navigation
 *   ArrowUp / ArrowDown        vertical navigation
 *   Home / End                first / last tab
 *   Enter / Space              activate the focused tab
 *
 * Accessibility: role='tablist', role='tab' with aria-selected, role='tabpanel'
 * with aria-labelledby. Activation pattern is "manual" — focus moves with
 * arrows but the tab activates only on Enter/Space (less surprising than
 * "automatic" activation, which jumps content as the user navigates).
 */

import type { ComponentChildren } from 'preact';

export interface TabDefinition {
  id: string;
  label: string;
  content: ComponentChildren;
  disabled?: boolean;
}

type Orientation = 'horizontal' | 'vertical';

interface Props {
  tabs: TabDefinition[];
  value: string;
  onChange: (id: string) => void;
  orientation?: Orientation;
  /** Localised label for the tablist (screen readers). */
  ariaLabel?: string;
  class?: string;
}

export function Tabs({
  tabs,
  value,
  onChange,
  orientation = 'horizontal',
  ariaLabel,
  class: className,
}: Props) {
  function handleKey(e: KeyboardEvent, idx: number) {
    const next = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const prev = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    if (e.key === next || e.key === prev) {
      e.preventDefault();
      focusTab(e, e.key === next ? idx + 1 : idx - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      focusTab(e, 0);
    } else if (e.key === 'End') {
      e.preventDefault();
      focusTab(e, tabs.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const t = tabs[idx];
      if (t && !t.disabled) onChange(t.id);
    }
  }

  function focusTab(e: KeyboardEvent, idx: number) {
    const ix = (idx + tabs.length) % tabs.length;
    const target = e.currentTarget as HTMLElement;
    const list = target.closest('.onegov-tabs__list');
    list?.querySelectorAll<HTMLButtonElement>('.onegov-tabs__tab')[ix]?.focus();
  }

  const classes = ['onegov-tabs'];
  if (orientation === 'vertical') classes.push('onegov-tabs--vertical');
  if (className) classes.push(className);

  const activePanel = tabs.find((t) => t.id === value);

  return (
    <div class={classes.join(' ')}>
      <div
        class="onegov-tabs__list"
        role="tablist"
        aria-orientation={orientation}
        aria-label={ariaLabel}
      >
        {tabs.map((tab, idx) => {
          const tabId = `${tab.id}-tab`;
          const panelId = `${tab.id}-panel`;
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              id={tabId}
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              disabled={tab.disabled}
              class="onegov-tabs__tab"
              onClick={() => !tab.disabled && onChange(tab.id)}
              onKeyDown={(e) => handleKey(e, idx)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {activePanel ? (
        <div
          id={`${activePanel.id}-panel`}
          role="tabpanel"
          aria-labelledby={`${activePanel.id}-tab`}
          tabIndex={0}
        >
          {activePanel.content}
        </div>
      ) : null}
    </div>
  );
}
