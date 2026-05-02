/**
 * Pagination — page navigator with prev / next + page buttons.
 *
 * Renders prev / page numbers (with ellipsis) / next. Algorithm:
 *   - Always show first and last page
 *   - Show 1 page on each side of the current page
 *   - Show ellipsis when there's a gap
 *
 * Consumer-controlled: pass `current` + `onChange`. Pass `siblingCount` to
 * widen the visible range around the current page.
 */

interface Props {
  current: number;
  total: number;
  onChange: (page: number) => void;
  siblingCount?: number;
  /** Localised labels. */
  prevLabel?: string;
  nextLabel?: string;
  class?: string;
}

export function Pagination({
  current,
  total,
  onChange,
  siblingCount = 1,
  prevLabel = 'Anterior',
  nextLabel = 'Următor',
  class: className,
}: Props) {
  const classes = ['onegov-pagination'];
  if (className) classes.push(className);

  const pages = computePages(current, total, siblingCount);

  function go(p: number) {
    if (p < 1 || p > total || p === current) return;
    onChange(p);
  }

  return (
    <nav class={classes.join(' ')} aria-label="Paginare">
      <button
        type="button"
        class="onegov-pagination__btn"
        disabled={current <= 1}
        onClick={() => go(current - 1)}
        aria-label={prevLabel}
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} class="onegov-pagination__ellipsis" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            class={`onegov-pagination__btn ${p === current ? 'onegov-pagination__btn--active' : ''}`}
            aria-current={p === current ? 'page' : undefined}
            onClick={() => go(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        class="onegov-pagination__btn"
        disabled={current >= total}
        onClick={() => go(current + 1)}
        aria-label={nextLabel}
      >
        ›
      </button>
    </nav>
  );
}

type PageEntry = number | '…';

function computePages(current: number, total: number, siblingCount: number): PageEntry[] {
  if (total <= 1) return [1];
  const range: PageEntry[] = [1];
  const start = Math.max(2, current - siblingCount);
  const end = Math.min(total - 1, current + siblingCount);
  if (start > 2) range.push('…');
  for (let p = start; p <= end; p += 1) range.push(p);
  if (end < total - 1) range.push('…');
  if (total > 1) range.push(total);
  return range;
}
