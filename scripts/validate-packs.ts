#!/usr/bin/env bun
/**
 * Validate every JSON file in `rule-packs/` against the rule-pack schema.
 *
 * STATUS: Stub. Track 2 swaps the placeholder loader for the real Zod
 * validator from `@onegov/core`. The stub still walks the directory and
 * sanity-checks that every file is valid JSON, so a malformed file fails
 * the build immediately.
 *
 * The verified-domain roster (`_verified-domains.json`) is also checked —
 * it has its own shape and is not a rule pack, but ill-formed JSON should
 * still fail.
 *
 * Exits 0 on success, 1 on any failure.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const packsDir = resolve(repoRoot, 'rule-packs');

if (!existsSync(packsDir)) {
  // eslint-disable-next-line no-console
  console.log('[validate-packs] no rule-packs/ directory yet — nothing to do');
  process.exit(0);
}

const failures: Array<{ file: string; reason: string }> = [];
let checked = 0;

for (const entry of readdirSync(packsDir)) {
  const full = resolve(packsDir, entry);
  if (!statSync(full).isFile()) continue;
  if (extname(entry) !== '.json') continue;
  checked += 1;
  try {
    JSON.parse(readFileSync(full, 'utf8'));
  } catch (err) {
    failures.push({
      file: entry,
      reason: err instanceof Error ? err.message : String(err),
    });
  }
}

if (failures.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`[validate-packs] ${failures.length} failure(s):`);
  for (const f of failures) {
    // eslint-disable-next-line no-console
    console.error(`  - ${f.file}: ${f.reason}`);
  }
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`[validate-packs] OK — ${checked} file(s) checked`);
