/**
 * Card — composable container with optional title, header, body, footer slots.
 *
 * v0.1 API preserved: callers passing `{ title?, children, persona }` keep
 * working — title still renders an h3 inside a `<section>`.
 *
 * New variants:
 *   default      flat card (legacy look)
 *   premium      modern card with subtle hover shadow lift
 *   interactive  pressable card; hover lifts -2px, active scale(0.99)
 *   media        zero-padding container with a media slot up top (image/video)
 *
 * Composition slots (use these for richer cards):
 *   <Card variant="premium">
 *     <CardHeader>...</CardHeader>
 *     <CardBody>...</CardBody>
 *     <CardFooter>...</CardFooter>
 *   </Card>
 *
 * Children are arbitrary Preact nodes; the caller is responsible for ensuring
 * any text inside them was rendered through JSX (escaped). The card itself
 * never serializes children to HTML.
 */

import type { ComponentChildren, JSX } from 'preact';

import type { Persona } from '@onegov/core';

type Variant = 'default' | 'premium' | 'interactive' | 'media';

interface Props extends Omit<JSX.HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
  title?: string;
  variant?: Variant;
  children: ComponentChildren;
  persona?: Persona;
  class?: string;
}

export function Card({
  title,
  variant = 'default',
  children,
  persona = 'standard',
  class: className,
  ...rest
}: Props) {
  const classes = ['onegov-card'];
  if (variant !== 'default') classes.push(`onegov-card--${variant}`);
  if (persona === 'pensioner') classes.push('onegov-card--pensioner');
  if (className) classes.push(className);

  return (
    <section
      class={classes.join(' ')}
      data-persona={persona}
      data-variant={variant}
      aria-labelledby={title ? `card-title-${slug(title)}` : undefined}
      {...rest}
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

interface SlotProps {
  children: ComponentChildren;
  class?: string;
}

export function CardHeader({ children, class: className }: SlotProps) {
  const classes = ['onegov-card__header'];
  if (className) classes.push(className);
  return <header class={classes.join(' ')}>{children}</header>;
}

export function CardBody({ children, class: className }: SlotProps) {
  const classes = ['onegov-card__body'];
  if (className) classes.push(className);
  return <div class={classes.join(' ')}>{children}</div>;
}

export function CardFooter({ children, class: className }: SlotProps) {
  const classes = ['onegov-card__footer'];
  if (className) classes.push(className);
  return <footer class={classes.join(' ')}>{children}</footer>;
}

interface MediaProps {
  src?: string;
  alt?: string;
  class?: string;
  children?: ComponentChildren;
}

export function CardMedia({ src, alt, class: className, children }: MediaProps) {
  const classes = ['onegov-card__media'];
  if (className) classes.push(className);
  if (src) {
    return <img src={src} alt={alt ?? ''} class={classes.join(' ')} loading="lazy" />;
  }
  return <div class={classes.join(' ')}>{children}</div>;
}

/** Compact slug — keeps `[A-Za-z0-9-]`, lowercases, trims leading dashes. */
function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}
