/**
 * Panel — section wrapper with optional header, body, footer.
 *
 * Visually heavier than Card — uses larger radius and a header-band look.
 * Use Panel for grouped content with a title bar (e.g. "Configurări cont"
 * with a header and a series of switches inside). Use Card for collections
 * of similar items (e.g. service tiles).
 */

import type { ComponentChildren } from 'preact';

type Variant = 'default' | 'bordered' | 'elevated' | 'flat';

interface Props {
  variant?: Variant;
  header?: ComponentChildren;
  footer?: ComponentChildren;
  children: ComponentChildren;
  class?: string;
}

export function Panel({ variant = 'default', header, footer, children, class: className }: Props) {
  const classes = ['onegov-panel'];
  if (variant === 'elevated') classes.push('onegov-panel--elevated');
  if (variant === 'flat') classes.push('onegov-panel--flat');
  if (className) classes.push(className);
  return (
    <section class={classes.join(' ')} data-variant={variant}>
      {header ? <header class="onegov-panel__header">{header}</header> : null}
      <div class="onegov-panel__body">{children}</div>
      {footer ? <footer class="onegov-panel__footer">{footer}</footer> : null}
    </section>
  );
}
