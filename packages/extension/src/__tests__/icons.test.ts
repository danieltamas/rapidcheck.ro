/**
 * Smoke tests for the generated brand-icon set.
 *
 * The PNGs in `packages/extension/icons/` are produced by `bun run gen-icons`
 * from the SVG sources in `icons-src/`. We don't pixel-diff (rendering is
 * deterministic but visual regression is hard to assert in a unit test);
 * instead we check the contracts the rest of the extension relies on:
 *
 *   1. Every (state, size) PNG referenced by the manifest exists on disk.
 *   2. Every PNG is a valid PNG (signature + IHDR width/height match the
 *      filename's size).
 *   3. Every PNG is under the 5 KB budget from the task spec.
 *   4. Each filename's stated size matches what the file actually decodes
 *      to (no 32 px file mislabelled as 16 px etc.).
 *
 * If any of these fail, `bun run gen-icons` got out of sync with the
 * manifest and the extension would either refuse to load or load with the
 * wrong-sized icon. Better to catch it in CI than at install time.
 */

import { describe, expect, it } from 'bun:test';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(here, '../../icons');

const STATES = ['green', 'gray', 'red'] as const;
const SIZES = [16, 32, 48, 128] as const;
const MAX_BYTES = 5 * 1024;

/** PNG file signature (magic number). All valid PNGs start with these 8
 *  bytes; we verify it before decoding the IHDR. */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Decode the width/height fields from a PNG buffer's IHDR chunk.
 *  Layout: 8-byte signature, 4-byte length, 4-byte type ("IHDR"), then
 *  the IHDR data (13 bytes) starting with two 32-bit big-endian
 *  width/height integers. */
function readPngDims(buf: Buffer): { width: number; height: number } {
  if (buf.length < 24) throw new Error('PNG too short to contain IHDR');
  const sig = buf.subarray(0, 8);
  if (!sig.equals(PNG_SIGNATURE)) throw new Error('Not a PNG (bad signature)');
  const ihdrType = buf.subarray(12, 16).toString('ascii');
  if (ihdrType !== 'IHDR') throw new Error(`Expected IHDR, got "${ihdrType}"`);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

describe('generated brand icons', () => {
  for (const state of STATES) {
    for (const size of SIZES) {
      const filename = `${state}-${size}.png`;
      const path = resolve(iconsDir, filename);

      it(`${filename} exists`, () => {
        expect(existsSync(path)).toBe(true);
      });

      it(`${filename} is under the 5 KB budget`, () => {
        const bytes = statSync(path).size;
        expect(bytes).toBeLessThanOrEqual(MAX_BYTES);
        expect(bytes).toBeGreaterThan(0);
      });

      it(`${filename} is a valid square PNG of the expected size`, () => {
        const buf = readFileSync(path);
        const { width, height } = readPngDims(buf);
        expect(width).toBe(size);
        expect(height).toBe(size);
      });
    }
  }

  it('total PNG payload is reasonable (< 50 KB combined)', () => {
    let total = 0;
    for (const state of STATES) {
      for (const size of SIZES) {
        total += statSync(resolve(iconsDir, `${state}-${size}.png`)).size;
      }
    }
    // Hard ceiling well above current ~16 KB — guards against accidental
    // bloat (e.g. someone embeds a raster and resvg passes it through).
    expect(total).toBeLessThan(50 * 1024);
  });
});
