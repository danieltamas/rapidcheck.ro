/**
 * Paragraph — body copy with persona-aware sizing and emphasis variants.
 *
 * Variants:
 *   muted   secondary information (smaller, --onegov-color-muted)
 *   lead    larger lede paragraph for hero / introduction text
 *   small   smaller variant of the body copy
 *   mono    monospace text (for codes, identifiers)
 *
 * v0.1 API preserved: `text + persona + muted` continues to work unchanged.
 * New `variant`, `class`, `children` props are additive.
 */

import type { ComponentChildren, JSX } from 'preact';

import type { Persona } from '@onegov/core';

type Variant = 'lead' | 'small' | 'mono';

interface Props extends Omit<JSX.HTMLAttributes<HTMLParagraphElement>, 'class' | 'children'> {
  text?: string;
  persona?: Persona;
  muted?: boolean;
  variant?: Variant;
  class?: string;
  children?: ComponentChildren;
}

export function Paragraph({
  text,
  persona = 'standard',
  muted = false,
  variant,
  class: className,
  children,
  ...rest
}: Props) {
  const classes = ['onegov-p'];
  if (muted) classes.push('onegov-p--muted');
  if (variant) classes.push(`onegov-p--${variant}`);
  if (persona === 'pensioner') classes.push('onegov-p--pensioner');
  if (className) classes.push(className);
  return (
    <p class={classes.join(' ')} data-persona={persona} {...rest}>
      {children ?? text ?? ''}
    </p>
  );
}
