/**
 * CardGrid — responsive grid for cards.
 *
 * Columns: 1 (default at narrowest) → cols on each breakpoint.
 * Use `cols={3}` to opt into 3-up at md+. Mobile always renders 1-up.
 */

import type { ComponentChildren } from 'preact';

interface Props {
  /** Maximum columns at the largest breakpoint. */
  cols?: 1 | 2 | 3 | 4;
  children: ComponentChildren;
  class?: string;
}

export function CardGrid({ cols = 3, children, class: className }: Props) {
  const classes = ['onegov-cardgrid'];
  if (cols >= 2) classes.push('onegov-cardgrid--cols-2');
  if (cols >= 3) classes.push('onegov-cardgrid--cols-3');
  if (cols >= 4) classes.push('onegov-cardgrid--cols-4');
  if (className) classes.push(className);
  return <div class={classes.join(' ')}>{children}</div>;
}
