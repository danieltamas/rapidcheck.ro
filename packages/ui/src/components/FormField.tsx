/**
 * FormField — composition wrapper for label + control + hint + error.
 *
 * The form primitives (Input, Textarea, Select, Combobox, Checkbox, Radio,
 * Switch) expose pure controls without label baggage. FormField is the
 * canonical way to compose a label + the control + optional hint and error
 * messages with proper ARIA wiring (label htmlFor, aria-describedby).
 *
 * Usage:
 *
 *   <FormField id="cui" label="CUI" hint="Codul unic de înregistrare" required>
 *     <Input id="cui" name="cui" />
 *   </FormField>
 *
 * Pass the same `id` to FormField AND the control inside it; FormField uses
 * it to build the `htmlFor` of the label and the `aria-describedby` on the
 * hint / error nodes.
 */

import type { ComponentChildren } from 'preact';

interface Props {
  /** Stable identifier — must match the inner control's id. */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ComponentChildren;
  class?: string;
}

export function FormField({ id, label, hint, error, required, children, class: className }: Props) {
  const classes = ['onegov-field'];
  if (error) classes.push('onegov-field--error');
  if (className) classes.push(className);

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div class={classes.join(' ')}>
      <label class="onegov-field__label" htmlFor={id}>
        {label}
        {required ? <span class="onegov-field__required" aria-hidden="true">*</span> : null}
        {required ? <span style="position:absolute;left:-9999px"> obligatoriu</span> : null}
      </label>
      {children}
      {hint ? (
        <span class="onegov-field__hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span class="onegov-field__error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
