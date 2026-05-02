/**
 * Footer — page footer with column slots + bottom row.
 *
 * Three column slots (children) for free-form arrangement. The `bottom`
 * slot renders a divider above it for the legal/version row.
 */

import type { ComponentChildren } from 'preact';

interface Props {
  children?: ComponentChildren;
  bottom?: ComponentChildren;
  class?: string;
}

export function Footer({ children, bottom, class: className }: Props) {
  const classes = ['onegov-footer'];
  if (className) classes.push(className);
  return (
    <footer class={classes.join(' ')}>
      {children ? <div class="onegov-footer__cols">{children}</div> : null}
      {bottom ? <div class="onegov-footer__bottom">{bottom}</div> : null}
    </footer>
  );
}

interface ColProps {
  title?: string;
  children: ComponentChildren;
  class?: string;
}

export function FooterColumn({ title, children, class: className }: ColProps) {
  const classes = ['onegov-footer__col'];
  if (className) classes.push(className);
  return (
    <div class={classes.join(' ')}>
      {title ? <div class="onegov-footer__col-title">{title}</div> : null}
      {children}
    </div>
  );
}
