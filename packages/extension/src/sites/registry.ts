/**
 * Site module registry.
 *
 * v0.2 architecture: each takeover-eligible domain ships a self-contained
 * "site module" (`packages/extension/src/sites/<domain>/`) exporting:
 *
 *   {
 *     isMatch(url: URL): boolean       // is this URL one we own?
 *     extractContext(doc: Document): Context  // read-only context from page
 *     App(ctx, deps): VNode            // Preact tree to mount in shadow root
 *   }
 *
 * The content script asks the registry for the module that owns the current
 * URL. If none → graceful no-op (other sites that ship in subsequent tasks
 * fall here today). If one → mount loader, mount overlay, dispatch to the
 * site module's `App`.
 *
 * v0.2.0 ships ONE site module: anaf.ro (registered below). Other ship-list
 * sites (dgep, portal.just, ghiseul, rotld, itmcluj) are NOT registered —
 * they keep the toolbar badge but show no overlay until their own per-site
 * modules land in subsequent tasks.
 *
 * Adding a new site (later tasks):
 *   1. Implement `packages/extension/src/sites/<domain>/index.ts` matching
 *      the SiteModule contract from `./types.ts`.
 *   2. Import + push it into `MODULES` below.
 *   3. Update the manifest content_scripts run_at if you want document_start
 *      lifecycle (otherwise it inherits document_idle from the existing entry).
 */

import { anafModule } from './anaf.ro/index.js';
import type { SiteModule } from './types.js';

/**
 * Site modules carry a per-domain Context type, but the registry stores them
 * as `SiteModule<unknown>` so a single list can host modules with different
 * context shapes. The dispatcher treats every Context as opaque and only the
 * module's own App reads the field.
 */
type AnyModule = SiteModule<unknown>;

/**
 * The full registered set. Probe order doesn't matter as long as `isMatch`
 * predicates don't overlap; the first match wins.
 */
const MODULES: ReadonlyArray<AnyModule> = [anafModule as unknown as AnyModule];

/**
 * Resolve a URL to the owning site module, or `null` if no module claims it.
 * v0.2.0: only anaf.ro is registered; everything else returns null.
 */
export function resolveModule(url: URL): AnyModule | null {
  for (const mod of MODULES) {
    try {
      if (mod.isMatch(url)) return mod;
    } catch {
      // A misbehaving isMatch must not break the dispatch; skip.
    }
  }
  return null;
}

/** Exposed for tests so they can assert the registered set. */
export function listRegisteredDomains(): ReadonlyArray<string> {
  return MODULES.map((m) => m.domain);
}
