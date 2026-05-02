/**
 * Button — for popup-triggered actions (e.g. "show original toggle").
 *
 * Buttons in v0.1 are `type="button"` only. They never submit a form.
 * Click handlers are arbitrary functions provided by the caller — never
 * derived from rule-pack data, so no risk of executing rule-pack-supplied
 * code (invariant #3 holds at the boundary above this component).
 */

import type { Persona } from '@onegov/core';

interface Props {
  label: string;
  onClick: () => void;
  persona: Persona;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  /** Override the default `type="button"`. Reserved for future cases; v0.1
   *  callers should leave undefined so we never accidentally submit a form. */
  type?: 'button';
}

export function Button({
  label,
  onClick,
  persona,
  variant = 'primary',
  disabled = false,
  type = 'button',
}: Props) {
  const classes = ['onegov-button'];
  if (variant === 'secondary') classes.push('onegov-button--secondary');
  if (persona === 'pensioner') classes.push('onegov-button--pensioner');

  return (
    <button
      type={type}
      class={classes.join(' ')}
      data-persona={persona}
      data-variant={variant}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
