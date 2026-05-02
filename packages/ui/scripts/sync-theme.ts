#!/usr/bin/env bun
/**
 * Generate `src/theme.ts` from `src/theme.css`.
 *
 * The renderer ships `theme.css` content as a string inside the bundled
 * shadow root (because Vite's library-mode CSS handling adds a side-effect
 * import that doesn't reach inside a closed shadow root). Keeping the
 * canonical source in `theme.css` gives us proper editor highlighting and
 * tooling, and this script re-emits the TS string so the bundle stays in
 * sync with one command.
 *
 * Run: `bun run scripts/sync-theme.ts` from `packages/ui/`.
 *
 * Idempotent. Exits non-zero if it cannot read the source.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const cssPath = resolve(here, '..', 'src', 'theme.css');
const tsPath = resolve(here, '..', 'src', 'theme.ts');

const css = readFileSync(cssPath, 'utf8');

// Escape backticks and ${ inside the CSS so it can live inside a TS template
// literal without being parsed as an interpolation. ${ becomes ${'$'}{ which
// renders identically once the template runs.
const escaped = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');

const banner = `/**
 * Theme — design tokens as a string the renderer injects into the shadow root.
 *
 * GENERATED FROM \`src/theme.css\` by \`scripts/sync-theme.ts\`. Do not edit
 * this file by hand — modify \`theme.css\` and re-run the sync script:
 *
 *   bun run --cwd packages/ui scripts/sync-theme.ts
 *
 * The CSS lives twice (CSS source for tooling + TS string for the runtime
 * shadow root) because Vite's library-mode CSS handling adds a top-level
 * side-effect import that doesn't reach inside a closed shadow root.
 *
 * Tokens are documented in \`docs/design-system.md\` and mirrored in
 * \`src/tokens.ts\` for typed JS consumption.
 */

import type { Persona } from '@onegov/core';

export const THEME_CSS = \`${escaped}\`;

/**
 * Returns the theme CSS for a given persona. Today the same string ships for
 * every persona — persona variants live entirely in \`:host([data-persona])\`
 * selectors so a single \`<style>\` element covers all four. The function
 * exists so the renderer's call site reads naturally and so a future build
 * step can ship per-persona stripped variants without changing call sites.
 */
export function themeFor(_persona: Persona): string {
  return THEME_CSS;
}
`;

writeFileSync(tsPath, banner);

// eslint-disable-next-line no-console
console.log(`[sync-theme] wrote ${tsPath} (${(escaped.length / 1024).toFixed(1)} KB)`);
