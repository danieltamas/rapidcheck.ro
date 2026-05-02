/**
 * EmptyState — placeholder for "no data" zones.
 *
 * Slots: illustration (or any visual) → title → description → action.
 * Use whenever a list, table, search-result page renders zero items. Always
 * include a clear CTA so the user knows what to do next.
 */

import type { ComponentChildren } from 'preact';

interface Props {
  /** Visual placeholder (icon, SVG, image). Defaults to a neutral circle marker. */
  illustration?: ComponentChildren;
  title: string;
  description?: string;
  action?: ComponentChildren;
  class?: string;
}

export function EmptyState({ illustration, title, description, action, class: className }: Props) {
  const classes = ['onegov-empty'];
  if (className) classes.push(className);
  return (
    <div class={classes.join(' ')}>
      <div class="onegov-empty__illustration" aria-hidden="true">
        {illustration ?? '⌀'}
      </div>
      <h3 class="onegov-empty__title">{title}</h3>
      {description ? <p class="onegov-empty__description">{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </div>
  );
}
