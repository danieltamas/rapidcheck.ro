/**
 * FormActions — right-aligned button row with a top divider.
 *
 * Use to terminate every form. Buttons should typically be Cancel (secondary
 * or ghost) and Submit (primary), in that visual order so the primary action
 * sits closest to the user's natural reading endpoint.
 *
 *   <FormActions>
 *     <Button variant="ghost">Anulează</Button>
 *     <Button>Trimite</Button>
 *   </FormActions>
 *
 * Use `align` to override the default right-alignment for atypical layouts
 * (e.g. a delete-account form where Cancel should sit on the right and the
 * destructive action on the left).
 */

import type { ComponentChildren } from 'preact';

type Align = 'start' | 'center' | 'end' | 'between';

interface Props {
  align?: Align;
  /** Drop the top divider — useful inside a Modal that already has a footer rule. */
  noDivider?: boolean;
  children: ComponentChildren;
  class?: string;
}

export function FormActions({ align = 'end', noDivider, children, class: className }: Props) {
  const classes = ['onegov-form-actions'];
  if (align !== 'end') classes.push(`onegov-form-actions--${align}`);
  if (noDivider) classes.push('onegov-form-actions--no-divider');
  if (className) classes.push(className);
  return <div class={classes.join(' ')}>{children}</div>;
}
