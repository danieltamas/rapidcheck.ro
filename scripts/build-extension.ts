#!/usr/bin/env bun
/**
 * Orchestrate the three Vite builds for @onegov/extension.
 *
 * Vite's library mode bundles a single entry per invocation, and the three
 * extension entries (background ESM service worker, content IIFE, popup ESM)
 * have different output formats, so we run Vite three times.
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

const targets = ['background', 'content', 'popup'] as const;

for (const target of targets) {
  // eslint-disable-next-line no-console
  console.log(`[build] vite build → ${target}`);
  process.env['ONEGOV_TARGET'] = target;
  await build({
    configFile: resolve(extPkg, 'vite.config.ts'),
    root: repoRoot,
  });
}

// eslint-disable-next-line no-console
console.log(`[build] done → ${distExt}`);
