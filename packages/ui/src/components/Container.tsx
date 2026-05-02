/**
 * Container — max-width centred wrapper with horizontal padding.
 *
 * The width tokens map to identitate.gov.ro's recommended max content width
 * (1280px → `xl`) plus narrower variants for forms and reading pages. Use
 * `lg` for general content, `md` for forms, `sm` for narrow reading layouts.
 */

import type { ComponentChildren, JSX } from 'preact';

type Width = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface Props extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  width?: Width;
  class?: string;
  children: ComponentChildren;
}

export function Container({ width = 'xl', class: className, children, ...rest }: Props) {
  const classes = ['onegov-container', `onegov-container--${width}`];
  if (className) classes.push(className);
  return (
    <div class={classes.join(' ')} {...rest}>
      {children}
    </div>
  );
}
