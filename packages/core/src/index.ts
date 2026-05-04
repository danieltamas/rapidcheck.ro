/**
 * @rapidcheck/core — public barrel.
 *
 * Re-exports the canonical type contract and the engine surface. Importers
 * (extension shell, UI renderer) should pull every cross-package symbol from
 * here, never deep-import from individual modules.
 */

// Type contract.
export type {
  VerifiedDomain,
  VerifiedDomainList,
  DomainStatus,
} from './types.js';

// Engine surface — pure functions. No DOM, no chrome.*, no fetch.
export { verifyDomain } from './domain-verifier.js';
export { MERKLE_ROOT } from './merkle-root.js';
export { findNearest, levenshtein, normalizeHomograph } from './lookalike.js';
export type { LookalikeMatch } from './lookalike.js';
export {
  detectSensitiveData,
  isValidCnp,
  isValidCui,
} from './sensitive-data.js';
export type { SensitiveDataKind, SensitiveDataMatch } from './sensitive-data.js';
export { assessSubmitRisk } from './risk.js';
export type { SubmitRisk, SubmitRiskInput, SubmitRiskLevel } from './risk.js';
