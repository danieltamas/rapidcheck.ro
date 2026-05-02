/**
 * Card — composable container with optional title.
 *
 * Children are arbitrary Preact nodes; the caller is responsible for ensuring
 * any text inside them was rendered through JSX (escaped). The card itself
 * never serializes children to HTML.
 */

import type { ComponentChildren } from 'preact';

import type { Persona } from '@onegov/core';

interface Props {
  title?: string;
  children: ComponentChildren;
  persona: Persona;
}

export function Card({ title, children, persona }: Props) {
  const classes = ['onegov-card'];
  if (persona === 'pensioner') classes.push('onegov-card--pensioner');

  return (
    <section
      class={classes.join(' ')}
      data-persona={persona}
      aria-labelledby={title ? `card-title-${slug(title)}` : undefined}
    >
      {title ? (
        <h3 class="onegov-card__title" id={`card-title-${slug(title)}`}>
          {title}
        </h3>
      ) : null}
      {children}
    </section>
  );
}

/** Compact slug — keeps `[A-Za-z0-9-]`, lowercases, trims leading dashes. */
function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}
