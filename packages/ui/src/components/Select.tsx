/**
 * Select — native HTML select with consistent styling.
 *
 * For a typeahead / filterable select, see Combobox. Use Select when the
 * option set is small (fewer than ~10) and benefits from native OS pickers
 * on mobile (which improves accessibility and matches the host platform).
 */

import type { JSX } from 'preact';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props extends Omit<JSX.HTMLAttributes<HTMLSelectElement>, 'class' | 'children'> {
  options: ReadonlyArray<SelectOption>;
  invalid?: boolean;
  placeholder?: string;
  class?: string;
}

export function Select({
  options,
  invalid,
  placeholder,
  class: className,
  ...rest
}: Props) {
  const classes = ['onegov-field__select'];
  if (className) classes.push(className);
  return (
    <select class={classes.join(' ')} aria-invalid={invalid ? 'true' : undefined} {...rest}>
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
