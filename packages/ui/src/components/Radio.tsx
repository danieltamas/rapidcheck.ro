/**
 * Radio + RadioGroup — single-choice control.
 *
 * Radio is the individual button; RadioGroup is the semantic wrapper that
 * shares a `name` and renders a fieldset/legend if you give it a `label`.
 * Use RadioGroup whenever you have more than one Radio so screen readers
 * announce them as related options.
 */

import type { ComponentChildren, JSX } from 'preact';

interface RadioProps extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'class' | 'type'> {
  label?: string;
  class?: string;
}

export function Radio({ label, class: className, ...rest }: RadioProps) {
  const classes = ['onegov-check'];
  if (className) classes.push(className);
  return (
    <label class={classes.join(' ')}>
      <input type="radio" {...rest} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}

interface RadioGroupProps {
  name: string;
  legend?: string;
  children: ComponentChildren;
  class?: string;
}

export function RadioGroup({ name, legend, children, class: className }: RadioGroupProps) {
  return (
    <fieldset class={className} style="border:0;padding:0;margin:0;display:flex;flex-direction:column;gap:var(--onegov-sp-2)" data-name={name}>
      {legend ? <legend style="font-weight:var(--onegov-fw-semibold);margin-bottom:var(--onegov-sp-2);padding:0;color:var(--onegov-color-text)">{legend}</legend> : null}
      {children}
    </fieldset>
  );
}
