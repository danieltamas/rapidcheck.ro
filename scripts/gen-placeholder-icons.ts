#!/usr/bin/env bun
/**
 * Generate placeholder icon PNGs so the manifest references resolve and the
 * extension loads without "Could not load icon" warnings in the
 * `chrome://extensions` error panel.
 *
 * STATUS: scaffold-grade. The real `scripts/gen-icons.ts` (follow-up task)
 * will rasterise an SVG source into the proper green/gray/red brand marks at
 * 16/32/48 px. This script writes flat-color PNGs of the right pixel
 * dimensions, which Chrome accepts.
 *
 * Outputs into `packages/extension/icons/` so the Vite copy step picks them
 * up on the next `bun run build`.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const iconsDir = resolve(repoRoot, 'packages/extension/icons');
mkdirSync(iconsDir, { recursive: true });

type Rgb = [number, number, number];
const COLORS: Record<string, Rgb> = {
  // Loose, accessible approximations of the state-machine colours. The
  // follow-up gen-icons task swaps these for the real brand marks.
  green: [0x2e, 0x7d, 0x32],
  gray: [0x90, 0x90, 0x90],
  red: [0xc6, 0x28, 0x28],
};

const SIZES = [16, 32, 48] as const;

function crc32(buf: Uint8Array): number {
  let c: number;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    const idx = (crc ^ (buf[i] ?? 0)) & 0xff;
    crc = ((crc >>> 8) ^ (table[idx] ?? 0)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePng(size: number, [r, g, b]: Rgb): Buffer {
  // PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR — width, height, bit depth=8, colour type=2 (RGB), compression=0,
  // filter=0, interlace=0
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(2, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  // IDAT — raw pixel data: per row a filter byte (0) then RGB triplets
  const rowLen = 1 + size * 3;
  const raw = Buffer.alloc(rowLen * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const off = y * rowLen + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }
  const idatData = deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

let count = 0;
for (const [name, rgb] of Object.entries(COLORS)) {
  for (const size of SIZES) {
    const out = resolve(iconsDir, `${name}-${size}.png`);
    writeFileSync(out, makePng(size, rgb));
    count += 1;
  }
}

// eslint-disable-next-line no-console
console.log(`[gen-placeholder-icons] wrote ${count} PNG(s) to ${iconsDir}`);
