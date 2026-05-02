/**
 * Textarea — multi-line text input.
 *
 * Mirrors Input's contract (presentational, no form-state coupling). Pair
 * with FormField for label + hint + error composition.
 */

import type { JSX } from 'preact';

interface Props extends Omit<JSX.HTMLAttributes<HTMLTextAreaElement>, 'class' | 'rows'> {
  invalid?: boolean;
  rows?: number;
  class?: string;
}

export function Textarea({ invalid, class: className, rows = 4, ...rest }: Props) {
  const classes = ['onegov-field__textarea'];
  if (className) classes.push(className);
  return (
    <textarea
      class={classes.join(' ')}
      rows={rows}
      aria-invalid={invalid ? 'true' : undefined}
      {...rest}
    />
  );
}
