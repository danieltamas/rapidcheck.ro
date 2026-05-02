/**
 * Stack — vertical layout primitive.
 *
 * Stacks children with a consistent gap based on the spacing scale. Use
 * this as the default vertical rhythm container; reach for raw flexbox
 * only when you need cross-axis controls Stack doesn't expose.
 *
 * Forwards `class?: string` and arbitrary HTML attributes to the root
 * `<div>` so callers can extend styling without escaping the design system.
 * If you need a semantic element (section/article/...), wrap Stack inside
 * that element rather than asking Stack to render polymorphically; this
 * keeps the prop surface small and the typing clean.
 */

import type { ComponentChildren, JSX } from 'preact';

type Gap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Align = 'start' | 'center' | 'end' | 'stretch';

interface Props extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  /** Gap between children. Maps to spacing tokens. Defaults to `md`. */
  gap?: Gap;
  /** Cross-axis alignment. Defaults to natural flow. */
  align?: Align;
  class?: string;
  children: ComponentChildren;
}

export function Stack({ gap = 'md', align, class: className, children, ...rest }: Props) {
  const classes = ['onegov-stack', `onegov-stack--${gap}`];
  if (align) classes.push(`onegov-stack--align-${align}`);
  if (className) classes.push(className);
  return (
    <div class={classes.join(' ')} {...rest}>
      {children}
    </div>
  );
}
