/**
 * SearchBox — prominent search input with optional submit button + suggestions.
 *
 * Two modes:
 *   simple        plain input + submit button (consumer handles search)
 *   suggestions   pass `suggestions` array to render a dropdown that
 *                 closes on outside click and selects on Enter / click.
 *
 * For inline form-style search, just use Input(type="search"). SearchBox is
 * for hero / homepage prominence with the "search-as-CTA" feel.
 */

import type { ComponentChildren } from 'preact';
import { useState, useRef, useEffect } from 'preact/hooks';

export interface SearchSuggestion {
  id: string;
  label: ComponentChildren;
  description?: ComponentChildren;
  href?: string;
}

interface Props {
  value: string;
  onValueChange: (next: string) => void;
  onSubmit?: (value: string) => void;
  /** When supplied, renders a suggestions popover under the input. */
  suggestions?: ReadonlyArray<SearchSuggestion>;
  onSuggestionPicked?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  /** Localised label for the submit button. Default: "Caută". */
  submitLabel?: string;
  /** Localised label for the search icon (screen-readers). Default: "Caută". */
  iconLabel?: string;
  class?: string;
}

export function SearchBox({
  value,
  onValueChange,
  onSubmit,
  suggestions,
  onSuggestionPicked,
  placeholder = 'Caută...',
  submitLabel = 'Caută',
  iconLabel = 'Caută',
  class: className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const hostRef = useRef<HTMLFormElement>(null);

  useEffect(() => setHighlight(0), [suggestions]);

  useEffect(() => {
    if (!open) return;
    const ownerDoc = hostRef.current?.ownerDocument;
    if (!ownerDoc) return;
    function onClick(e: MouseEvent) {
      if (!hostRef.current?.contains(e.target as Node)) setOpen(false);
    }
    ownerDoc.addEventListener('click', onClick, true);
    return () => ownerDoc.removeEventListener('click', onClick, true);
  }, [open]);

  function pickSuggestion(s: SearchSuggestion) {
    if (onSuggestionPicked) onSuggestionPicked(s);
    setOpen(false);
  }

  function handleKey(e: KeyboardEvent) {
    if (!suggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && open) {
      const pick = suggestions[highlight];
      if (pick) {
        e.preventDefault();
        pickSuggestion(pick);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (onSubmit) onSubmit(value);
  }

  const classes = ['onegov-searchbox'];
  if (className) classes.push(className);

  return (
    <div class="onegov-searchbox-host">
      <form ref={hostRef} class={classes.join(' ')} onSubmit={handleSubmit} role="search">
        <span class="onegov-searchbox__icon" aria-label={iconLabel}>
          {SEARCH_ICON}
        </span>
        <input
          type="search"
          class="onegov-searchbox__input"
          value={value}
          placeholder={placeholder}
          onInput={(e) => {
            onValueChange((e.target as HTMLInputElement).value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {onSubmit ? (
          <button type="submit" class="onegov-searchbox__submit">
            {submitLabel}
          </button>
        ) : null}
      </form>
      {open && suggestions && suggestions.length > 0 ? (
        <ul class="onegov-searchbox__suggestions" role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === highlight}
            >
              {s.href ? (
                <a
                  class="onegov-searchbox__suggestion"
                  href={s.href}
                  onClick={() => pickSuggestion(s)}
                >
                  {s.label}
                  {s.description ? (
                    <div style="font-size:var(--onegov-fs-xs);color:var(--onegov-color-muted);margin-top:2px">
                      {s.description}
                    </div>
                  ) : null}
                </a>
              ) : (
                <button
                  type="button"
                  class="onegov-searchbox__suggestion"
                  style="display:block;width:100%;text-align:left;border:0;background:transparent;font:inherit"
                  onClick={() => pickSuggestion(s)}
                  onMouseEnter={() => setHighlight(i)}
                >
                  {s.label}
                  {s.description ? (
                    <div style="font-size:var(--onegov-fs-xs);color:var(--onegov-color-muted);margin-top:2px">
                      {s.description}
                    </div>
                  ) : null}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Inline SVG search icon — no font-icon dep, no external request. */
const SEARCH_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" strokeLinecap="round" />
  </svg>
);
