/**
 * Breadcrumb — truncating crumb trail.
 *
 * Items are passed as { label, href? }. The last item is rendered as
 * current (no link, aria-current="page"). Separators are visual only
 * (aria-hidden) so screen readers see only the labels.
 */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
  /** Visual separator. Default '›'. */
  separator?: string;
  class?: string;
}

export function Breadcrumb({ items, separator = '›', class: className }: Props) {
  const classes = ['onegov-breadcrumb'];
  if (className) classes.push(className);
  return (
    <nav aria-label="Breadcrumb">
      <ol class={classes.join(' ')}>
        {items.map((it, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i}>
              {i > 0 ? (
                <span class="onegov-breadcrumb__sep" aria-hidden="true">
                  {separator}
                </span>
              ) : null}{' '}
              {isLast || !it.href ? (
                <span
                  class="onegov-breadcrumb__item onegov-breadcrumb__item--current"
                  aria-current={isLast ? 'page' : undefined}
                >
                  {it.label}
                </span>
              ) : (
                <a class="onegov-breadcrumb__item" href={it.href}>
                  {it.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
