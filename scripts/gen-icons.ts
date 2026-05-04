#!/usr/bin/env bun
/**
 * Brand-icon generator for the RapidCheck.ro extension.
 *
 * Reads the canonical brand SVG from `packages/extension/icons-src/` and
 * produces ONE icon set into `packages/extension/icons/` at four sizes
 * (16/32/48/128). Run via `bun run gen-icons`.
 *
 * v0.1.1 simplification (owner ask 2026-05-02): the toolbar badge
 * (`chrome.action.setBadgeText` + `setBadgeBackgroundColor`) is now the
 * SOLE per-tab state signal — `✓` green for verified, `!` red for
 * lookalike, blank for unknown. The icon itself is always the neutral
 * brand mark; no green/gray/red icon swap, no corner shield. Result:
 * one set of 4 PNGs (was 12), simpler design, smaller dist.
 *
 * Renderer is `@resvg/resvg-js` — wasm-backed, no native deps, no
 * `node-forge` in the transitive tree (verified by CI gate). Output PNGs
 * are deterministic (same input → byte-identical bytes), so committing
 * the generated artefacts is safe.
 *
 * Exits 0 on success, non-zero on any error.
 */

import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const srcDir = resolve(repoRoot, 'packages/extension/icons-src');
const outDir = resolve(repoRoot, 'packages/extension/icons');

const SIZES = [16, 32, 48, 128] as const;
const ICON_BASENAME = 'rapidcheck';

/** Read an SVG source from `icons-src/`. Throws if missing. */
function readSvg(name: string): string {
  const path = resolve(srcDir, name);
  if (!existsSync(path)) {
    throw new Error(`Missing SVG source: ${path}`);
  }
  return readFileSync(path, 'utf8');
}

/** Render an SVG string to a PNG buffer at the requested square size. */
function rasterize(svg: string, size: number): Buffer {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0, 0, 0, 0)',
  });
  return Buffer.from(r.render().asPng());
}

function main(): void {
  mkdirSync(outDir, { recursive: true });
  // Owner-provided canonical brand SVG. Falls back to
  // brand-mark.svg if the explicit file isn't present (keeps the script
  // working in legacy worktrees).
  const brand = existsSync(resolve(srcDir, 'rapidcheck.extension.svg'))
    ? readSvg('rapidcheck.extension.svg')
    : readSvg('brand-mark.svg');

  let written = 0;
  let totalBytes = 0;
  for (const size of SIZES) {
    const png = rasterize(brand, size);
    const filename = `${ICON_BASENAME}-${size}.png`;
    const out = resolve(outDir, filename);
    writeFileSync(out, png);
    written += 1;
    totalBytes += png.length;
    // eslint-disable-next-line no-console
    console.log(`[gen-icons] wrote ${filename} (${png.length} B)`);
  }

  // eslint-disable-next-line no-console
  console.log(`[gen-icons] ${written} PNG(s), ${totalBytes} B total → ${outDir}`);
}

try {
  main();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[gen-icons] failed:', err);
  process.exit(1);
}
