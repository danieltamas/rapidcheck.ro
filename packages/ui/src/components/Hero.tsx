/**
 * Hero — large title + description + actions composition.
 *
 * The canonical "premium feel" page header. Pairs an eyebrow + title +
 * description with optional action buttons in a gradient surface (matches
 * the demoanaf hero proportion and warmth).
 *
 * Use one Hero per top-level page, never more — multiple heroes dilute the
 * visual weight.
 */

import type { ComponentChildren } from 'preact';

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Action button row. Render any button(s) you like. */
  actions?: ComponentChildren;
  /** Centre alignment for compact landing pages. */
  centered?: boolean;
  class?: string;
}

export function Hero({ eyebrow, title, description, actions, centered, class: className }: Props) {
  const classes = ['onegov-hero'];
  if (centered) classes.push('onegov-hero--center');
  if (className) classes.push(className);
  return (
    <section class={classes.join(' ')}>
      {eyebrow ? <span class="onegov-hero__eyebrow">{eyebrow}</span> : null}
      <h1 class="onegov-hero__title">{title}</h1>
      {description ? <p class="onegov-hero__description">{description}</p> : null}
      {actions ? <div class="onegov-hero__actions">{actions}</div> : null}
    </section>
  );
}
