/**
 * Input — single-line text input with prefix / suffix and error states.
 *
 * Supports all common input types (text/email/url/search/tel/password/number)
 * via a single component to keep the API minimal. The component is purely
 * presentational — it does NOT submit, validate, or read form state. That's
 * by design (invariant #2: no form data touched in v0.1).
 *
 * Use FormField to wrap the input with label + hint + error composition.
 */

import type { JSX } from 'preact';

type InputType =
  | 'text'
  | 'email'
  | 'url'
  | 'search'
  | 'tel'
  | 'password'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime-local';

interface Props extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'class' | 'type' | 'prefix'> {
  type?: InputType;
  prefix?: string;
  suffix?: string;
  invalid?: boolean;
  class?: string;
}

export function Input({
  type = 'text',
  prefix,
  suffix,
  invalid,
  class: className,
  ...rest
}: Props) {
  const inputClasses = ['onegov-field__input'];
  if (className) inputClasses.push(className);

  const input = (
    <input
      type={type}
      class={inputClasses.join(' ')}
      aria-invalid={invalid ? 'true' : undefined}
      {...rest}
    />
  );

  if (!prefix && !suffix) return input;
  return (
    <div class="onegov-field__group">
      {prefix ? <span class="onegov-field__affix onegov-field__affix--leading">{prefix}</span> : null}
      {input}
      {suffix ? <span class="onegov-field__affix onegov-field__affix--trailing">{suffix}</span> : null}
    </div>
  );
}
