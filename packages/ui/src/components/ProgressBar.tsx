/**
 * ProgressBar — determinate or indeterminate progress.
 *
 * Determinate: pass `value` (0–100). The bar fills to that percentage and
 * exposes role='progressbar' with aria-valuemin / aria-valuemax / aria-valuenow.
 *
 * Indeterminate: omit `value`. The bar slides back-and-forth (animation
 * gated on prefers-reduced-motion).
 */

interface Props {
  value?: number;
  /** Localised label for screen readers. Default: "Progres". */
  label?: string;
  class?: string;
}

export function ProgressBar({ value, label = 'Progres', class: className }: Props) {
  const isIndeterminate = value === undefined;
  const classes = ['onegov-progress'];
  if (isIndeterminate) classes.push('onegov-progress--indeterminate');
  if (className) classes.push(className);
  const clamped = isIndeterminate ? 0 : Math.max(0, Math.min(100, value!));
  return (
    <div
      class={classes.join(' ')}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={isIndeterminate ? undefined : clamped}
    >
      <div class="onegov-progress__fill" style={`width:${clamped}%`} />
    </div>
  );
}
