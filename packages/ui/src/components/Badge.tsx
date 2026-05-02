/**
 * Badge — small inline label.
 *
 * Tones: neutral (default) | info | success | warning | danger
 * Sizes: sm (default) | lg
 * Shape: rectangle (default) — pass `pill` for fully rounded ends.
 *
 * Use Badge for inline status indicators (e.g. "verificat", "în curs").
 * For interactive count indicators on icons, see Avatar's badge slot.
 */

import type { ComponentChildren, JSX } from 'preact';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
type Size = 'sm' | 'lg';

interface Props extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  tone?: Tone;
  size?: Size;
  pill?: boolean;
  children: ComponentChildren;
  class?: string;
}

export function Badge({ tone = 'neutral', size = 'sm', pill, children, class: className, ...rest }: Props) {
  const classes = ['onegov-badge'];
  if (tone !== 'neutral') classes.push(`onegov-badge--${tone}`);
  if (size === 'lg') classes.push('onegov-badge--lg');
  if (pill) classes.push('onegov-badge--pill');
  if (className) classes.push(className);
  return (
    <span class={classes.join(' ')} {...rest}>
      {children}
    </span>
  );
}
