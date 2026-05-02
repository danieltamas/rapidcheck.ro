/**
 * Divider — horizontal rule (default) or vertical separator.
 *
 * Use to separate logical sections within a page. `inset` adds horizontal
 * padding so the rule sits inside the content gutter rather than spanning
 * full width.
 */

interface Props {
  orientation?: 'horizontal' | 'vertical';
  inset?: boolean;
  class?: string;
}

export function Divider({ orientation = 'horizontal', inset, class: className }: Props) {
  const classes = ['onegov-divider'];
  if (orientation === 'vertical') classes.push('onegov-divider--vertical');
  if (inset) classes.push('onegov-divider--inset');
  if (className) classes.push(className);
  if (orientation === 'vertical') {
    return <span class={classes.join(' ')} role="separator" aria-orientation="vertical" />;
  }
  return <hr class={classes.join(' ')} />;
}
