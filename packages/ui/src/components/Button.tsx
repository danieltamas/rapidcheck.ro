/**
 * Button — for popup-triggered actions.
 *
 * Variants: primary | secondary | ghost | danger | link
 * Sizes:    sm | md | lg
 * States:   default / hover / focus-visible / active / disabled / loading
 * Accepts:  leadingIcon / trailingIcon, fullWidth (block-level button),
 *           loading (replaces leadingIcon with a spinner; locks pointer events)
 *
 * v0.1 API preserved: callers passing { label, onClick, persona, variant?,
 * disabled?, type? } continue to work unchanged. New props are optional.
 *
 * Buttons in v0.1 default to type="button" — they never submit a form by
 * accident. Pass type="submit" only when wrapping inside a Form that owns
 * its own submit handling (and remember invariant #2 — no form data touched
 * in v0.1).
 *
 * Click handlers are arbitrary functions provided by the caller — never
 * derived from rule-pack data, so no risk of executing rule-pack-supplied
 * code (invariant #3 holds at the boundary above this component).
 */

import type { ComponentChildren, JSX } from 'preact';

import type { Persona } from '@onegov/core';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'class' | 'children' | 'type'> {
  /** Optional plain-text label. If both `label` and `children` are passed, children wins. */
  label?: string;
  children?: ComponentChildren;
  /** Click handler. v0.1 callers passed an explicit `onClick`; new code can use any HTML attribute. */
  onClick?: (event: MouseEvent) => void;
  persona?: Persona;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: ComponentChildren;
  trailingIcon?: ComponentChildren;
  /** Override the default `type="button"`. */
  type?: 'button' | 'submit' | 'reset';
  class?: string;
}

export function Button({
  label,
  children,
  onClick,
  persona = 'standard',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  type = 'button',
  class: className,
  ...rest
}: Props) {
  const classes = ['onegov-button'];
  if (variant !== 'primary') classes.push(`onegov-button--${variant}`);
  if (size !== 'md') classes.push(`onegov-button--${size}`);
  if (fullWidth) classes.push('onegov-button--full');
  if (loading) classes.push('onegov-button--loading');
  if (persona === 'pensioner') classes.push('onegov-button--pensioner');
  if (className) classes.push(className);

  const content: ComponentChildren = children ?? label ?? '';

  return (
    <button
      type={type}
      class={classes.join(' ')}
      data-persona={persona}
      data-variant={variant}
      data-size={size}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span class="onegov-button__spinner" aria-hidden="true" /> : leadingIcon}
      {content}
      {!loading && trailingIcon ? trailingIcon : null}
    </button>
  );
}
