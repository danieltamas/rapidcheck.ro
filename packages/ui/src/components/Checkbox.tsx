/**
 * Checkbox — labeled boolean control.
 *
 * Renders a styled checkbox with the label clickable. Pass `indeterminate`
 * to show the tri-state visual (the underlying input is `checked=false` —
 * indeterminate is a property, not an attribute). The component is
 * presentational; consumers wire the `onChange` handler.
 */

import type { JSX } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

interface Props extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'class' | 'type'> {
  label?: string;
  indeterminate?: boolean;
  class?: string;
}

export function Checkbox({ label, indeterminate, class: className, ...rest }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  const classes = ['onegov-check'];
  if (className) classes.push(className);

  return (
    <label class={classes.join(' ')}>
      <input ref={ref} type="checkbox" {...rest} />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
