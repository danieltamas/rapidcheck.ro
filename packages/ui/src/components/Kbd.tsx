/**
 * Kbd — keyboard-key affordance, used in pro-persona shortcuts.
 *
 * Renders the press-able-key visual (monospace, light border, soft
 * background). Use for hints like ⌘+K or Esc in tooltips and shortcut menus.
 */

import type { ComponentChildren, JSX } from 'preact';

interface Props extends Omit<JSX.HTMLAttributes<HTMLElement>, 'class' | 'children'> {
  class?: string;
  children: ComponentChildren;
}

export function Kbd({ class: className, children, ...rest }: Props) {
  const classes = ['onegov-kbd-hint'];
  if (className) classes.push(className);
  return (
    <kbd class={classes.join(' ')} {...rest}>
      {children}
    </kbd>
  );
}
