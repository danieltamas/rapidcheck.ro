/**
 * @onegov/core — public barrel.
 *
 * Re-exports the canonical type contract and the (currently stubbed) engine
 * functions. The implementations of verifier / lookalike / loader / extractor /
 * persona land in Track 2; this barrel is set up here so the dependency graph
 * is in place when those tracks start.
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

// Engine surface — implementations are placeholders until Track 2 lands.
// They are exported so dependent packages can be wired up against the public
// API immediately.
export { verifyDomain } from './domain-verifier.js';
export { findNearest, levenshtein, normalizeHomograph } from './lookalike.js';
export { loadBundled, validate } from './rule-pack-loader.js';
export { extract } from './semantic-extractor.js';
export { applyPersonaOverrides } from './persona.js';
