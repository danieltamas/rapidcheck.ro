/**
 * Box — generic content container with padding/radius/border tokens.
 *
 * The lowest-level surface primitive: just a styled `<div>`. Reach for Box
 * when you need a bounded surface but neither Card (the canonical content
 * tile) nor Panel (the heavier section wrapper) fit. Variants:
 *
 *   default   bordered surface with default padding
 *   surface   subtle background, no border (for embedded snippets)
 *   sunken    deeper background (for inset stats / KPI numbers)
 *   flat      no border, no padding — pure layout marker
 */

import type { ComponentChildren, JSX } from 'preact';

type Variant = 'default' | 'surface' | 'sunken' | 'flat';

interface Props extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  variant?: Variant;
  children: ComponentChildren;
  class?: string;
}

export function Box({ variant = 'default', children, class: className, ...rest }: Props) {
  const classes = ['onegov-box'];
  if (variant !== 'default') classes.push(`onegov-box--${variant}`);
  if (className) classes.push(className);
  return (
    <div class={classes.join(' ')} {...rest}>
      {children}
    </div>
  );
}
