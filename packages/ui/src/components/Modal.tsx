/**
 * Modal — overlay dialog with backdrop, focus trap, escape-key dismiss.
 *
 * Sizes: sm | md | lg | full
 * Slots: header (title + close) / body / footer (action row)
 *
 * Accessibility:
 *   - role='dialog' aria-modal='true'
 *   - aria-labelledby points at the title element
 *   - focus is captured on first render and returned to the previously
 *     focused element when the modal closes
 *   - Escape key closes (passes onClose())
 *   - clicking the backdrop closes (passes onClose())
 *
 * Animations gated on prefers-reduced-motion via the global theme rule.
 *
 * Note: Modal renders inline (not via portal) because the renderer mounts
 * inside a closed shadow root — there is no document.body to portal to. A
 * fixed-position element inside the shadow root behaves correctly because
 * the shadow root's host is positioned relative to the page viewport.
 */

import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

type Size = 'sm' | 'md' | 'lg' | 'full';
type Tone = 'default' | 'danger' | 'error';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: Size;
  /** Localised aria-label for the close button. Default: "Închide". */
  closeLabel?: string;
  /** Footer content (typically buttons). Optional — modal renders without one. */
  footer?: ComponentChildren;
  /** Disable backdrop-click dismissal (e.g. forced-confirmation flows). */
  noBackdropClose?: boolean;
  /** Visual severity affordance for blocking/error dialogs. */
  tone?: Tone;
  /** Alias for tone="error" when callers already model an error boolean. */
  error?: boolean;
  children: ComponentChildren;
  class?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  closeLabel = 'Închide',
  footer,
  noBackdropClose,
  tone = 'default',
  error = false,
  children,
  class: className,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Capture focus on open, restore on close.
  useEffect(() => {
    if (!open) return;
    const ownerDoc = dialogRef.current?.ownerDocument;
    if (!ownerDoc) return;
    previouslyFocusedRef.current = ownerDoc.activeElement as HTMLElement | null;
    // Move focus to the dialog's first focusable element (or the dialog itself).
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    if (focusables.length > 0) {
      focusables[0]?.focus();
    } else {
      dialog.focus();
    }
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  // Escape closes; Tab cycles focus inside the dialog.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      const active = dialog.ownerDocument?.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    const ownerDoc = dialogRef.current?.ownerDocument;
    ownerDoc?.addEventListener('keydown', onKey, true);
    return () => ownerDoc?.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  const titleId = title ? `onegov-modal-title-${(title || '').replace(/\s+/g, '-').slice(0, 24)}` : undefined;
  const visualTone = error ? 'error' : tone;
  const classes = ['onegov-modal', `onegov-modal--${size}`];
  if (visualTone !== 'default') classes.push(`onegov-modal--${visualTone}`);
  if (className) classes.push(className);

  return (
    <div
      class="onegov-modal-backdrop"
      onClick={(e) => {
        if (!noBackdropClose && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        class={classes.join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-tone={visualTone}
        tabIndex={-1}
      >
        {title || true ? (
          <header class="onegov-modal__header">
            {visualTone !== 'default' ? (
              <span class="onegov-modal__status" aria-hidden="true">
                !
              </span>
            ) : null}
            {title ? (
              <h2 id={titleId} class="onegov-modal__title">
                {title}
              </h2>
            ) : (
              <span class="onegov-modal__title" />
            )}
            <button
              type="button"
              class="onegov-modal__close"
              aria-label={closeLabel}
              onClick={onClose}
            >
              ×
            </button>
          </header>
        ) : null}
        <div class="onegov-modal__body">{children}</div>
        {footer ? <footer class="onegov-modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
