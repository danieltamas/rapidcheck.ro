/**
 * anaf.ro App — top-level Preact tree.
 *
 * Receives `{ ctx, runtime }` from the content script's dispatcher.
 * Composes the slim status bar (the persistent top region with branding +
 * density chip + "show original" toggle) with the route-specific page.
 *
 * Pages are imported lazily via static imports here (Vite tree-shakes any
 * route that isn't reached) — but we currently always have them in the
 * bundle because the CardGrid, AppShell, etc. they share are used by every
 * route. Bundle-size is held in check by the (small) route count.
 */

import { Home } from './Home.js';
import { Cui } from './Cui.js';
import { StatusBar } from './StatusBar.js';
import type { AnafContext } from './context.js';
import type { SiteRuntime } from '../types.js';

interface Props {
  ctx: AnafContext | null;
  runtime: SiteRuntime;
}

/**
 * Default fallback context — used when the content script's extractor
 * threw or the DOM was empty (early document_start before body filled).
 */
const EMPTY_CTX: AnafContext = {
  route: { kind: 'home' },
  url: 'https://www.anaf.ro/',
  loggedIn: false,
  pageTitle: null,
};

export function App({ ctx, runtime }: Props) {
  const safe = ctx ?? EMPTY_CTX;

  return (
    <div class="anaf-shell" data-route={safe.route.kind}>
      <StatusBar runtime={runtime} />
      {renderRoute(safe, runtime)}
    </div>
  );
}

function renderRoute(ctx: AnafContext, runtime: SiteRuntime) {
  switch (ctx.route.kind) {
    case 'cui':
      return <Cui ctx={ctx} runtime={runtime} initialCui={ctx.route.cui} />;
    case 'external':
      // External sections render Home with the section pill so the user
      // has continuity. The actual section content lives on the original
      // anaf page; if they want it, the "afișează site original" button
      // restores the live page.
      return <Home ctx={ctx} runtime={runtime} sectionHint={ctx.route.section} />;
    case 'unknown':
    case 'home':
    default:
      return <Home ctx={ctx} runtime={runtime} />;
  }
}
