/**
 * Heading — semantic h1–h6 with consistent type scale.
 *
 * Variants:
 *   level     1 → 6 (default 1) — semantic heading level + size
 *   display   true → applies the display type scale (hero titles)
 *   eyebrow   small uppercase label rendered above the heading
 *   subtitle  smaller secondary text rendered below the heading
 *
 * Persona behaviour preserved from v0.1: pensioner adds tighter letter-spacing
 * via class, others rely entirely on token cascade.
 *
 * Public API stays compatible: callers passing `text + level + persona` keep
 * working unchanged. New props are optional. v0.1 callers do not break.
 */

import type { ComponentChildren, JSX } from 'preact';

import type { Persona } from '@onegov/core';

type Level = 1 | 2 | 3 | 4 | 5 | 6;

interface Props extends Omit<JSX.HTMLAttributes<HTMLHeadingElement>, 'class' | 'children'> {
  text?: string;
  level?: Level;
  persona?: Persona;
  display?: boolean;
  eyebrow?: string;
  subtitle?: string;
  class?: string;
  children?: ComponentChildren;
}

export function Heading({
  text,
  level = 1,
  persona = 'standard',
  display = false,
  eyebrow,
  subtitle,
  class: className,
  children,
  ...rest
}: Props) {
  const baseClass = `onegov-h${level}`;
  const classes = [baseClass];
  if (display) classes.push('onegov-h--display');
  if (level === 1 && persona === 'pensioner') classes.push('onegov-h1--pensioner');
  if (className) classes.push(className);
  const cls = classes.join(' ');
  const content: ComponentChildren = children ?? text ?? '';

  // Render the heading element matching the level. We dispatch explicitly so
  // TypeScript can verify each branch (no polymorphic `as` shenanigans).
  let headingEl: ComponentChildren;
  switch (level) {
    case 2:
      headingEl = (
        <h2 class={cls} data-persona={persona} {...rest}>
          {content}
        </h2>
      );
      break;
    case 3:
      headingEl = (
        <h3 class={cls} data-persona={persona} {...rest}>
          {content}
        </h3>
      );
      break;
    case 4:
      headingEl = (
        <h4 class={cls} data-persona={persona} {...rest}>
          {content}
        </h4>
      );
      break;
    case 5:
      headingEl = (
        <h5 class={cls} data-persona={persona} {...rest}>
          {content}
        </h5>
      );
      break;
    case 6:
      headingEl = (
        <h6 class={cls} data-persona={persona} {...rest}>
          {content}
        </h6>
      );
      break;
    default:
      headingEl = (
        <h1 class={cls} data-persona={persona} {...rest}>
          {content}
        </h1>
      );
  }

  if (!eyebrow && !subtitle) return <>{headingEl}</>;
  return (
    <div class="onegov-heading-group">
      {eyebrow ? <span class="onegov-eyebrow">{eyebrow}</span> : null}
      {headingEl}
      {subtitle ? <span class="onegov-subtitle">{subtitle}</span> : null}
    </div>
  );
}
