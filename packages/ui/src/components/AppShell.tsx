/**
 * AppShell — top-level page layout with header / nav / main / aside / footer.
 *
 * Provides the canonical 3-row grid (header → main → footer) with an
 * optional sidebar that becomes a left column on `lg` and above. Header
 * can be sticky with a translucent backdrop blur (matching the demoanaf
 * "premium" feel). All slots are optional so the same component covers
 * both extension popup chrome and full-page site overlays.
 */

import type { ComponentChildren } from 'preact';

interface Props {
  header?: ComponentChildren;
  aside?: ComponentChildren;
  footer?: ComponentChildren;
  children: ComponentChildren;
  /** Stick the header to the top of the scroll container. */
  stickyHeader?: boolean;
  class?: string;
}

export function AppShell({ header, aside, footer, children, stickyHeader, class: className }: Props) {
  const rootClasses = ['onegov-shell-v2'];
  if (aside) rootClasses.push('onegov-shell-v2--with-aside');
  if (className) rootClasses.push(className);

  const headerClasses = ['onegov-shell-v2__header'];
  if (stickyHeader) headerClasses.push('onegov-shell-v2__sticky-header');

  return (
    <div class={rootClasses.join(' ')}>
      {header ? <header class={headerClasses.join(' ')}>{header}</header> : null}
      {aside ? <aside class="onegov-shell-v2__aside">{aside}</aside> : null}
      <main class="onegov-shell-v2__main">{children}</main>
      {footer ? <footer class="onegov-shell-v2__footer">{footer}</footer> : null}
    </div>
  );
}
