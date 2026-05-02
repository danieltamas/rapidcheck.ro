/**
 * Text — generic inline text with size, weight, and emphasis tokens.
 *
 * Use Text for snippets that don't deserve a paragraph (e.g. labels next to
 * icons, table cell contents, inline runs of text). Renders a span by default.
 *
 * Sizing maps to --onegov-fs-* (xs through 2xl). Color hints follow the
 * semantic palette so callers don't reach into raw tokens.
 */

import type { ComponentChildren, JSX } from 'preact';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';
type Tone = 'default' | 'muted' | 'subtle' | 'primary' | 'success' | 'warning' | 'danger';

interface Props extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  size?: Size;
  weight?: Weight;
  tone?: Tone;
  mono?: boolean;
  truncate?: boolean;
  class?: string;
  children: ComponentChildren;
}

const SIZE_TO_TOKEN: Record<Size, string> = {
  xs: 'var(--onegov-fs-xs)',
  sm: 'var(--onegov-fs-sm)',
  md: 'var(--onegov-fs-md)',
  lg: 'var(--onegov-fs-lg)',
  xl: 'var(--onegov-fs-xl)',
  '2xl': 'var(--onegov-fs-2xl)',
};

const WEIGHT_TO_TOKEN: Record<Weight, string> = {
  regular: 'var(--onegov-fw-regular)',
  medium: 'var(--onegov-fw-medium)',
  semibold: 'var(--onegov-fw-semibold)',
  bold: 'var(--onegov-fw-bold)',
};

const TONE_TO_TOKEN: Record<Tone, string> = {
  default: 'var(--onegov-color-text)',
  muted: 'var(--onegov-color-muted)',
  subtle: 'var(--onegov-color-subtle)',
  primary: 'var(--onegov-color-primary)',
  success: 'var(--onegov-color-success)',
  warning: 'var(--onegov-color-warning)',
  danger: 'var(--onegov-color-danger)',
};

export function Text({
  size,
  weight,
  tone,
  mono,
  truncate,
  class: className,
  children,
  style,
  ...rest
}: Props) {
  const styleParts: string[] = [];
  if (size) styleParts.push(`font-size:${SIZE_TO_TOKEN[size]}`);
  if (weight) styleParts.push(`font-weight:${WEIGHT_TO_TOKEN[weight]}`);
  if (tone) styleParts.push(`color:${TONE_TO_TOKEN[tone]}`);
  if (mono) styleParts.push('font-family:var(--onegov-font-mono)');
  if (truncate)
    styleParts.push('overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:inline-block;max-width:100%');
  const composed = styleParts.join(';');
  const finalStyle = typeof style === 'string' ? `${style};${composed}` : composed;
  return (
    <span class={className} style={finalStyle} {...rest}>
      {children}
    </span>
  );
}
