/**
 * anaf.ro site module — v0.2.0 takeover.
 *
 * This file is the public surface of the anaf module. It composes the
 * sub-modules (extractContext + isMatch + nav + bridge + Home/Cui pages)
 * into the SiteModule shape consumed by the registry.
 *
 * The actual UI lives in `Home.tsx` / `Cui.tsx` and the form-bridge logic
 * lives in `bridge.ts`. Keep this index thin so the dispatch test surface
 * stays small.
 */

import type { SiteModule } from '../types.js';
import { extractContext, type AnafContext } from './context.js';
import { isMatch, classifyRoute } from './nav.js';
import { App } from './App.js';
import { ANAF_CSS } from './styles.js';

export const anafModule: SiteModule<AnafContext> = {
  domain: 'anaf.ro',
  isMatch,
  extractContext,
  App,
  css: ANAF_CSS,
};

// Re-exports so other modules (and tests) can pick what they need without
// reaching into per-file paths.
export { extractContext, isMatch, classifyRoute };
export type { AnafContext };
