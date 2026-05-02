/**
 * Site module contract.
 *
 * Every domain that gets the v0.2 takeover treatment ships one module
 * conforming to this shape. The content script's lifecycle dispatcher
 * imports through `./registry.ts` and never knows about specific sites.
 */

import type { ComponentType, VNode } from 'preact';

/**
 * UI density preference. Replaces the v0.1 persona picker.
 *
 *   minimal   hero + 1 primary action only; everything else collapsed
 *   simplu    hero + 3 service cards + collapsed "Mai multe" (default)
 *   bogat     hero + all cards expanded + sidebar with noutăți + full footer
 */
export type Density = 'minimal' | 'simplu' | 'bogat';

/** Default density when storage is empty. */
export const DEFAULT_DENSITY: Density = 'simplu';

/** Valid density values, exposed for runtime validation. */
export const DENSITY_VALUES: ReadonlyArray<Density> = ['minimal', 'simplu', 'bogat'];

/**
 * Runtime services injected by the content script into the site module's
 * `App` so the module never reaches into chrome.* directly.
 */
export interface SiteRuntime {
  /** Hide the entire onegov overlay (toggle "show original site"). */
  showOriginal(): void;
  /** Re-show the overlay after `showOriginal()`. */
  hideOriginal(): void;
  /** Persist the user's density preference to chrome.storage.local. */
  setDensity(next: Density): void;
  /** Current density, derived from chrome.storage.local at mount time. */
  density: Density;
}

/**
 * The shape every site module exports. Generic over the per-domain context
 * type the module's `extractContext` returns.
 */
export interface SiteModule<Ctx = unknown> {
  /** eTLD+1, e.g. "anaf.ro". Used for diagnostics + registry deduping. */
  readonly domain: string;
  /** True when this URL belongs to this module. */
  isMatch(url: URL): boolean;
  /** Read the original page's context (read-only — never mutates). */
  extractContext(doc: Document, url: URL): Ctx;
  /**
   * Preact component to render inside the closed shadow root. Receives the
   * extracted context and the runtime services bag.
   */
  App: ComponentType<{ ctx: Ctx; runtime: SiteRuntime }>;
  /**
   * Optional module-scoped CSS string. Injected into the closed shadow root
   * once at mount, after the design-system theme so it can override (but
   * never replaces) any token-driven primitive style.
   */
  readonly css?: string;
}

/**
 * Helper for site modules that want to expose a typed re-render trigger
 * (e.g. when route changes within an SPA-like flow). Not used by v0.2.0
 * — kept here so future modules can opt in.
 */
export type Render = (vnode: VNode) => void;
