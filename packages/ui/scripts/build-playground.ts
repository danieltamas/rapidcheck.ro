#!/usr/bin/env bun
/**
 * Build `playground/playground.css` from `src/theme.css`.
 *
 * The playground is a plain HTML page (no shadow root, no Vite, no JS), so
 * `:host` selectors don't apply. This script rewrites them to a class
 * selector (`.onegov-host`) so the same tokens cascade onto the playground
 * markup. Persona overrides (`:host([data-persona="..."])`) become
 * `.onegov-host[data-persona="..."]` for parity.
 *
 * Run: `bun run --cwd packages/ui build:playground` (or directly:
 * `bun run scripts/build-playground.ts`).
 *
 * Idempotent. Exits non-zero if it cannot read the source.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(here, '..', 'src', 'theme.css');
const outPath = resolve(here, '..', 'playground', 'playground.css');

const css = readFileSync(cssPath, 'utf8');

const rewritten = css
  // :host(<sel>) → .onegov-host<sel>, onegov-host<sel> (parametric selector)
  .replace(/:host\(([^)]+)\)/g, '.onegov-host$1, onegov-host$1')
  // bare :host → .onegov-host, onegov-host
  .replace(/:host\b/g, '.onegov-host, onegov-host')
  // The defensive `all: initial;` reset is great inside a shadow root but
  // would obliterate the playground page chrome. Strip it for the playground.
  .replace(/all:\s*initial;\s*/g, '')
  // Apply box-sizing only inside the host scope, not globally.
  .replace(/^\* \{\s*box-sizing: border-box;\s*\}/gm, '.onegov-host *, onegov-host * { box-sizing: border-box; }');

const banner = `/**
 * GENERATED FROM \`src/theme.css\` by \`scripts/build-playground.ts\`.
 *
 * The playground is a plain HTML page so the canonical \`:host\` selectors
 * (which only apply inside a shadow root) are rewritten to \`.onegov-host\`
 * (or the custom element name \`onegov-host\`). Run the script to regenerate
 * after editing tokens:
 *
 *   bun run --cwd packages/ui build:playground
 */

onegov-host { display: block; }

`;

writeFileSync(outPath, banner + rewritten);

// eslint-disable-next-line no-console
console.log(`[build-playground] wrote ${outPath} (${(rewritten.length / 1024).toFixed(1)} KB)`);
