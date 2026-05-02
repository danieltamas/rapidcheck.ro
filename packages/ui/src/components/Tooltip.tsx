/**
 * Tooltip — hover/focus-revealed short text near a trigger element.
 *
 * Pure CSS reveal (`:hover`, `:focus-within`) — no JS state, no animation
 * timers. Uses position: absolute relative to a host wrapper. Position
 * variants: top (default) / bottom / left / right.
 *
 * For long-form contextual content, use Popover. For toast-style transient
 * notifications, use the Toast pattern (forthcoming with site modules).
 *
 * Accessibility: rendered with role="tooltip"; the trigger should reference
 * it via aria-describedby — pass an `id` to Tooltip and wire it on your
 * trigger element manually.
 */

import type { ComponentChildren } from 'preact';

type Position = 'top' | 'bottom' | 'left' | 'right';

interface Props {
  text: string;
  position?: Position;
  /** Element the tooltip describes. Wraps the trigger so hover/focus reveals the tooltip. */
  children: ComponentChildren;
  id?: string;
  class?: string;
}

export function Tooltip({ text, position = 'top', children, id, class: className }: Props) {
  const tooltipClasses = ['onegov-tooltip', `onegov-tooltip--${position}`];
  if (className) tooltipClasses.push(className);
  return (
    <span class="onegov-tooltip-host">
      {children}
      <span class={tooltipClasses.join(' ')} role="tooltip" id={id}>
        {text}
      </span>
    </span>
  );
}
