/**
 * Popover — click-triggered floating panel for richer content than a tooltip.
 *
 * Lightweight implementation: the consumer provides a trigger (any element)
 * and the popover content; the wrapper toggles `open` on trigger click and
 * closes on outside-click or Escape. Position is statically `bottom-start`
 * (no auto-flip) — that covers most extension UI; a future enhancement can
 * add Floating-UI-style placement if multiple positions are needed.
 *
 * For short text-only hovers, use Tooltip instead.
 */

import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

interface Props {
  /** Element that toggles the popover when clicked. */
  trigger: ComponentChildren;
  children: ComponentChildren;
  /** Optional callback when the popover state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Default open state. */
  defaultOpen?: boolean;
  class?: string;
}

export function Popover({ trigger, children, onOpenChange, defaultOpen = false, class: className }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const hostRef = useRef<HTMLSpanElement>(null);

  function setAndNotify(next: boolean) {
    setOpen(next);
    if (onOpenChange) onOpenChange(next);
  }

  useEffect(() => {
    if (!open) return;
    const ownerDoc = hostRef.current?.ownerDocument;
    if (!ownerDoc) return;
    function onDocClick(e: MouseEvent) {
      if (!hostRef.current?.contains(e.target as Node)) setAndNotify(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAndNotify(false);
    }
    ownerDoc.addEventListener('click', onDocClick, true);
    ownerDoc.addEventListener('keydown', onKey);
    return () => {
      ownerDoc.removeEventListener('click', onDocClick, true);
      ownerDoc.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const popoverClasses = ['onegov-popover'];
  if (className) popoverClasses.push(className);

  return (
    <span class="onegov-popover-host" ref={hostRef}>
      <span onClick={() => setAndNotify(!open)} role="button" tabIndex={0}>
        {trigger}
      </span>
      {open ? (
        <div class={popoverClasses.join(' ')} role="dialog" style="top:calc(100% + 6px);left:0;">
          {children}
        </div>
      ) : null}
    </span>
  );
}
