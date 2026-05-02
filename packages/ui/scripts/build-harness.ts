#!/usr/bin/env bun
/**
 * Build the standalone test-harness bundle.
 *
 * Drives Vite via its Node API (not the CLI) for the same reason the
 * extension build does: invoking `bunx vite build` triggers Node's
 * Rollup-native-binary platform detection, which can fail on
 * Apple-Silicon-via-Rosetta. Calling `build()` directly under Bun avoids
 * that path entirely.
 *
 * Output: `packages/ui/dist/harness/renderer.bundle.js`
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { build } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, '..');

await build({ configFile: resolve(pkgRoot, 'vite.config.ts'), root: pkgRoot });

// eslint-disable-next-line no-console
console.log(`[harness] built → ${resolve(pkgRoot, 'dist/harness/renderer.bundle.js')}`);
