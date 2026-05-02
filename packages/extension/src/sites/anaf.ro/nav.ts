/**
 * anaf.ro route map + URL matcher.
 *
 * Pure functions — no DOM, no chrome.*. Two responsibilities:
 *
 *   isMatch(url)     true when the URL belongs to anaf.ro (eTLD+1 match).
 *                    Used by the registry to decide whether the anaf module
 *                    owns the current page.
 *
 *   classifyRoute()  tag the current pathname into a known route shape so
 *                    the App can pick which page (Home, Cui, future pages)
 *                    to render. Defaults to 'home' when no specific match.
 *
 * The route map is intentionally narrow for v0.2.0:
 *
 *   home            the landing region (anaf.ro/, /anaf/internet/ANAF/,
 *                   /anaf/internet/ANAF/MENIU/, etc.)
 *   cui             CUI lookup pages — anything pathing-clearly into the
 *                   CUI / TVA / verificare flow
 *   external        a known external URL (servicii_online, calendar fiscal,
 *                   noutati) — App MAY render an explanatory shell or just
 *                   delegate to the original page
 *   unknown         not classified — App falls back to Home with a hint
 *
 * Adding a route:
 *   1. Append to the patterns array below.
 *   2. Extend the discriminated union in `Route`.
 *   3. Add a render branch in `App.tsx`.
 *   4. Add a test for the new pattern in `__tests__/nav.test.ts`.
 */

export type Route =
  | { kind: 'home' }
  | { kind: 'cui'; cui?: string }
  | { kind: 'external'; section: string }
  | { kind: 'unknown'; pathname: string };

/**
 * eTLD+1 anaf.ro check — also catches subdomains (www.anaf.ro,
 * webservicesp.anaf.ro, static.anaf.ro). The site module only renders for
 * the public-facing main hostnames; webservices/static are intentionally
 * out of scope (they're API/asset hosts, not user pages).
 */
export function isMatch(url: URL): boolean {
  const h = url.hostname.toLowerCase();
  if (h === 'anaf.ro' || h === 'www.anaf.ro') return true;
  // Subdomains explicitly out of scope: webservicesp, static, declunic,
  // pfinternet etc. carry tools / APIs the takeover doesn't claim.
  if (h.endsWith('.anaf.ro')) {
    const sub = h.slice(0, -'.anaf.ro'.length);
    if (
      sub === 'webservicesp' ||
      sub === 'static' ||
      sub === 'declunic' ||
      sub === 'pfinternet' ||
      sub === 'evtva' ||
      sub === 'mfinante'
    ) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * CUI extracted from the URL when on a CUI lookup page. Tries query string
 * first (`?cui=12345`), then path captures from the legacy ANAF URL shapes.
 * Returns undefined when no CUI present.
 */
function extractCuiFromUrl(url: URL): string | undefined {
  const fromQuery = url.searchParams.get('cui') || url.searchParams.get('CUI');
  if (fromQuery && /^\d{2,10}$/.test(fromQuery.trim())) return fromQuery.trim();
  // Legacy path shape: /anaf/internet/.../<cui>/...
  const m = url.pathname.match(/\/(\d{2,10})(?:[/?]|$)/);
  if (m && m[1]) return m[1];
  return undefined;
}

/**
 * Map the current URL into a coarse route. Pure — never touches the DOM.
 * The patterns are forgiving on purpose: anaf.ro's URL space is messy
 * across subsections, so we err toward "show home" rather than "show
 * unknown" when we're not sure.
 */
export function classifyRoute(url: URL): Route {
  const path = url.pathname.toLowerCase();

  // CUI / TVA lookup paths — see SITES_COVERAGE.md §3.1 for the canonical
  // anaf flow shapes. ANAF embeds the lookup behind a JSP form so we match
  // both the form path and any URL that carries a CUI param.
  if (
    /tva|cui|verificare|platitor/.test(path) ||
    url.searchParams.has('cui') ||
    url.searchParams.has('CUI')
  ) {
    const cui = extractCuiFromUrl(url);
    return cui ? { kind: 'cui', cui } : { kind: 'cui' };
  }

  // Known external sections we link to from Home but don't reskin in v0.2.0.
  // We render Home with a small "ești în <section>" pill so the user has
  // context when they got here from a deep link.
  if (/(servicii_online|calendar.fiscal|noutati|despre_anaf|contact|asistenta)/.test(path)) {
    const section = (path.split('/').filter(Boolean).pop() ?? path).replace(/_/g, ' ');
    return { kind: 'external', section };
  }

  // Homepage / catch-all under /anaf/internet/ANAF/.
  if (path === '/' || path === '' || /\/anaf\/internet\/?(anaf\/?)?$/i.test(path)) {
    return { kind: 'home' };
  }

  // Catch-all anaf root: any anaf URL that didn't match above renders Home
  // (the user is "somewhere on anaf" — Home with the optional section pill is
  // the safest default).
  return { kind: 'unknown', pathname: url.pathname };
}
