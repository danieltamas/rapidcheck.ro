/**
 * StatusIndicator — coloured dot with optional label.
 *
 * Tones: neutral (default) | success | warning | danger | info
 * Set `pulse` to softly pulse the dot (gated on prefers-reduced-motion).
 *
 * Used in toolbar badges, system-status pills, online/offline indicators.
 */

import type { ComponentChildren } from 'preact';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface Props {
  tone?: Tone;
  label?: ComponentChildren;
  pulse?: boolean;
  class?: string;
}

export function StatusIndicator({ tone = 'neutral', label, pulse, class: className }: Props) {
  const classes = ['onegov-status'];
  if (tone !== 'neutral') classes.push(`onegov-status--${tone}`);
  if (pulse) classes.push('onegov-status--pulse');
  if (className) classes.push(className);
  return (
    <span class={classes.join(' ')}>
      <span class="onegov-status__dot" aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </span>
  );
}
