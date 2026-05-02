/**
 * Inline — non-wrapping inline-flex group.
 *
 * Use for icon + label pairs, badge clusters that should stay together, or
 * any time you need an inline-block-with-flex-children semantics. For
 * groups that should wrap, use Cluster.
 */

import type { ComponentChildren, JSX } from 'preact';

interface Props extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  class?: string;
  children: ComponentChildren;
}

export function Inline({ class: className, children, ...rest }: Props) {
  const classes = ['onegov-inline'];
  if (className) classes.push(className);
  return (
    <span class={classes.join(' ')} {...rest}>
      {children}
    </span>
  );
}
