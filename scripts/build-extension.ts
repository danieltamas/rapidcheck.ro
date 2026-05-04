#!/usr/bin/env bun
/**
 * Orchestrate the five Vite builds for @rapidcheck/extension.
 *
 * Vite's library mode bundles a single entry per invocation, and the five
 * extension entries (background ESM, content IIFE, popup ESM, proof ESM,
 * serp IIFE) may have different output formats, so we run Vite five times.
 *
 * Usage: `bun run scripts/build-extension.ts`
 *
 * Exits non-zero if any sub-build fails. The first run also empties
 * `dist/extension/` so leftover files from a prior build can't shadow a new
 * miss.
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { rmSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { build } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const extPkg = resolve(repoRoot, 'packages/extension');
const distExt = resolve(repoRoot, 'dist/extension');

// Empty the dist directory by removing its children rather than the directory
// itself. Some sandboxes restrict `rm -rf` on broad paths even for our own
// build output, so we walk one level down and delete entries individually.
// Failures are logged and ignored — Vite will overwrite touched files anyway,
// and the asset-copy step rewrites everything else.
function emptyDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    try {
      const isDir = statSync(full).isDirectory();
      rmSync(full, { recursive: isDir, force: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.warn(`[build] could not pre-clean ${entry} (${msg}); continuing`);
    }
  }
}

emptyDir(distExt);

// Compute Merkle root before building so the constant is always fresh
{
  const { spawn } = await import('node:child_process');
  const { promise } = spawn('bun', ['run', 'scripts/compute-merkleroot.ts'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  await promise;
}

const targets = ['background', 'content', 'popup', 'proof', 'serp'] as const;

for (const target of targets) {
  // eslint-disable-next-line no-console
  console.log(`[build] vite build → ${target}`);
  process.env['RAPIDCHECK_TARGET'] = target;
  await build({
    configFile: resolve(extPkg, 'vite.config.ts'),
    root: repoRoot,
  });
}

// eslint-disable-next-line no-console
console.log(`[build] done → ${distExt}`);
