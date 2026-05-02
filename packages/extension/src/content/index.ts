/**
 * Content script — runs in the page's isolated world at `document_idle`.
 *
 * STATUS: Stub. Track 4 implements:
 *   1. Read persona from chrome.storage.local
 *   2. verifyDomain(location.hostname, verifiedList)
 *   3. If verified, loadBundled(domain, fetcher) → match route → extract → render
 *   4. Append closed shadow host (#onegov-root) and mount Preact app
 *
 * The stub does nothing intentional. Invariant 1 (DOM untouched) holds
 * trivially: no shadow host is appended, no nodes are added. The script's
 * only side effect is one console.debug line behind a build-time gate.
 */

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  // eslint-disable-next-line no-console
  console.debug('[onegov] content script loaded (scaffold — no DOM mutation)');
}

declare const __DEV__: boolean;

export {};
