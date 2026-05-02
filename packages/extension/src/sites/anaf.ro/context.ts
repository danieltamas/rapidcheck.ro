/**
 * anaf.ro context extractor.
 *
 * Reads a small, read-only snapshot of the original page so the App can
 * adapt (e.g. surface a CUI from the URL, show whether the user is in a
 * logged-in shell). NEVER mutates the document; NEVER reads form inputs.
 *
 * The contract:
 *   - Pure inspection; one synchronous pass.
 *   - Defensive: every selector that fails returns `null`/`undefined`.
 *   - No `innerHTML` reads beyond `.textContent`. No `eval`.
 *
 * Adding a new field:
 *   1. Extend `AnafContext`.
 *   2. Add a defensive selector in `extractContext`.
 *   3. Add a test in `__tests__/context.test.ts`.
 */

import { classifyRoute, type Route } from './nav.js';

/** Read-only context the anaf App receives. */
export interface AnafContext {
  /** Resolved route shape (Home / Cui / external / unknown). */
  route: Route;
  /** The current URL so the App can render breadcrumbs etc. */
  url: string;
  /**
   * Best-effort signal whether the user appears logged in (SPV chrome).
   * Today this is a heuristic on the original page's nav text — the
   * authenticated flow is out of scope (see §Out of scope).
   */
  loggedIn: boolean;
  /**
   * The section title surfaced by the original page's <h1>. Used as a
   * fallback when our route map can't be more specific.
   */
  pageTitle: string | null;
}

/**
 * Build an `AnafContext` from the live document + URL. Never throws —
 * extractor failures return defaults.
 */
export function extractContext(doc: Document, url: URL): AnafContext {
  return {
    route: classifyRoute(url),
    url: url.href,
    loggedIn: detectLoggedIn(doc),
    pageTitle: readPageTitle(doc),
  };
}

/**
 * Heuristic: presence of a logout link or SPV/Identitate menu item is the
 * cleanest signal short of digging into cookies (which we WILL NOT do).
 * Returns false on any failure.
 */
function detectLoggedIn(doc: Document): boolean {
  try {
    // ANAF sites use Romanian-localised affordances; the words below are
    // standard across SPV / identitate.gov.ro chrome.
    const candidates = doc.querySelectorAll<HTMLAnchorElement>('a, button');
    for (const el of candidates) {
      const t = (el.textContent ?? '').toLowerCase();
      if (
        t.includes('logout') ||
        t.includes('iesire') ||
        t.includes('ieșire') ||
        t.includes('deconectare')
      ) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Read the original page's primary heading so we can surface it as a hint
 * (e.g. "ești pe: Calendar fiscal"). Returns null when no h1 exists.
 */
function readPageTitle(doc: Document): string | null {
  try {
    const h1 = doc.querySelector('h1');
    const t = h1?.textContent?.trim();
    return t && t.length > 0 ? t : null;
  } catch {
    return null;
  }
}
