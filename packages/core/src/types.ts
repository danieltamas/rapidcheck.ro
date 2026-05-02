/**
 * @onegov/core — public type definitions (single source of truth).
 *
 * This file is the contract every other package depends on. Changes ripple
 * across the monorepo and require explicit orchestrator approval. The shapes
 * mirror SPEC.md §5.1 verbatim.
 *
 * Constraints:
 *   - No DOM types. No browser globals. No `chrome.*`.
 *   - Strict, no `any`. Use `unknown` and narrow at call sites.
 */

/**
 * A domain that has been vetted as a legitimate Romanian government or
 * public-interest service. Stored as the eTLD+1 (e.g. "anaf.ro", not
 * "www.anaf.ro" or "https://anaf.ro/").
 */
export interface VerifiedDomain {
  /** eTLD+1 form, e.g. "anaf.ro". */
  domain: string;
  /** Coarse classification driving rendering decisions. */
  category: 'gov' | 'public-interest';
  /** ISO-8601 date the entry was added. */
  addedAt: string;
  /** URL evidence supporting the entry (the domain's own homepage is fine). */
  source: string;
}

/**
 * The bundled, shipped roster of verified domains. Loaded once at content
 * script startup; treated as immutable for the lifetime of the page.
 */
export interface VerifiedDomainList {
  /** Roster version (semver). Bump on every edit. */
  version: string;
  /** ISO-8601 date the roster was last updated. */
  updatedAt: string;
  /** All verified entries. Order is not significant. */
  domains: VerifiedDomain[];
}

/**
 * Outcome of running `verifyDomain(hostname, list)`.
 *
 *   - `verified`  → the page's eTLD+1 matches a list entry exactly.
 *   - `lookalike` → the eTLD+1 is suspiciously close to a list entry; the
 *                   browser action goes red and the content script does NOT
 *                   render. `reason` distinguishes the detection mode.
 *   - `unknown`   → off-list. Content script exits cleanly.
 */
export type DomainStatus =
  | { kind: 'verified'; domain: VerifiedDomain }
  | {
      kind: 'lookalike';
      nearest: VerifiedDomain;
      distance: number;
      reason: 'levenshtein' | 'homograph' | 'tld_swap';
    }
  | { kind: 'unknown' };

/**
 * Persona variant selected by the user via the popup. Drives both the
 * persona-override layer in rule packs and the renderer's component variant
 * choice. Stored in `chrome.storage.local`. Default: `standard`.
 */
export type Persona = 'pensioner' | 'standard' | 'pro' | 'journalist';

/**
 * A single rule pack — one per shipped domain — describing how to extract a
 * semantic tree from each route the pack covers and how each persona should
 * adapt that tree.
 *
 * Rule packs are **declarative JSON**. They are validated with Zod at load
 * time; their data must never be passed to `innerHTML`, `eval`, or `Function`.
 */
export interface RulePack {
  /** Schema URL, e.g. "https://onegov.ro/schemas/rule-pack-v1.json". */
  $schema: string;
  /** Domain (eTLD+1) the pack covers. Must match the file name. */
  domain: string;
  /** Pack version (semver). */
  version: string;
  /** Routes defined for this domain. */
  routes: Route[];
}

/**
 * A single route inside a rule pack. The `match.pattern` is a regular-expression
 * source string evaluated against `location.pathname`. The first route whose
 * pattern matches wins (no fall-through).
 */
export interface Route {
  /** Pathname matcher. `pattern` is a RegExp source compiled at runtime. */
  match: { pattern: string };
  /** Named layout the renderer resolves to a component tree. */
  layout: string;
  /** Extraction rules executed against the page DOM. */
  extract: ExtractRule[];
  /** Optional per-persona overrides applied to the extracted tree. */
  personas?: Partial<Record<Persona, PersonaOverride>>;
}

/**
 * Per-persona adjustments to a route. Composed by `applyPersonaOverrides`
 * (in `persona.ts`) before the renderer sees the tree.
 *
 *   - `layout`     overrides the route's default layout name.
 *   - `hide`       lists semantic node ids to drop from the rendered tree
 *                  (still extracted, then filtered).
 *   - `emphasize`  lifts the listed ids to the top of the rendered tree,
 *                  preserving their relative order.
 */
export interface PersonaOverride {
  layout?: string;
  hide?: string[];
  emphasize?: string[];
}

/**
 * One extraction rule. The semantic extractor evaluates `selector` against the
 * `SerializableDoc`, takes the first match (or all matches if `multiple`),
 * and produces a `SemanticNode` whose `data` is built from the `attrs` map.
 *
 *   - `id`        Stable identifier across rule pack versions. Used by
 *                 `PersonaOverride.hide` / `emphasize` and by the renderer's
 *                 React-style key strategy.
 *   - `attrs`     Maps an output key to either a DOM attribute name or the
 *                 literal string `"textContent"` to read element text.
 *   - `multiple`  When true, the extractor uses `queryAll` and produces one
 *                 node per match (each gets the same `id` plus an index).
 */
export interface ExtractRule {
  id: string;
  selector: string;
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'form' | 'link' | 'image';
  attrs?: Record<string, string>;
  multiple?: boolean;
}

/**
 * The DOM-free abstraction the semantic extractor operates on. The content
 * script wraps the live `document` in a `SerializableDoc` adapter at the
 * boundary, so `@onegov/core` stays portable to Node tests and v0.2 mobile
 * shells.
 */
export interface SerializableDoc {
  /** Returns the first element matching the CSS selector, or `null`. */
  query(selector: string): SerializableEl | null;
  /** Returns all elements matching the CSS selector. */
  queryAll(selector: string): SerializableEl[];
}

/**
 * The element shape returned by `SerializableDoc`. Mirrors a thin slice of
 * the DOM Element API the extractor actually needs.
 */
export interface SerializableEl {
  /** Lower-case tag name, e.g. "div". */
  tag: string;
  /** Element's `textContent`, trimmed by the adapter. */
  text: string;
  /** Reads an attribute by name; returns `null` if absent. */
  attr(name: string): string | null;
  /** Direct child elements. */
  children: SerializableEl[];
}

/**
 * The structured representation the renderer consumes. Persona overrides
 * have already been applied; the tree is render-ready.
 */
export interface SemanticTree {
  /** Page URL the tree was extracted from. */
  url: string;
  /** Page eTLD+1. */
  domain: string;
  /** Resolved layout name (after persona override). */
  layout: string;
  /** Ordered list of nodes the renderer paints. */
  nodes: SemanticNode[];
}

/**
 * A single semantic node inside `SemanticTree.nodes`. The `data` map is the
 * payload the matching component receives. Components must tolerate missing
 * optional fields and never pass `data` values to `innerHTML`.
 */
export interface SemanticNode {
  /** Stable id, copied from the source `ExtractRule.id` (suffixed for `multiple`). */
  id: string;
  /** Component dispatch tag, taken from `ExtractRule.type`. */
  type: ExtractRule['type'];
  /** Extracted payload. Values are strings or arrays of strings in v0.1. */
  data: Record<string, unknown>;
}
