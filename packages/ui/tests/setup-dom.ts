/**
 * happy-dom test environment setup.
 *
 * bun:test does not auto-load a DOM environment the way Jest+jsdom does.
 * Each test file imports `setupDom()` and calls it once at module level (or
 * in a beforeAll) to install a happy-dom Window onto the global object.
 *
 * `GlobalRegistrator` is the canonical happy-dom integration for Bun — it
 * registers every browser global properly (including the `SyntaxError` /
 * `TypeError` constructors happy-dom's own internals reach for) so query
 * selectors and event constructors work end-to-end.
 *
 * happy-dom supports `attachShadow({ mode: 'closed' })` natively, which is
 * what the renderer needs.
 */

import { GlobalRegistrator } from '@happy-dom/global-registrator';

let installed = false;

/**
 * Install happy-dom globals exactly once per test process. Idempotent —
 * subsequent calls are no-ops so test files can call this freely without
 * creating multiple Window instances.
 */
export function setupDom(): void {
  if (installed) return;
  GlobalRegistrator.register({ url: 'https://example.test/' });
  installed = true;
}

/**
 * Make a fresh closed shadow root attached to a new host element. Used by
 * the renderer tests; returns both so the test can assert on host attributes.
 */
export function makeShadowHost(): { host: HTMLElement; shadow: ShadowRoot } {
  setupDom();
  const host = document.createElement('div');
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  return { host, shadow };
}

/**
 * Render a Preact element into a fresh detached `<div>` and return the div.
 * Used by per-component tests so we don't have to set up a shadow root for
 * every render assertion.
 */
export function mountInto(): HTMLElement {
  setupDom();
  const div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}
