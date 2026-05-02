/**
 * Skeleton — shape placeholder for async content.
 *
 * Variants:
 *   default    rectangle (configurable width / height)
 *   circle     circular (use for avatar placeholders)
 *   text       single line of text
 *
 * Use SkeletonText for multi-line text placeholders. Use SkeletonCard for a
 * full card-shaped placeholder.
 *
 * Animations gated on prefers-reduced-motion. aria-hidden so screen readers
 * skip the placeholder; the consumer should provide a separate
 * aria-live='polite' announcement when the real content loads.
 */

interface Props {
  variant?: 'default' | 'circle' | 'text';
  width?: string;
  height?: string;
  class?: string;
}

export function Skeleton({ variant = 'default', width, height, class: className }: Props) {
  const classes = ['onegov-skeleton'];
  if (variant === 'circle') classes.push('onegov-skeleton--circle');
  if (variant === 'text') classes.push('onegov-skeleton--text');
  if (className) classes.push(className);
  const styleParts: string[] = [];
  if (width) styleParts.push(`width:${width}`);
  if (height) styleParts.push(`height:${height}`);
  return <span class={classes.join(' ')} style={styleParts.join(';')} aria-hidden="true" />;
}

interface SkeletonTextProps {
  lines?: number;
  /** Last-line width as a CSS length. Default '60%'. */
  lastLineWidth?: string;
  class?: string;
}

export function SkeletonText({ lines = 3, lastLineWidth = '60%', class: className }: SkeletonTextProps) {
  const classes = ['onegov-skeleton-text'];
  if (className) classes.push(className);
  return (
    <div class={classes.join(' ')} style="display:flex;flex-direction:column;gap:var(--onegov-sp-2)" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? lastLineWidth : '100%'} />
      ))}
    </div>
  );
}
