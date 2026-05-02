/**
 * Banner — full-width notice strip at the top of a page or section.
 *
 * Use banners for site-wide announcements (e.g. "Mentenanță: 22:00–02:00").
 * For inline contextual notices, use Callout. Banners can be dismissed via
 * the `onClose` callback; if none is supplied, no close button renders.
 */

import type { ComponentChildren } from 'preact';

type Tone = 'info' | 'success' | 'warning' | 'danger';

interface Props {
  tone?: Tone;
  onClose?: () => void;
  /** Localised aria-label for the close button. Default: "Închide". */
  closeLabel?: string;
  children: ComponentChildren;
  class?: string;
}

export function Banner({ tone = 'info', onClose, closeLabel = 'Închide', children, class: className }: Props) {
  const classes = ['onegov-banner'];
  if (tone !== 'info') classes.push(`onegov-banner--${tone}`);
  if (className) classes.push(className);
  return (
    <div class={classes.join(' ')} role="status">
      <span>{children}</span>
      {onClose ? (
        <button
          type="button"
          class="onegov-banner__close"
          aria-label={closeLabel}
          onClick={onClose}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
