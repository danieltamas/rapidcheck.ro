/**
 * Combobox — typeahead select with filterable suggestions.
 *
 * Lightweight presentational combobox: the consumer owns the state (current
 * query, current selection, the filtered options list). Renders an input +
 * a popover suggestions list when `open` is true. Keyboard:
 *   ArrowUp / ArrowDown   move highlight
 *   Enter                 select highlighted item
 *   Escape                close
 *
 * Pair with FormField. For a small static option set, use Select instead.
 */

import type { JSX } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

import type { SelectOption } from './Select.js';

interface Props extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'class' | 'onChange' | 'onSelect'> {
  /** Currently visible options (the consumer filters them). */
  options: ReadonlyArray<SelectOption>;
  /** Current text in the input. */
  value: string;
  /** Called whenever the input text changes. */
  onValueChange: (next: string) => void;
  /** Called when the user picks an option (via click or keyboard). */
  onSelect: (opt: SelectOption) => void;
  /** Called when the dropdown should close (blur / escape). */
  onClose?: () => void;
  invalid?: boolean;
  /** Forwarded to the underlying input. */
  class?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  onSelect,
  onClose,
  invalid,
  class: className,
  ...rest
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset highlight when the option list changes.
  useEffect(() => {
    setHighlight(0);
  }, [options]);

  function close() {
    setOpen(false);
    if (onClose) onClose();
  }

  function selectAt(idx: number) {
    const opt = options[idx];
    if (opt && !opt.disabled) {
      onSelect(opt);
      close();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open) {
        e.preventDefault();
        selectAt(highlight);
      }
    } else if (e.key === 'Escape') {
      close();
    }
  }

  const inputClasses = ['onegov-field__input'];
  if (className) inputClasses.push(className);

  return (
    <div class="onegov-searchbox-host">
      <input
        ref={inputRef}
        type="text"
        class={inputClasses.join(' ')}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-invalid={invalid ? 'true' : undefined}
        value={value}
        onInput={(e) => {
          onValueChange((e.target as HTMLInputElement).value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(close, 120)}
        {...rest}
      />
      {open && options.length > 0 ? (
        <ul class="onegov-searchbox__suggestions" role="listbox">
          {options.map((opt, i) => (
            <li
              key={opt.value}
              class="onegov-searchbox__suggestion"
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => {
                e.preventDefault();
                selectAt(i);
              }}
              onMouseEnter={() => setHighlight(i)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
