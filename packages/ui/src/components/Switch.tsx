/**
 * Switch — on/off toggle with label.
 *
 * Visually distinct from Checkbox: the toggle implies an immediate, reversible
 * state change (e.g. enable/disable a feature) whereas a checkbox implies a
 * choice that's submitted later. Use Switch for live preferences; Checkbox
 * for form-style choices.
 */

import type { JSX } from 'preact';

interface Props extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'class' | 'type'> {
  label?: string;
  class?: string;
}

export function Switch({ label, class: className, ...rest }: Props) {
  const classes = ['onegov-switch'];
  if (className) classes.push(className);
  return (
    <label class={classes.join(' ')}>
      <input type="checkbox" role="switch" {...rest} />
      <span class="onegov-switch__track">
        <span class="onegov-switch__thumb" />
      </span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
