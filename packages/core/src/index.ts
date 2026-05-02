/**
 * @onegov/core — public barrel.
 *
 * Re-exports the canonical type contract and the engine surface. Importers
 * (extension shell, UI renderer) should pull every cross-package symbol from
 * here, never deep-import from individual modules.
 */

// Type contract — source of truth, never mutated except via SPEC change.
export type {
  VerifiedDomain,
  VerifiedDomainList,
  DomainStatus,
  Persona,
  RulePack,
  Route,
  PersonaOverride,
  ExtractRule,
  SerializableDoc,
  SerializableEl,
  SemanticTree,
  SemanticNode,
} from './types.js';

// Engine surface — pure functions. No DOM, no chrome.*, no fetch.
export { verifyDomain } from './domain-verifier.js';
export { findNearest, levenshtein, normalizeHomograph } from './lookalike.js';
export type { LookalikeMatch } from './lookalike.js';
export { loadBundled, validate } from './rule-pack-loader.js';
export { extract } from './semantic-extractor.js';
export { applyPersonaOverrides } from './persona.js';
