/**
 * Paragraph — body copy with persona-aware sizing.
 *
 * Text is rendered through JSX so Preact escapes it. The component never
 * touches HTML strings; rule-pack content always arrives as plain text.
 */

import type { Persona } from '@onegov/core';

interface Props {
  text: string;
  persona: Persona;
  muted?: boolean;
}

export function Paragraph({ text, persona, muted = false }: Props) {
  const classes = ['onegov-p'];
  if (muted) classes.push('onegov-p--muted');
  if (persona === 'pensioner') classes.push('onegov-p--pensioner');

  return (
    <p class={classes.join(' ')} data-persona={persona}>
      {text}
    </p>
  );
}
