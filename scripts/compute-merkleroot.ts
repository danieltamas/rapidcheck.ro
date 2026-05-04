#!/usr/bin/env bun
/**
 * Compute a Merkle root over the verified entity directory.
 *
 * Input:   packages/directory/data/entities.json
 * Output:   packages/core/src/merkle-root.ts  (single `export const MERKLE_ROOT = "..."`)
 *
 * The root is also printed to stdout so n8n / CI can capture it for publication
 * to the GitHub Pages _merkleroot.json file.
 *
 * Deterministic: sorted by entity ID so the hash is stable regardless of
 * the order entities appear in the JSON array.
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'crypto';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entitiesPath = resolve(repoRoot, 'packages/directory/data/entities.json');
const outputPath = resolve(repoRoot, 'packages/core/src/merkle-root.ts');
const publicRootPath = resolve(repoRoot, '_merkleroot.json');

const raw = readFileSync(entitiesPath, 'utf-8');
const parsed = JSON.parse(raw) as { version?: string; entities: unknown[] };

// Sort by entity ID for deterministic hashing
parsed.entities.sort((a, b) => {
  const ai = (a as { id: string }).id;
  const bi = (b as { id: string }).id;
  return ai.localeCompare(bi);
});

// Canonical JSON — stable stringification (no trailing space, sorted keys)
const canonical = JSON.stringify(parsed);

// SHA-256 Merkle root over entity hashes
const entityHashes = parsed.entities.map((entity) => {
  const eCanonical = JSON.stringify(entity);
  return createHash('sha256').update(eCanonical).digest('hex');
});

function merkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return createHash('sha256').update('').digest('hex');
  if (hashes.length === 1) return hashes[0]!;
  const next: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i]!;
    const right = hashes[i + 1] ?? left;
    next.push(createHash('sha256').update(left + right).digest('hex'));
  }
  return merkleRoot(next);
}

const root = merkleRoot(entityHashes);

// Write the TypeScript constant
const tsContent = `/**
 * Merkle root of the verified entity directory.
 * Computed at build time from packages/directory/data/entities.json.
 *
 * SHA-256 over canonical JSON (entities sorted by ID), then pair-hashing
 * up the Merkle tree to a single 64-character hex root.
 *
 * Published to rapidcheck.ro/_merkleroot.json for runtime verification.
 */
export const MERKLE_ROOT = "${root}" as const;
`;

writeFileSync(outputPath, tsContent, 'utf-8');

const rootJson = {
  version: parsed.version ?? '0.0.0',
  merkleRoot: root,
  generatedAt: new Date().toISOString(),
  entityCount: parsed.entities.length,
};
writeFileSync(publicRootPath, `${JSON.stringify(rootJson, null, 2)}\n`, 'utf-8');

console.log(root);
console.log('[merkle] written →', outputPath);
console.log('[merkle] published →', publicRootPath);
