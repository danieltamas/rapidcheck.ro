/**
 * Callout — contextual notice with an optional title.
 *
 * Use callouts for inline guidance or warnings within a page (e.g. "your
 * account is read-only"). For full-page banners across the top, use Banner.
 * For modal-style alerts that demand acknowledgement, use Alert.
 *
 * Tones:  info | success | warning | danger
 */

import type { ComponentChildren } from 'preact';

type Tone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

interface Props {
  tone?: Tone;
  title?: string;
  icon?: ComponentChildren;
  children: ComponentChildren;
  class?: string;
}

const DEFAULT_ICONS: Record<Tone, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  danger: '!',
  neutral: '·',
};

export function Callout({ tone = 'info', title, icon, children, class: className }: Props) {
  const classes = ['onegov-callout'];
  if (tone !== 'neutral') classes.push(`onegov-callout--${tone}`);
  if (className) classes.push(className);
  return (
    <div class={classes.join(' ')} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}>
      <div class="onegov-callout__icon" aria-hidden="true">
        {icon ?? DEFAULT_ICONS[tone]}
      </div>
      <div class="onegov-callout__body">
        {title ? <p class="onegov-callout__title">{title}</p> : null}
        <div class="onegov-callout__text">{children}</div>
      </div>
    </div>
  );
}
