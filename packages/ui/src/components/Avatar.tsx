/**
 * Avatar — circular image or initials placeholder.
 *
 * If `src` is supplied, renders an <img> with object-fit cover. Otherwise
 * renders the supplied `initials` (or first 2 chars of `name`) inside a
 * coloured circle. Sizes: sm | md (default) | lg | xl.
 */

import type { JSX } from 'preact';

type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  src?: string;
  alt?: string;
  name?: string;
  initials?: string;
  size?: Size;
  class?: string;
}

function deriveInitials(name?: string, initials?: string): string {
  if (initials) return initials.slice(0, 2);
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function Avatar({
  src,
  alt,
  name,
  initials,
  size = 'md',
  class: className,
  ...rest
}: Props) {
  const classes = ['onegov-avatar'];
  if (size !== 'md') classes.push(`onegov-avatar--${size}`);
  if (className) classes.push(className);
  return (
    <span class={classes.join(' ')} {...rest}>
      {src ? <img src={src} alt={alt ?? name ?? ''} /> : <span>{deriveInitials(name, initials)}</span>}
    </span>
  );
}
