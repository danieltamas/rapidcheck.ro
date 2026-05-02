/**
 * App shell — premium frame shared across persona layouts (v0.1.1).
 *
 * Renders the branded top bar (g mark + onegov + crumb) and the footer
 * attribution row. Each persona layout wraps its content in this shell and
 * lets `inner` slot in whatever density / layout the persona prefers.
 *
 * The shell is intentionally token-driven (--onegov-shell__*); the persona
 * theme tokens reach inside via CSS cascade. No per-persona forks here.
 *
 * The shell accepts a `wide` flag for the journalist persona, which uses a
 * 1200px max-width instead of the default 960px.
 */

import type { ComponentChildren } from 'preact';

import type { Persona } from '@onegov/core';

interface Props {
  domain: string;
  /** Optional crumb (e.g. route id) shown in the topbar. */
  crumb?: string;
  /** Persona — exposed in `data-persona` for analytics / styling forks. */
  persona: Persona;
  /** Switches the inner column to the wide variant (journalist). */
  wide?: boolean;
  children: ComponentChildren;
}

const PERSONA_LABEL: Record<Persona, string> = {
  pensioner: 'Vârstnic',
  standard: 'Standard',
  pro: 'Profesionist',
  journalist: 'Jurnalist',
};

/**
 * Premium app shell. Topbar is fixed at the top of the overlay; footer is at
 * the bottom of the scrollable area (the content script's overlay is itself
 * the viewport — see `packages/extension/src/content/index.ts`).
 */
export function AppShell({ domain, crumb, persona, wide, children }: Props) {
  return (
    <div class="onegov-shell" data-persona={persona}>
      <header class="onegov-shell__topbar" role="banner">
        <span class="onegov-shell__brand-mark" aria-hidden="true">
          g
        </span>
        <span class="onegov-shell__brand">onegov</span>
        {crumb ? <span class="onegov-shell__crumb">{crumb}</span> : null}
      </header>
      <div class="onegov-shell__main">
        <div class={`onegov-shell__inner${wide ? ' onegov-shell__inner--wide' : ''}`}>{children}</div>
      </div>
      <footer class="onegov-shell__footer" role="contentinfo">
        <span>
          <span class="onegov-shell__footer-mark">onegov</span> · layer activ pe {domain}
        </span>
        <span>persona: {PERSONA_LABEL[persona]}</span>
      </footer>
    </div>
  );
}
