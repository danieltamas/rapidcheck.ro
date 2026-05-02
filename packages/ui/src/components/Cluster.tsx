/**
 * Cluster — horizontal layout primitive that wraps.
 *
 * Use for groups of related elements that should sit side-by-side and wrap
 * onto multiple lines when the container narrows (e.g. action buttons,
 * filter pills, tag rows). For inline pairs that should never wrap, use
 * Inline. For vertical stacks, use Stack.
 */

import type { ComponentChildren, JSX } from 'preact';

type Gap = 'xs' | 'sm' | 'md' | 'lg';
type Justify = 'start' | 'center' | 'end' | 'between';

interface Props extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  gap?: Gap;
  justify?: Justify;
  class?: string;
  children: ComponentChildren;
}

export function Cluster({ gap = 'md', justify, class: className, children, ...rest }: Props) {
  const classes = ['onegov-cluster', `onegov-cluster--${gap}`];
  if (justify) classes.push(`onegov-cluster--justify-${justify}`);
  if (className) classes.push(className);
  return (
    <div class={classes.join(' ')} {...rest}>
      {children}
    </div>
  );
}
