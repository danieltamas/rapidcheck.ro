#!/usr/bin/env bun
/**
 * Brand-icon generator for the onegov.ro extension.
 *
 * Reads the canonical SVG sources from `packages/extension/icons-src/` and
 * produces all 12 toolbar PNGs (3 states × 4 sizes) into
 * `packages/extension/icons/`. Run via `bun run gen-icons`.
 *
 * Composition rule (Approach B from `jobs/v0.1-foundation/06-brand-icons.md`):
 *   - 16 px: state-coloured monogram only. The brand background (#003B73) is
 *     swapped for the state colour so the icon reads at toolbar size as a
 *     coloured square with a white "g". No corner shield (would be < 6 px
 *     tall and blob into noise).
 *   - 32 / 48 / 128 px: full brand mark in the canonical PANTONE 280C blue
 *     with the appropriate state shield composed into the bottom-right
 *     quadrant at ~40% of the icon size.
 *
 * Renderer is `@resvg/resvg-js` — wasm-backed, no native deps, no
 * `node-forge` in the transitive tree (verified by CI gate). Output PNGs are
 * deterministic (same input → byte-identical bytes), so committing the
 * generated artefacts is safe.
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

type State = 'green' | 'gray' | 'red';
const STATES: readonly State[] = ['green', 'gray', 'red'] as const;
const SIZES = [16, 32, 48, 128] as const;
type Size = (typeof SIZES)[number];

/** Brand background colour as it appears in `brand-mark.svg`. The 16 px
 *  variant swaps this for the state colour. */
const BRAND_BG = '#003B73';

/** WCAG-AA accessible state fills, identical to the values in the shield
 *  SVGs. Keeping them as a single source of truth here lets the gen script
 *  swap them without parsing the shield SVG. */
const STATE_COLORS: Record<State, string> = {
  green: '#0F8A4F',
  gray: '#6B7280',
  red: '#C62828',
};

/** Read an SVG source from `icons-src/`. Throws if missing — the script
 *  should fail loudly so a stale source is never silently rendered. */
function readSvg(name: string): string {
  const path = resolve(srcDir, name);
  if (!existsSync(path)) {
    throw new Error(`Missing SVG source: ${path}`);
  }
  return readFileSync(path, 'utf8');
}

/** Strip the `<?xml … ?>` prologue and any leading whitespace from an SVG
 *  string so it can be embedded as a child of another SVG without confusing
 *  the renderer. */
function stripXmlProlog(svg: string): string {
  return svg.replace(/^\s*<\?xml[^?]*\?>\s*/u, '').trim();
}

/** Replace the brand background fill with `color` so the 16 px variant can
 *  carry the state via the brand-mark itself. We match the literal hex used
 *  in `brand-mark.svg`. Only the rounded-square ground is filled with that
 *  hex today; if a future redesign introduces a second `#003B73` (e.g.
 *  inside a mask), this single-occurrence replace must be re-thought. */
function tintBrandBackground(svg: string, color: string): string {
  return svg.replace(BRAND_BG, color);
}

/**
 * Compose the brand mark with a state shield in the bottom-right corner.
 *
 * Layout (in 128-unit brand grid):
 *   - shield occupies 60×60 starting at (66, 66), i.e. bottom-right quadrant
 *     with 2 units of inner margin
 *   - shield SVG has its own 64-unit viewBox; we wrap it in an `<svg>` with
 *     explicit x/y/width/height so it inherits a clean coordinate space
 */
function composeBrandWithShield(brandSvg: string, shieldSvg: string): string {
  const brandInner = stripBrandWrapper(brandSvg);
  const shieldInner = stripShieldWrapper(shieldSvg);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
${brandInner}
<svg x="66" y="66" width="60" height="60" viewBox="0 0 64 64">
${shieldInner}
</svg>
</svg>`;
}

/** Pull the inner contents out of the brand-mark SVG so we can embed them
 *  inside the composite without nesting `<svg>` roots redundantly. We only
 *  match the outer `<svg …>` pair, never anything else. */
function stripBrandWrapper(svg: string): string {
  const stripped = stripXmlProlog(svg);
  return stripped
    .replace(/^<svg[^>]*>/u, '')
    .replace(/<\/svg>\s*$/u, '')
    .trim();
}

/** Same as `stripBrandWrapper` but also drops the `<title>` element so the
 *  composite has a single title from the outer wrapper (a11y best practice). */
function stripShieldWrapper(svg: string): string {
  const inner = stripBrandWrapper(svg);
  return inner.replace(/<title>[^<]*<\/title>/u, '').trim();
}

/** Render an SVG string to a PNG buffer at the requested square size. */
function rasterize(svg: string, size: number): Buffer {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0, 0, 0, 0)',
  });
  return Buffer.from(r.render().asPng());
}

/** Build the composite SVG for a single (state, size) pair, applying the
 *  Approach-B size policy. */
function buildSvgForVariant(
  brandSvg: string,
  shieldSvgsByState: Record<State, string>,
  state: State,
  size: Size,
): string {
  const shieldSvg = shieldSvgsByState[state];
  if (size === 16) {
    return tintBrandBackground(brandSvg, STATE_COLORS[state]);
  }
  return composeBrandWithShield(brandSvg, shieldSvg);
}

function main(): void {
  mkdirSync(outDir, { recursive: true });

  const brand = readSvg('brand-mark.svg');
  const shields: Record<State, string> = {
    green: readSvg('state-green.svg'),
    gray: readSvg('state-gray.svg'),
    red: readSvg('state-red.svg'),
  };

  let written = 0;
  let totalBytes = 0;
  for (const state of STATES) {
    for (const size of SIZES) {
      const svg = buildSvgForVariant(brand, shields, state, size);
      const png = rasterize(svg, size);
      const filename = `${state}-${size}.png`;
      const out = resolve(outDir, filename);
      writeFileSync(out, png);
      written += 1;
      totalBytes += png.length;
      // eslint-disable-next-line no-console
      console.log(`[gen-icons] wrote ${filename} (${png.length} B)`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[gen-icons] ${written} PNG(s), ${totalBytes} B total → ${outDir}`,
  );
}

try {
  main();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[gen-icons] failed:', err);
  process.exit(1);
}
