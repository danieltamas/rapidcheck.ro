/**
 * Alert — full-width contextual message inline within a page.
 *
 * Tones: info (default) | success | warning | danger
 * Slot: optional title above the message; optional close button when
 * `onClose` is supplied.
 *
 * Sets role='alert' for warning + danger (assertive, demands attention) and
 * role='status' for info + success (polite, doesn't interrupt). For modal
 * blocking notifications, use Modal. For top-of-page strips, use Banner.
 * For inline guidance within content, use Callout.
 */

import type { ComponentChildren } from 'preact';

type Tone = 'info' | 'success' | 'warning' | 'danger';

interface Props {
  tone?: Tone;
  title?: string;
  icon?: ComponentChildren;
  onClose?: () => void;
  /** Localised aria-label for the close button. Default: "Închide". */
  closeLabel?: string;
  children: ComponentChildren;
  class?: string;
}

const DEFAULT_ICONS: Record<Tone, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '!',
  danger: '!',
};

export function Alert({
  tone = 'info',
  title,
  icon,
  onClose,
  closeLabel = 'Închide',
  children,
  class: className,
}: Props) {
  const classes = ['onegov-alert'];
  if (tone !== 'info') classes.push(`onegov-alert--${tone}`);
  if (className) classes.push(className);
  const role = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';
  return (
    <div class={classes.join(' ')} role={role}>
      <span class="onegov-alert__icon" aria-hidden="true">
        {icon ?? DEFAULT_ICONS[tone]}
      </span>
      <div class="onegov-alert__body">
        {title ? <p class="onegov-alert__title">{title}</p> : null}
        <div class="onegov-alert__text">{children}</div>
      </div>
      {onClose ? (
        <button
          type="button"
          class="onegov-alert__close"
          aria-label={closeLabel}
          onClick={onClose}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
