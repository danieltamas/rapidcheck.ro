/**
 * Spinner — accessible loading indicator.
 *
 * Sizes: sm | md (default) | lg. Pure CSS animation gated on
 * prefers-reduced-motion. Wraps in an aria-live polite region with the
 * supplied label so screen readers announce loading states.
 *
 * For determinate progress, use ProgressBar. For shape placeholders during
 * skeleton loading, use Skeleton.
 */

type Size = 'sm' | 'md' | 'lg';

interface Props {
  size?: Size;
  /** Localised loading label. Default: "Se încarcă...". */
  label?: string;
  class?: string;
}

export function Spinner({ size = 'md', label = 'Se încarcă...', class: className }: Props) {
  const classes = ['onegov-spinner'];
  if (size !== 'md') classes.push(`onegov-spinner--${size}`);
  if (className) classes.push(className);
  return (
    <span role="status" aria-live="polite">
      <span class={classes.join(' ')} aria-hidden="true" />
      <span style="position:absolute;left:-9999px">{label}</span>
    </span>
  );
}
