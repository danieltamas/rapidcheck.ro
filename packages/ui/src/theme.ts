/**
 * Theme — design tokens as a string the renderer injects into the shadow root.
 *
 * GENERATED FROM `src/theme.css` by `scripts/sync-theme.ts`. Do not edit
 * this file by hand — modify `theme.css` and re-run the sync script:
 *
 *   bun run --cwd packages/ui scripts/sync-theme.ts
 *
 * The CSS lives twice (CSS source for tooling + TS string for the runtime
 * shadow root) because Vite's library-mode CSS handling adds a top-level
 * side-effect import that doesn't reach inside a closed shadow root.
 *
 * Tokens are documented in `docs/design-system.md` and mirrored in
 * `src/tokens.ts` for typed JS consumption.
 */

import type { Persona } from '@onegov/core';

export const THEME_CSS = `/**
 * @onegov/ui — comprehensive design tokens, scoped to the closed shadow root.
 *
 * v0.2.0 design system foundation. Adopts identitate.gov.ro published tokens
 * as ground truth (PANTONE 280C blue, recommended fonts) and expands them
 * into a complete, reusable token set that powers every component shipped by
 * the library.
 *
 * Scope: a single default token set on \`:host\` plus three persona overrides
 * via \`:host([data-persona="<name>"])\`. The renderer flips \`data-persona\` on
 * the shadow host element so cascades take effect without re-injecting CSS.
 *
 * Defensive reset: every element under the root drops to a known baseline so
 * the surrounding page stylesheet can never bleed through (closed shadow root
 * already isolates us, but a defensive reset keeps render output predictable).
 *
 * Token categories (all mirrored in \`tokens.ts\` for typed JS consumption):
 *   --onegov-color-*       primary + neutral 50→900 + status (success/warning/danger/info) + surface
 *   --onegov-fs-*          typography font-size scale (xs → 4xl)
 *   --onegov-fw-*          font-weight scale (light/regular/medium/semibold/bold)
 *   --onegov-lh-*          line-height scale (tight/snug/normal/relaxed/loose)
 *   --onegov-ls-*          letter-spacing scale (tight/normal/wide)
 *   --onegov-font-*        font family stacks (display, body, mono)
 *   --onegov-sp-*          4px-based spacing scale (0 → 32, ~15 stops)
 *   --onegov-radius-*      border-radius scale (sm/md/lg/xl/full)
 *   --onegov-shadow-*      elevation scale (sm/md/lg/xl/inner)
 *   --onegov-duration-*    motion durations (75/100/150/200/300/500ms)
 *   --onegov-ease-*        motion easings (standard, emphasized, bounce)
 *   --onegov-bp-*          breakpoints (sm/md/lg/xl/2xl) — read by container queries
 *   --onegov-z-*           z-index scale (base/dropdown/sticky/modal/popover/tooltip/toast/max)
 *   --onegov-focus-*       focus-ring tokens (color, width, offset)
 *   --onegov-target-size   minimum touch-target (WCAG)
 *
 * Legacy tokens (preserved byte-equal for back-compat with v0.1 code):
 *   --onegov-color-{primary, bg, surface, text, muted, border, link*, danger,
 *                   success, warning}
 *   --onegov-font-{base, mono, size-base, size-small, size-h1..h3,
 *                  weight-body, weight-strong}
 *   --onegov-line-height, --onegov-line-height-heading
 *   --onegov-spacing*, --onegov-max-width
 *   --onegov-radius (legacy alias for --onegov-radius-sm)
 *   --onegov-radius-large (legacy alias for --onegov-radius-md)
 *   --onegov-shadow (legacy alias for --onegov-shadow-sm)
 *   --onegov-shadow-elevated (legacy alias for --onegov-shadow-md)
 *   --onegov-transition-fast, --onegov-transition-medium
 */

:host {
  /* ─── Brand identity (identitate.gov.ro PANTONE 280C) ──────────────── */
  --onegov-color-primary: #003b73;
  --onegov-color-primary-hover: #1d4f9b;
  --onegov-color-primary-active: #002a5a;
  --onegov-color-primary-soft: #e8eef6;
  --onegov-color-primary-contrast: #ffffff;

  /* ─── Surface tokens ──────────────────────────────────────────────── */
  --onegov-color-bg: #ffffff;
  --onegov-color-surface: #f7f9fc;
  --onegov-color-surface-elevated: #ffffff;
  --onegov-color-surface-sunken: #eef2f6;
  --onegov-color-text: #1a1a1a;
  --onegov-color-text-strong: #0b1320;
  --onegov-color-muted: #5b6b7d;
  --onegov-color-subtle: #94a0ae;
  --onegov-color-border: #d0d7de;
  --onegov-color-border-strong: #c0c8d2;
  --onegov-color-overlay: rgba(15, 23, 42, 0.5);
  --onegov-color-overlay-strong: rgba(15, 23, 42, 0.7);

  /* ─── Links ───────────────────────────────────────────────────────── */
  --onegov-color-link: #003b73;
  --onegov-color-link-hover: #1d4f9b;
  --onegov-color-link-visited: #5b3a8a;

  /* ─── Status colors ───────────────────────────────────────────────── */
  --onegov-color-danger: #b3261e;
  --onegov-color-danger-hover: #8e1e18;
  --onegov-color-danger-soft: #fbeaea;
  --onegov-color-success: #1f7a3a;
  --onegov-color-success-hover: #18602e;
  --onegov-color-success-soft: #e7f4ec;
  --onegov-color-warning: #b06700;
  --onegov-color-warning-hover: #875000;
  --onegov-color-warning-soft: #fbf1de;
  --onegov-color-info: #1d4f9b;
  --onegov-color-info-hover: #163e7a;
  --onegov-color-info-soft: #e8efff;

  /* ─── 9-step neutral ramp ─────────────────────────────────────────── */
  --onegov-color-neutral-50: #f7f9fc;
  --onegov-color-neutral-100: #eef1f4;
  --onegov-color-neutral-200: #d9dee5;
  --onegov-color-neutral-300: #c0c8d2;
  --onegov-color-neutral-400: #94a0ae;
  --onegov-color-neutral-500: #6b7888;
  --onegov-color-neutral-600: #4f5b6c;
  --onegov-color-neutral-700: #38424f;
  --onegov-color-neutral-800: #232b35;
  --onegov-color-neutral-900: #111720;

  /* ─── Typography — families ───────────────────────────────────────── */
  --onegov-font-base: Arial, Calibri, Verdana, Tahoma, Trebuchet MS, Ubuntu, sans-serif;
  --onegov-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --onegov-font-display: system-ui, -apple-system, "Segoe UI", Roboto, "Inter",
    "Helvetica Neue", Arial, sans-serif;

  /* ─── Typography — legacy size aliases (kept for v0.1 components) ── */
  --onegov-font-size-base: 16px;
  --onegov-font-size-small: 14px;
  --onegov-font-size-h1: 32px;
  --onegov-font-size-h2: 24px;
  --onegov-font-size-h3: 19px;
  --onegov-line-height: 1.55;
  --onegov-line-height-heading: 1.25;
  --onegov-font-weight-body: 400;
  --onegov-font-weight-strong: 700;

  /* ─── Typography — premium scale (xs → 4xl) ───────────────────────── */
  --onegov-fs-xs: 12px;
  --onegov-fs-sm: 14px;
  --onegov-fs-md: 16px;
  --onegov-fs-lg: 20px;
  --onegov-fs-xl: 24px;
  --onegov-fs-2xl: 32px;
  --onegov-fs-3xl: 40px;
  --onegov-fs-4xl: 56px;

  /* ─── Typography — weights ────────────────────────────────────────── */
  --onegov-fw-light: 300;
  --onegov-fw-regular: 400;
  --onegov-fw-medium: 500;
  --onegov-fw-semibold: 600;
  --onegov-fw-bold: 700;

  /* ─── Typography — line-heights ───────────────────────────────────── */
  --onegov-lh-tight: 1.15;
  --onegov-lh-snug: 1.3;
  --onegov-lh-normal: 1.55;
  --onegov-lh-relaxed: 1.7;
  --onegov-lh-loose: 1.9;

  /* ─── Typography — letter-spacing ─────────────────────────────────── */
  --onegov-ls-tight: -0.02em;
  --onegov-ls-snug: -0.01em;
  --onegov-ls-normal: 0;
  --onegov-ls-wide: 0.02em;
  --onegov-ls-wider: 0.06em;

  /* ─── Spacing — legacy 8px scale (kept byte-equal) ────────────────── */
  --onegov-spacing: 8px;
  --onegov-spacing-half: 4px;
  --onegov-spacing-2x: 16px;
  --onegov-spacing-3x: 24px;
  --onegov-spacing-4x: 32px;

  /* ─── Spacing — premium 4px-based scale ───────────────────────────── */
  --onegov-sp-0: 0;
  --onegov-sp-1: 4px;
  --onegov-sp-2: 8px;
  --onegov-sp-3: 12px;
  --onegov-sp-4: 16px;
  --onegov-sp-5: 20px;
  --onegov-sp-6: 24px;
  --onegov-sp-7: 32px;
  --onegov-sp-8: 40px;
  --onegov-sp-9: 48px;
  --onegov-sp-10: 56px;
  --onegov-sp-11: 64px;
  --onegov-sp-12: 72px;
  --onegov-sp-14: 80px;
  --onegov-sp-16: 96px;
  --onegov-sp-20: 128px;

  /* ─── Layout ──────────────────────────────────────────────────────── */
  --onegov-max-width: 1280px;
  --onegov-container-sm: 640px;
  --onegov-container-md: 768px;
  --onegov-container-lg: 1024px;
  --onegov-container-xl: 1280px;
  --onegov-container-2xl: 1536px;

  /* ─── Radius (legacy + premium) ───────────────────────────────────── */
  --onegov-radius: 4px;
  --onegov-radius-large: 8px;
  --onegov-radius-sm: 4px;
  --onegov-radius-md: 8px;
  --onegov-radius-lg: 16px;
  --onegov-radius-xl: 24px;
  --onegov-radius-full: 9999px;

  /* ─── Shadows / elevation ─────────────────────────────────────────── */
  --onegov-shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 4px rgba(15, 23, 42, 0.04);
  --onegov-shadow-elevated: 0 4px 12px rgba(15, 23, 42, 0.1);
  --onegov-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
  --onegov-shadow-md: 0 2px 6px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
  --onegov-shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06);
  --onegov-shadow-xl: 0 24px 56px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.08);
  --onegov-shadow-inner: inset 0 1px 2px rgba(15, 23, 42, 0.08);

  /* ─── Motion ──────────────────────────────────────────────────────── */
  --onegov-transition-fast: 120ms ease-out;
  --onegov-transition-medium: 200ms ease-out;
  --onegov-duration-75: 75ms;
  --onegov-duration-100: 100ms;
  --onegov-duration-fast: 120ms;
  --onegov-duration-150: 150ms;
  --onegov-duration-base: 200ms;
  --onegov-duration-300: 300ms;
  --onegov-duration-slow: 320ms;
  --onegov-duration-500: 500ms;
  --onegov-ease-standard: cubic-bezier(0.2, 0, 0.2, 1);
  --onegov-ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --onegov-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ─── Breakpoints (informational; for container queries / JS reads) ─ */
  --onegov-bp-sm: 640px;
  --onegov-bp-md: 768px;
  --onegov-bp-lg: 1024px;
  --onegov-bp-xl: 1280px;
  --onegov-bp-2xl: 1536px;

  /* ─── Z-index scale ───────────────────────────────────────────────── */
  --onegov-z-base: 0;
  --onegov-z-raised: 10;
  --onegov-z-dropdown: 100;
  --onegov-z-sticky: 200;
  --onegov-z-overlay: 900;
  --onegov-z-modal: 1000;
  --onegov-z-popover: 1100;
  --onegov-z-tooltip: 1200;
  --onegov-z-toast: 1300;
  --onegov-z-max: 9999;

  /* ─── Focus / accessibility ───────────────────────────────────────── */
  --onegov-focus-ring: 2px solid #1d4f9b;
  --onegov-focus-ring-color: #1d4f9b;
  --onegov-focus-ring-width: 2px;
  --onegov-focus-offset: 2px;
  --onegov-target-size: 44px;
}

/* ─── Persona overrides ───────────────────────────────────────────── */

:host([data-persona='pensioner']) {
  --onegov-font-size-base: 20px;
  --onegov-font-size-small: 18px;
  --onegov-font-size-h1: 40px;
  --onegov-font-size-h2: 30px;
  --onegov-font-size-h3: 24px;
  --onegov-line-height: 1.7;
  --onegov-spacing: 16px;
  --onegov-spacing-half: 8px;
  --onegov-spacing-2x: 32px;
  --onegov-spacing-3x: 48px;
  --onegov-spacing-4x: 64px;
  --onegov-radius: 6px;
  --onegov-radius-large: 12px;
  --onegov-target-size: 56px;
  --onegov-fs-md: 20px;
  --onegov-fs-sm: 18px;
}

:host([data-persona='pro']) {
  --onegov-font-size-base: 14px;
  --onegov-font-size-small: 12px;
  --onegov-font-size-h1: 22px;
  --onegov-font-size-h2: 18px;
  --onegov-font-size-h3: 16px;
  --onegov-line-height: 1.4;
  --onegov-spacing: 4px;
  --onegov-spacing-half: 2px;
  --onegov-spacing-2x: 8px;
  --onegov-spacing-3x: 12px;
  --onegov-spacing-4x: 16px;
  --onegov-radius: 2px;
  --onegov-radius-large: 4px;
}

:host([data-persona='journalist']) {
  --onegov-font-size-base: 15px;
  --onegov-font-size-small: 13px;
  --onegov-font-size-h1: 26px;
  --onegov-font-size-h2: 20px;
  --onegov-font-size-h3: 17px;
  --onegov-spacing: 8px;
  --onegov-spacing-2x: 16px;
  --onegov-color-warning: #d96b00;
  --onegov-color-surface: #fdf6e3;
}

/* ─── Defensive reset (defense in depth) ──────────────────────────── */

:host {
  all: initial;
  display: block;
  font-family: var(--onegov-font-base);
  font-size: var(--onegov-font-size-base);
  line-height: var(--onegov-line-height);
  color: var(--onegov-color-text);
  background: var(--onegov-color-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

/* ─── Focus rings — explicit, never removed ───────────────────────── */
:host *:focus-visible {
  outline: var(--onegov-focus-ring);
  outline-offset: var(--onegov-focus-offset);
  border-radius: 2px;
}

/* ─── Reduced motion ──────────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  :host {
    --onegov-transition-fast: 0ms;
    --onegov-transition-medium: 0ms;
    --onegov-duration-fast: 0ms;
    --onegov-duration-base: 0ms;
    --onegov-duration-slow: 0ms;
    --onegov-duration-75: 0ms;
    --onegov-duration-100: 0ms;
    --onegov-duration-150: 0ms;
    --onegov-duration-300: 0ms;
    --onegov-duration-500: 0ms;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0ms !important;
    scroll-behavior: auto !important;
  }
}

/* =================================================================== */
/* App layout                                                          */
/* =================================================================== */

.onegov-app {
  margin: 0 auto;
  max-width: var(--onegov-max-width);
  padding: var(--onegov-spacing-3x) var(--onegov-spacing-2x);
}
.onegov-app--pro {
  padding: var(--onegov-spacing-2x);
}
.onegov-app--pensioner {
  padding: var(--onegov-spacing-4x) var(--onegov-spacing-3x);
}

/* =================================================================== */
/* Layout primitives — Stack / Cluster / Inline / Container            */
/* =================================================================== */

.onegov-stack {
  display: flex;
  flex-direction: column;
  gap: var(--onegov-sp-4);
}
.onegov-stack--xs { gap: var(--onegov-sp-1); }
.onegov-stack--sm { gap: var(--onegov-sp-2); }
.onegov-stack--md { gap: var(--onegov-sp-4); }
.onegov-stack--lg { gap: var(--onegov-sp-6); }
.onegov-stack--xl { gap: var(--onegov-sp-9); }
.onegov-stack--align-start { align-items: flex-start; }
.onegov-stack--align-center { align-items: center; }
.onegov-stack--align-end { align-items: flex-end; }
.onegov-stack--align-stretch { align-items: stretch; }

.onegov-cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--onegov-sp-3);
  align-items: center;
}
.onegov-cluster--xs { gap: var(--onegov-sp-1); }
.onegov-cluster--sm { gap: var(--onegov-sp-2); }
.onegov-cluster--md { gap: var(--onegov-sp-3); }
.onegov-cluster--lg { gap: var(--onegov-sp-5); }
.onegov-cluster--justify-start { justify-content: flex-start; }
.onegov-cluster--justify-center { justify-content: center; }
.onegov-cluster--justify-end { justify-content: flex-end; }
.onegov-cluster--justify-between { justify-content: space-between; }

.onegov-inline {
  display: inline-flex;
  align-items: center;
  gap: var(--onegov-sp-2);
}

.onegov-container {
  margin: 0 auto;
  padding-left: var(--onegov-sp-5);
  padding-right: var(--onegov-sp-5);
  width: 100%;
}
.onegov-container--sm { max-width: var(--onegov-container-sm); }
.onegov-container--md { max-width: var(--onegov-container-md); }
.onegov-container--lg { max-width: var(--onegov-container-lg); }
.onegov-container--xl { max-width: var(--onegov-container-xl); }
.onegov-container--2xl { max-width: var(--onegov-container-2xl); }

/* =================================================================== */
/* Typography                                                          */
/* =================================================================== */

.onegov-h1,
.onegov-h2,
.onegov-h3,
.onegov-h4,
.onegov-h5,
.onegov-h6 {
  margin: 0 0 var(--onegov-spacing-2x);
  font-weight: var(--onegov-font-weight-strong);
  line-height: var(--onegov-line-height-heading);
  color: var(--onegov-color-primary);
  letter-spacing: var(--onegov-ls-snug);
  font-family: var(--onegov-font-display);
}
.onegov-h1 { font-size: var(--onegov-font-size-h1); }
.onegov-h2 { font-size: var(--onegov-font-size-h2); }
.onegov-h3 { font-size: var(--onegov-font-size-h3); }
.onegov-h4 { font-size: var(--onegov-fs-lg); }
.onegov-h5 { font-size: var(--onegov-fs-md); }
.onegov-h6 {
  font-size: var(--onegov-fs-sm);
  text-transform: uppercase;
  letter-spacing: var(--onegov-ls-wider);
}
.onegov-h--display {
  font-size: var(--onegov-fs-4xl);
  letter-spacing: var(--onegov-ls-tight);
  line-height: 1.05;
}

.onegov-eyebrow {
  display: block;
  font-size: var(--onegov-fs-xs);
  font-weight: var(--onegov-fw-semibold);
  text-transform: uppercase;
  letter-spacing: var(--onegov-ls-wider);
  color: var(--onegov-color-muted);
  margin-bottom: var(--onegov-sp-2);
}
.onegov-subtitle {
  display: block;
  margin-top: var(--onegov-sp-3);
  font-size: var(--onegov-fs-lg);
  font-weight: var(--onegov-fw-regular);
  color: var(--onegov-color-muted);
  letter-spacing: 0;
}

.onegov-p {
  margin: 0 0 var(--onegov-spacing-2x);
  color: var(--onegov-color-text);
  font-size: var(--onegov-font-size-base);
}
.onegov-p--muted {
  color: var(--onegov-color-muted);
  font-size: var(--onegov-font-size-small);
}
.onegov-p--lead {
  font-size: var(--onegov-fs-lg);
  line-height: var(--onegov-lh-snug);
  color: var(--onegov-color-text-strong);
}
.onegov-p--small { font-size: var(--onegov-font-size-small); }
.onegov-p--mono {
  font-family: var(--onegov-font-mono);
  font-size: var(--onegov-fs-sm);
}

/* =================================================================== */
/* Lists                                                               */
/* =================================================================== */

.onegov-list {
  margin: 0 0 var(--onegov-spacing-2x);
  padding-left: var(--onegov-spacing-3x);
}
.onegov-list li {
  margin-bottom: var(--onegov-spacing-half);
}
.onegov-list--divided {
  list-style: none;
  padding-left: 0;
}
.onegov-list--divided li {
  padding: var(--onegov-sp-3) 0;
  border-bottom: 1px solid var(--onegov-color-border);
}
.onegov-list--divided li:last-child {
  border-bottom: none;
}
.onegov-list--action {
  list-style: none;
  padding-left: 0;
}
.onegov-list--action li {
  padding: 0;
  margin: 0;
}
.onegov-list-action__row {
  display: flex;
  align-items: center;
  gap: var(--onegov-sp-3);
  padding: var(--onegov-sp-3) var(--onegov-sp-4);
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius-md);
  background: var(--onegov-color-bg);
  color: var(--onegov-color-text);
  text-decoration: none;
  font: inherit;
  cursor: pointer;
  transition:
    border-color var(--onegov-duration-fast) var(--onegov-ease-standard),
    background var(--onegov-duration-fast) var(--onegov-ease-standard),
    transform var(--onegov-duration-fast) var(--onegov-ease-standard);
  width: 100%;
  text-align: left;
}
.onegov-list-action__row + .onegov-list-action__row {
  margin-top: var(--onegov-sp-2);
}
.onegov-list-action__row:hover {
  border-color: var(--onegov-color-primary);
  background: var(--onegov-color-primary-soft);
}
.onegov-list-action__row:active {
  transform: scale(0.99);
}
.onegov-list-action__icon {
  color: var(--onegov-color-primary);
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
}
.onegov-list-action__body {
  flex: 1 1 auto;
}
.onegov-list--definition {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--onegov-sp-2) var(--onegov-sp-5);
  margin: 0;
  padding: 0;
}
.onegov-list--definition dt {
  font-weight: var(--onegov-fw-semibold);
  color: var(--onegov-color-muted);
  font-size: var(--onegov-fs-sm);
}
.onegov-list--definition dd {
  margin: 0;
  color: var(--onegov-color-text);
}

/* =================================================================== */
/* Tables                                                              */
/* =================================================================== */

.onegov-table-wrap {
  margin: 0 0 var(--onegov-spacing-2x);
  overflow-x: auto;
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius);
}
.onegov-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--onegov-font-size-base);
}
.onegov-table th,
.onegov-table td {
  padding: var(--onegov-spacing) var(--onegov-spacing-2x);
  text-align: left;
  border-bottom: 1px solid var(--onegov-color-border);
  vertical-align: top;
}
.onegov-table th {
  background: var(--onegov-color-surface);
  font-weight: var(--onegov-font-weight-strong);
  color: var(--onegov-color-primary);
}
.onegov-table tr:last-child td {
  border-bottom: none;
}
.onegov-table--journalist th,
.onegov-table--journalist td {
  white-space: nowrap;
}
.onegov-table--sticky thead th {
  position: sticky;
  top: 0;
  z-index: 1;
}
.onegov-table__sort {
  display: inline-flex;
  align-items: center;
  gap: var(--onegov-sp-1);
  background: transparent;
  border: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  padding: 0;
}
.onegov-table__sort-icon {
  opacity: 0.6;
  transition: opacity var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-table__sort:hover .onegov-table__sort-icon { opacity: 1; }

/* =================================================================== */
/* Form                                                                */
/* =================================================================== */

.onegov-form {
  display: grid;
  gap: var(--onegov-spacing-2x);
  margin: 0 0 var(--onegov-spacing-2x);
}
.onegov-field {
  display: grid;
  gap: var(--onegov-spacing-half);
}
.onegov-field__label {
  font-weight: var(--onegov-font-weight-strong);
  color: var(--onegov-color-text);
  font-size: var(--onegov-fs-sm);
}
.onegov-field__required {
  color: var(--onegov-color-danger);
  margin-left: 2px;
}
.onegov-field__input,
.onegov-field__textarea,
.onegov-field__select {
  font: inherit;
  color: var(--onegov-color-text);
  background: var(--onegov-color-bg);
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius);
  padding: var(--onegov-spacing) var(--onegov-spacing-2x);
  min-height: var(--onegov-target-size);
  width: 100%;
  transition:
    border-color var(--onegov-duration-fast) var(--onegov-ease-standard),
    box-shadow var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-field__input:hover:not(:disabled),
.onegov-field__textarea:hover:not(:disabled),
.onegov-field__select:hover:not(:disabled) {
  border-color: var(--onegov-color-border-strong);
}
.onegov-field__input:focus,
.onegov-field__textarea:focus,
.onegov-field__select:focus {
  border-color: var(--onegov-color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(29, 79, 155, 0.18);
}
.onegov-field__input:disabled,
.onegov-field__textarea:disabled,
.onegov-field__select:disabled {
  background: var(--onegov-color-neutral-100);
  color: var(--onegov-color-muted);
  cursor: not-allowed;
}
.onegov-field--error .onegov-field__input,
.onegov-field--error .onegov-field__textarea,
.onegov-field--error .onegov-field__select {
  border-color: var(--onegov-color-danger);
}
.onegov-field--error .onegov-field__input:focus,
.onegov-field--error .onegov-field__textarea:focus,
.onegov-field--error .onegov-field__select:focus {
  box-shadow: 0 0 0 3px rgba(179, 38, 30, 0.18);
}
.onegov-field__hint {
  color: var(--onegov-color-muted);
  font-size: var(--onegov-font-size-small);
}
.onegov-field__error {
  color: var(--onegov-color-danger);
  font-size: var(--onegov-font-size-small);
  font-weight: var(--onegov-fw-medium);
}
.onegov-field__readonly-banner {
  font-size: var(--onegov-font-size-small);
  color: var(--onegov-color-muted);
  border-left: 3px solid var(--onegov-color-warning);
  padding-left: var(--onegov-spacing);
  margin-bottom: var(--onegov-spacing);
}

.onegov-field__group {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 0;
}
.onegov-field__affix {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--onegov-sp-3);
  border: 1px solid var(--onegov-color-border);
  background: var(--onegov-color-surface);
  color: var(--onegov-color-muted);
  font-size: var(--onegov-fs-sm);
}
.onegov-field__affix--leading {
  border-right: 0;
  border-radius: var(--onegov-radius) 0 0 var(--onegov-radius);
}
.onegov-field__affix--trailing {
  border-left: 0;
  border-radius: 0 var(--onegov-radius) var(--onegov-radius) 0;
}
.onegov-field__group .onegov-field__input { flex: 1 1 auto; }
.onegov-field__group .onegov-field__affix--leading + .onegov-field__input { border-radius: 0 var(--onegov-radius) var(--onegov-radius) 0; }
.onegov-field__group .onegov-field__input:has(+ .onegov-field__affix--trailing) { border-radius: var(--onegov-radius) 0 0 var(--onegov-radius); }

/* Checkbox / Radio / Switch */
.onegov-check {
  display: inline-flex;
  align-items: center;
  gap: var(--onegov-sp-2);
  cursor: pointer;
  font-size: var(--onegov-fs-md);
  color: var(--onegov-color-text);
  user-select: none;
  padding: var(--onegov-sp-1) 0;
}
.onegov-check input[type='checkbox'],
.onegov-check input[type='radio'] {
  appearance: none;
  width: 18px;
  height: 18px;
  margin: 0;
  border: 1.5px solid var(--onegov-color-border-strong);
  background: var(--onegov-color-bg);
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  cursor: pointer;
  transition:
    background var(--onegov-duration-fast) var(--onegov-ease-standard),
    border-color var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-check input[type='checkbox'] {
  border-radius: var(--onegov-radius-sm);
}
.onegov-check input[type='radio'] {
  border-radius: var(--onegov-radius-full);
}
.onegov-check input[type='checkbox']:checked,
.onegov-check input[type='radio']:checked {
  background: var(--onegov-color-primary);
  border-color: var(--onegov-color-primary);
}
.onegov-check input[type='checkbox']:checked::after {
  content: '';
  width: 10px;
  height: 6px;
  border-left: 2px solid var(--onegov-color-primary-contrast);
  border-bottom: 2px solid var(--onegov-color-primary-contrast);
  transform: rotate(-45deg) translate(1px, -1px);
}
.onegov-check input[type='radio']:checked::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: var(--onegov-radius-full);
  background: var(--onegov-color-primary-contrast);
}
.onegov-check input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.onegov-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--onegov-sp-3);
  cursor: pointer;
  user-select: none;
  font-size: var(--onegov-fs-md);
}
.onegov-switch__track {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: var(--onegov-radius-full);
  background: var(--onegov-color-neutral-300);
  transition: background var(--onegov-duration-fast) var(--onegov-ease-standard);
  flex: 0 0 auto;
}
.onegov-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: var(--onegov-radius-full);
  background: var(--onegov-color-primary-contrast);
  box-shadow: var(--onegov-shadow-sm);
  transition: transform var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-switch input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.onegov-switch input:checked ~ .onegov-switch__track {
  background: var(--onegov-color-primary);
}
.onegov-switch input:checked ~ .onegov-switch__track .onegov-switch__thumb {
  transform: translateX(16px);
}
.onegov-switch input:disabled ~ .onegov-switch__track {
  opacity: 0.5;
  cursor: not-allowed;
}

.onegov-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--onegov-sp-3);
  padding-top: var(--onegov-sp-4);
  margin-top: var(--onegov-sp-2);
  border-top: 1px solid var(--onegov-color-border);
}
.onegov-form-actions--start { justify-content: flex-start; }
.onegov-form-actions--center { justify-content: center; }
.onegov-form-actions--between { justify-content: space-between; }
.onegov-form-actions--no-divider {
  border-top: 0;
  padding-top: 0;
}

/* =================================================================== */
/* Link                                                                */
/* =================================================================== */

.onegov-link {
  color: var(--onegov-color-link);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-link:hover {
  color: var(--onegov-color-link-hover);
}
.onegov-link--blocked {
  color: var(--onegov-color-text);
  text-decoration: none;
  cursor: default;
}
.onegov-link--quiet {
  text-decoration: none;
}
.onegov-link--quiet:hover {
  text-decoration: underline;
}

/* =================================================================== */
/* Card                                                                */
/* =================================================================== */

.onegov-card {
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius-large);
  padding: var(--onegov-spacing-2x);
  background: var(--onegov-color-bg);
  box-shadow: var(--onegov-shadow);
  margin: 0 0 var(--onegov-spacing-2x);
}
.onegov-card__title {
  margin: 0 0 var(--onegov-spacing);
  font-size: var(--onegov-font-size-h3);
  color: var(--onegov-color-primary);
}
.onegov-card--premium {
  border: 1px solid var(--onegov-color-neutral-200);
  border-radius: var(--onegov-radius-lg);
  padding: var(--onegov-sp-6);
  background: var(--onegov-color-bg);
  box-shadow: var(--onegov-shadow-sm);
  margin: 0 0 var(--onegov-sp-5);
  transition: box-shadow var(--onegov-duration-base) var(--onegov-ease-standard);
}
.onegov-card--premium:hover { box-shadow: var(--onegov-shadow-md); }
.onegov-card--interactive {
  cursor: pointer;
  transition:
    transform var(--onegov-duration-150) var(--onegov-ease-standard),
    box-shadow var(--onegov-duration-150) var(--onegov-ease-standard),
    border-color var(--onegov-duration-150) var(--onegov-ease-standard);
}
.onegov-card--interactive:hover {
  transform: translateY(-2px);
  box-shadow: var(--onegov-shadow-md);
  border-color: var(--onegov-color-border-strong);
}
.onegov-card--interactive:active {
  transform: translateY(0) scale(0.99);
  box-shadow: var(--onegov-shadow-sm);
}
.onegov-card--media { padding: 0; overflow: hidden; }
.onegov-card__media {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--onegov-color-surface);
  object-fit: cover;
}
.onegov-card__body { padding: var(--onegov-sp-5); }
.onegov-card__header {
  display: flex;
  align-items: center;
  gap: var(--onegov-sp-3);
  padding: var(--onegov-sp-4) var(--onegov-sp-5);
  border-bottom: 1px solid var(--onegov-color-neutral-100);
}
.onegov-card__footer {
  padding: var(--onegov-sp-4) var(--onegov-sp-5);
  border-top: 1px solid var(--onegov-color-neutral-100);
  background: var(--onegov-color-neutral-50);
}

/* =================================================================== */
/* Button                                                              */
/* =================================================================== */

.onegov-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--onegov-sp-2);
  font: inherit;
  font-family: var(--onegov-font-display);
  font-weight: var(--onegov-fw-semibold);
  letter-spacing: var(--onegov-ls-snug);
  min-height: var(--onegov-target-size);
  min-width: var(--onegov-target-size);
  padding: var(--onegov-sp-2) var(--onegov-sp-5);
  border-radius: var(--onegov-radius-md);
  border: 1px solid var(--onegov-color-primary);
  background: var(--onegov-color-primary);
  color: var(--onegov-color-primary-contrast);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--onegov-duration-fast) var(--onegov-ease-standard),
    border-color var(--onegov-duration-fast) var(--onegov-ease-standard),
    color var(--onegov-duration-fast) var(--onegov-ease-standard),
    transform var(--onegov-duration-fast) var(--onegov-ease-standard),
    box-shadow var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-button:hover:not(:disabled) {
  background: var(--onegov-color-primary-hover);
  border-color: var(--onegov-color-primary-hover);
}
.onegov-button:active:not(:disabled) {
  background: var(--onegov-color-primary-active);
  transform: scale(0.97);
}
.onegov-button--secondary {
  background: var(--onegov-color-bg);
  color: var(--onegov-color-primary);
  border-color: var(--onegov-color-primary);
}
.onegov-button--secondary:hover:not(:disabled) {
  background: var(--onegov-color-primary-soft);
  color: var(--onegov-color-primary);
  border-color: var(--onegov-color-primary);
}
.onegov-button--secondary:active:not(:disabled) {
  background: var(--onegov-color-primary-soft);
  transform: scale(0.97);
}
.onegov-button--ghost {
  background: transparent;
  color: var(--onegov-color-text);
  border-color: transparent;
}
.onegov-button--ghost:hover:not(:disabled) {
  background: var(--onegov-color-neutral-100);
  border-color: transparent;
  color: var(--onegov-color-text);
}
.onegov-button--ghost:active:not(:disabled) {
  background: var(--onegov-color-neutral-200);
  transform: scale(0.97);
}
.onegov-button--danger {
  background: var(--onegov-color-danger);
  color: var(--onegov-color-primary-contrast);
  border-color: var(--onegov-color-danger);
}
.onegov-button--danger:hover:not(:disabled) {
  background: var(--onegov-color-danger-hover);
  border-color: var(--onegov-color-danger-hover);
}
.onegov-button--danger:active:not(:disabled) {
  transform: scale(0.97);
}
.onegov-button--link {
  background: transparent;
  color: var(--onegov-color-link);
  border-color: transparent;
  text-decoration: underline;
  text-underline-offset: 2px;
  padding-inline: 0;
  min-height: auto;
  min-width: auto;
}
.onegov-button--link:hover:not(:disabled) {
  background: transparent;
  color: var(--onegov-color-link-hover);
}
.onegov-button--link:active:not(:disabled) {
  transform: none;
}
.onegov-button--sm {
  min-height: 32px;
  min-width: 32px;
  padding: var(--onegov-sp-1) var(--onegov-sp-3);
  font-size: var(--onegov-fs-sm);
  border-radius: var(--onegov-radius-sm);
}
.onegov-button--lg {
  min-height: 52px;
  min-width: 52px;
  padding: var(--onegov-sp-3) var(--onegov-sp-7);
  font-size: var(--onegov-fs-lg);
}
.onegov-button--full { width: 100%; }
.onegov-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.onegov-button--loading {
  pointer-events: none;
}
.onegov-button__spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border-radius: var(--onegov-radius-full);
  border: 2px solid currentColor;
  border-right-color: transparent;
  animation: onegov-spin 800ms linear infinite;
}

/* =================================================================== */
/* Persona-specific component variants                                 */
/* =================================================================== */

.onegov-h1--pensioner { letter-spacing: -0.01em; }
.onegov-p--pensioner { line-height: 1.8; }
.onegov-list--pensioner li { margin-bottom: var(--onegov-spacing); }
.onegov-card--pensioner { border-width: 2px; }
.onegov-button--pensioner {
  font-size: var(--onegov-font-size-base);
  letter-spacing: 0.01em;
}

/* Pro persona — keyboard hint affordance */
.onegov-kbd-hint {
  display: inline-block;
  margin-left: var(--onegov-spacing-half);
  padding: 0 var(--onegov-spacing-half);
  font-family: var(--onegov-font-mono);
  font-size: var(--onegov-font-size-small);
  color: var(--onegov-color-muted);
  border: 1px solid var(--onegov-color-border);
  border-radius: 2px;
}

/* Journalist — anomaly highlight + copy affordance */
.onegov-table-tools {
  display: flex;
  gap: var(--onegov-spacing);
  padding: var(--onegov-spacing) var(--onegov-spacing-2x);
  background: var(--onegov-color-surface);
  border-bottom: 1px solid var(--onegov-color-border);
  font-size: var(--onegov-font-size-small);
}
.onegov-table-tools__action {
  background: transparent;
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius);
  padding: var(--onegov-spacing-half) var(--onegov-spacing);
  font: inherit;
  font-size: var(--onegov-font-size-small);
  color: var(--onegov-color-link);
  cursor: pointer;
}

/* =================================================================== */
/* Premium chrome (page header + footer + diagnostic) — kept           */
/* =================================================================== */

.onegov-shell {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--onegov-color-bg);
}
.onegov-shell__topbar {
  display: flex;
  align-items: center;
  gap: var(--onegov-sp-3);
  padding: var(--onegov-sp-4) var(--onegov-sp-6);
  background: var(--onegov-color-primary);
  color: var(--onegov-color-primary-contrast);
  box-shadow: var(--onegov-shadow-md);
}
.onegov-shell__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--onegov-sp-2);
  font-family: var(--onegov-font-display);
  font-weight: 700;
  font-size: var(--onegov-fs-md);
  letter-spacing: -0.01em;
}
.onegov-shell__brand-mark {
  width: 24px;
  height: 24px;
  border-radius: var(--onegov-radius-sm);
  background: var(--onegov-color-primary-contrast);
  color: var(--onegov-color-primary);
  display: inline-grid;
  place-items: center;
  font-weight: 800;
  font-family: var(--onegov-font-display);
  font-size: 14px;
  line-height: 1;
}
.onegov-shell__crumb {
  font-size: var(--onegov-fs-sm);
  color: var(--onegov-color-primary-contrast);
  opacity: 0.85;
  margin-left: var(--onegov-sp-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.onegov-shell__main {
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.onegov-shell__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--onegov-sp-9) var(--onegov-sp-6) var(--onegov-sp-11);
}
.onegov-shell__inner--wide { max-width: 1200px; }
.onegov-shell__footer {
  border-top: 1px solid var(--onegov-color-neutral-200);
  background: var(--onegov-color-neutral-50);
  padding: var(--onegov-sp-4) var(--onegov-sp-6);
  font-size: var(--onegov-fs-xs);
  color: var(--onegov-color-neutral-600);
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--onegov-sp-3);
}
.onegov-shell__footer-mark {
  font-family: var(--onegov-font-display);
  font-weight: 700;
}

.onegov-diag {
  border: 1px solid var(--onegov-color-neutral-200);
  border-radius: var(--onegov-radius-lg);
  padding: var(--onegov-sp-7);
  background: linear-gradient(180deg, var(--onegov-color-neutral-50) 0%, var(--onegov-color-bg) 100%);
  box-shadow: var(--onegov-shadow-sm);
}
.onegov-diag__title {
  margin: 0 0 var(--onegov-sp-2);
  font-family: var(--onegov-font-display);
  font-size: var(--onegov-fs-xl);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--onegov-color-primary);
}
.onegov-diag__lede {
  margin: 0 0 var(--onegov-sp-5);
  color: var(--onegov-color-neutral-700);
  font-size: var(--onegov-fs-md);
}
.onegov-diag__details {
  margin-top: var(--onegov-sp-4);
  padding: var(--onegov-sp-4);
  background: var(--onegov-color-neutral-50);
  border-radius: var(--onegov-radius-md);
  border: 1px solid var(--onegov-color-neutral-200);
}
.onegov-diag__summary {
  cursor: pointer;
  font-weight: 600;
  font-size: var(--onegov-fs-sm);
  color: var(--onegov-color-neutral-700);
  user-select: none;
}
.onegov-diag__list {
  margin: var(--onegov-sp-3) 0 0;
  padding-left: var(--onegov-sp-5);
  font-family: var(--onegov-font-mono);
  font-size: var(--onegov-fs-xs);
  color: var(--onegov-color-neutral-600);
}

.onegov-pro-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--onegov-sp-4);
}

/* =================================================================== */
/* AppShell                                                            */
/* =================================================================== */

.onegov-shell-v2 {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100%;
}
.onegov-shell-v2--with-aside {
  grid-template-columns: 1fr;
  grid-template-areas: 'header' 'main' 'footer';
}
.onegov-shell-v2 > .onegov-shell-v2__header { grid-area: header; }
.onegov-shell-v2 > .onegov-shell-v2__main { grid-area: main; padding: var(--onegov-sp-7) var(--onegov-sp-6); }
.onegov-shell-v2 > .onegov-shell-v2__aside { display: none; }
.onegov-shell-v2 > .onegov-shell-v2__footer { grid-area: footer; }
@media (min-width: 1024px) {
  .onegov-shell-v2--with-aside {
    grid-template-columns: 240px 1fr;
    grid-template-areas: 'header header' 'aside main' 'footer footer';
  }
  .onegov-shell-v2 > .onegov-shell-v2__aside {
    grid-area: aside;
    display: block;
    border-right: 1px solid var(--onegov-color-border);
    background: var(--onegov-color-surface);
    padding: var(--onegov-sp-5) var(--onegov-sp-4);
  }
}
.onegov-shell-v2__sticky-header {
  position: sticky;
  top: 0;
  z-index: var(--onegov-z-sticky);
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid var(--onegov-color-border);
}

/* =================================================================== */
/* Surface — Box / Panel / Callout / Banner                            */
/* =================================================================== */

.onegov-box {
  background: var(--onegov-color-bg);
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius-md);
  padding: var(--onegov-sp-5);
}
.onegov-box--flat { border: 0; padding: 0; }
.onegov-box--surface { background: var(--onegov-color-surface); }
.onegov-box--sunken { background: var(--onegov-color-surface-sunken); }

.onegov-panel {
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius-lg);
  background: var(--onegov-color-bg);
  overflow: hidden;
}
.onegov-panel--elevated { box-shadow: var(--onegov-shadow-md); border-color: transparent; }
.onegov-panel--flat { border: 0; }
.onegov-panel__header {
  padding: var(--onegov-sp-4) var(--onegov-sp-5);
  border-bottom: 1px solid var(--onegov-color-border);
  background: var(--onegov-color-surface);
  font-weight: var(--onegov-fw-semibold);
  color: var(--onegov-color-primary);
}
.onegov-panel__body { padding: var(--onegov-sp-5); }
.onegov-panel__footer {
  padding: var(--onegov-sp-4) var(--onegov-sp-5);
  border-top: 1px solid var(--onegov-color-border);
  background: var(--onegov-color-surface);
}

.onegov-callout {
  display: flex;
  gap: var(--onegov-sp-3);
  padding: var(--onegov-sp-4);
  border-radius: var(--onegov-radius-md);
  border: 1px solid var(--onegov-color-border);
  background: var(--onegov-color-surface);
}
.onegov-callout__icon { flex: 0 0 auto; font-size: 20px; line-height: 1; }
.onegov-callout__body { flex: 1 1 auto; min-width: 0; }
.onegov-callout__title {
  margin: 0 0 var(--onegov-sp-1);
  font-weight: var(--onegov-fw-semibold);
  font-size: var(--onegov-fs-md);
  color: var(--onegov-color-text-strong);
}
.onegov-callout__text {
  margin: 0;
  color: var(--onegov-color-text);
  font-size: var(--onegov-fs-sm);
  line-height: var(--onegov-lh-snug);
}
.onegov-callout--info {
  background: var(--onegov-color-info-soft);
  border-color: var(--onegov-color-info);
  color: var(--onegov-color-info-hover);
}
.onegov-callout--success {
  background: var(--onegov-color-success-soft);
  border-color: var(--onegov-color-success);
  color: var(--onegov-color-success-hover);
}
.onegov-callout--warning {
  background: var(--onegov-color-warning-soft);
  border-color: var(--onegov-color-warning);
  color: var(--onegov-color-warning-hover);
}
.onegov-callout--danger {
  background: var(--onegov-color-danger-soft);
  border-color: var(--onegov-color-danger);
  color: var(--onegov-color-danger-hover);
}

.onegov-banner {
  width: 100%;
  padding: var(--onegov-sp-3) var(--onegov-sp-5);
  background: var(--onegov-color-info);
  color: var(--onegov-color-primary-contrast);
  display: flex;
  align-items: center;
  gap: var(--onegov-sp-3);
  font-size: var(--onegov-fs-sm);
}
.onegov-banner--success { background: var(--onegov-color-success); }
.onegov-banner--warning { background: var(--onegov-color-warning); }
.onegov-banner--danger { background: var(--onegov-color-danger); }
.onegov-banner__close {
  margin-left: auto;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  padding: var(--onegov-sp-1);
  font-size: var(--onegov-fs-md);
  line-height: 1;
}

/* =================================================================== */
/* Overlays — Modal / Popover / Tooltip                                */
/* =================================================================== */

.onegov-modal-backdrop {
  position: fixed;
  inset: 0;
  background: var(--onegov-color-overlay);
  backdrop-filter: blur(2px);
  z-index: var(--onegov-z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--onegov-sp-5);
  animation: onegov-fade-in var(--onegov-duration-base) var(--onegov-ease-standard);
}
.onegov-modal {
  background: var(--onegov-color-bg);
  border-radius: var(--onegov-radius-lg);
  box-shadow: var(--onegov-shadow-xl);
  max-height: calc(100vh - 2 * var(--onegov-sp-5));
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: onegov-modal-in var(--onegov-duration-base) var(--onegov-ease-emphasized);
}
.onegov-modal--sm { max-width: 380px; }
.onegov-modal--md { max-width: 560px; }
.onegov-modal--lg { max-width: 800px; }
.onegov-modal--full { max-width: calc(100vw - 2 * var(--onegov-sp-5)); height: calc(100vh - 2 * var(--onegov-sp-5)); }
.onegov-modal__header {
  display: flex;
  align-items: center;
  gap: var(--onegov-sp-3);
  padding: var(--onegov-sp-4) var(--onegov-sp-5);
  border-bottom: 1px solid var(--onegov-color-border);
}
.onegov-modal__title {
  margin: 0;
  font-size: var(--onegov-fs-lg);
  font-weight: var(--onegov-fw-semibold);
  color: var(--onegov-color-primary);
  flex: 1 1 auto;
}
.onegov-modal__close {
  background: transparent;
  border: 0;
  color: var(--onegov-color-muted);
  cursor: pointer;
  padding: var(--onegov-sp-1);
  border-radius: var(--onegov-radius-sm);
  font-size: 18px;
  line-height: 1;
  transition: background var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-modal__close:hover { background: var(--onegov-color-neutral-100); color: var(--onegov-color-text); }
.onegov-modal__body {
  padding: var(--onegov-sp-5);
  overflow-y: auto;
  flex: 1 1 auto;
}
.onegov-modal__footer {
  padding: var(--onegov-sp-4) var(--onegov-sp-5);
  border-top: 1px solid var(--onegov-color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--onegov-sp-3);
  background: var(--onegov-color-surface);
}

.onegov-popover {
  position: absolute;
  background: var(--onegov-color-bg);
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius-md);
  box-shadow: var(--onegov-shadow-lg);
  padding: var(--onegov-sp-3);
  z-index: var(--onegov-z-popover);
  font-size: var(--onegov-fs-sm);
  max-width: 320px;
  animation: onegov-fade-in var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-popover-host {
  position: relative;
  display: inline-block;
}

.onegov-tooltip {
  position: absolute;
  background: var(--onegov-color-neutral-800);
  color: var(--onegov-color-primary-contrast);
  padding: var(--onegov-sp-1) var(--onegov-sp-2);
  border-radius: var(--onegov-radius-sm);
  font-size: var(--onegov-fs-xs);
  z-index: var(--onegov-z-tooltip);
  pointer-events: none;
  white-space: nowrap;
  opacity: 0;
  transition: opacity var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-tooltip-host {
  position: relative;
  display: inline-flex;
}
.onegov-tooltip-host:hover > .onegov-tooltip,
.onegov-tooltip-host:focus-within > .onegov-tooltip { opacity: 1; }
.onegov-tooltip--top { bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); }
.onegov-tooltip--bottom { top: calc(100% + 6px); left: 50%; transform: translateX(-50%); }
.onegov-tooltip--left { right: calc(100% + 6px); top: 50%; transform: translateY(-50%); }
.onegov-tooltip--right { left: calc(100% + 6px); top: 50%; transform: translateY(-50%); }

/* =================================================================== */
/* Disclosure — Accordion / Tabs                                       */
/* =================================================================== */

.onegov-accordion {
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius-md);
  overflow: hidden;
}
.onegov-accordion-item + .onegov-accordion-item {
  border-top: 1px solid var(--onegov-color-border);
}
.onegov-accordion-item__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--onegov-sp-3);
  width: 100%;
  padding: var(--onegov-sp-4) var(--onegov-sp-5);
  background: var(--onegov-color-bg);
  border: 0;
  font: inherit;
  font-weight: var(--onegov-fw-semibold);
  color: var(--onegov-color-text-strong);
  cursor: pointer;
  text-align: left;
  transition: background var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-accordion-item__trigger:hover { background: var(--onegov-color-surface); }
.onegov-accordion-item__chevron {
  flex: 0 0 auto;
  display: inline-flex;
  transition: transform var(--onegov-duration-base) var(--onegov-ease-standard);
}
.onegov-accordion-item--open .onegov-accordion-item__chevron {
  transform: rotate(180deg);
}
.onegov-accordion-item__panel {
  padding: 0 var(--onegov-sp-5) var(--onegov-sp-5);
  color: var(--onegov-color-text);
  font-size: var(--onegov-fs-md);
}

.onegov-tabs {
  display: flex;
  flex-direction: column;
  gap: var(--onegov-sp-4);
}
.onegov-tabs__list {
  display: flex;
  gap: var(--onegov-sp-1);
  border-bottom: 1px solid var(--onegov-color-border);
  overflow-x: auto;
}
.onegov-tabs__tab {
  background: transparent;
  border: 0;
  padding: var(--onegov-sp-3) var(--onegov-sp-4);
  font: inherit;
  font-weight: var(--onegov-fw-medium);
  color: var(--onegov-color-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition:
    color var(--onegov-duration-fast) var(--onegov-ease-standard),
    border-color var(--onegov-duration-fast) var(--onegov-ease-standard);
  white-space: nowrap;
}
.onegov-tabs__tab:hover { color: var(--onegov-color-text); }
.onegov-tabs__tab[aria-selected='true'] {
  color: var(--onegov-color-primary);
  border-bottom-color: var(--onegov-color-primary);
}
.onegov-tabs--vertical { flex-direction: row; }
.onegov-tabs--vertical .onegov-tabs__list {
  flex-direction: column;
  border-bottom: 0;
  border-right: 1px solid var(--onegov-color-border);
  padding-right: 0;
  overflow-x: visible;
}
.onegov-tabs--vertical .onegov-tabs__tab {
  border-bottom: 0;
  border-right: 2px solid transparent;
  margin-bottom: 0;
  margin-right: -1px;
  text-align: left;
}
.onegov-tabs--vertical .onegov-tabs__tab[aria-selected='true'] {
  border-right-color: var(--onegov-color-primary);
}

/* =================================================================== */
/* Navigation                                                          */
/* =================================================================== */

.onegov-topnav {
  display: flex;
  align-items: center;
  gap: var(--onegov-sp-5);
  padding: var(--onegov-sp-3) var(--onegov-sp-6);
  background: var(--onegov-color-bg);
  border-bottom: 1px solid var(--onegov-color-border);
}
.onegov-topnav__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--onegov-sp-2);
  font-family: var(--onegov-font-display);
  font-weight: var(--onegov-fw-bold);
  color: var(--onegov-color-primary);
  font-size: var(--onegov-fs-md);
  text-decoration: none;
}
.onegov-topnav__items {
  display: none;
  align-items: center;
  gap: var(--onegov-sp-1);
  margin: 0;
  padding: 0;
  list-style: none;
  flex: 1 1 auto;
}
@media (min-width: 768px) {
  .onegov-topnav__items { display: flex; }
}
.onegov-topnav__item {
  padding: var(--onegov-sp-2) var(--onegov-sp-3);
  border-radius: var(--onegov-radius-sm);
  color: var(--onegov-color-text);
  text-decoration: none;
  font-weight: var(--onegov-fw-medium);
  transition: background var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-topnav__item:hover { background: var(--onegov-color-neutral-100); }
.onegov-topnav__item--active {
  color: var(--onegov-color-primary);
  background: var(--onegov-color-primary-soft);
}
.onegov-topnav__toggle {
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius-sm);
  padding: var(--onegov-sp-2);
  cursor: pointer;
  display: inline-flex;
}
@media (min-width: 768px) {
  .onegov-topnav__toggle { display: none; }
}

.onegov-sidenav {
  display: flex;
  flex-direction: column;
  gap: var(--onegov-sp-1);
  padding: var(--onegov-sp-3) 0;
  list-style: none;
  margin: 0;
}
.onegov-sidenav__section { padding: var(--onegov-sp-3) 0; }
.onegov-sidenav__section-title {
  padding: 0 var(--onegov-sp-3) var(--onegov-sp-2);
  font-size: var(--onegov-fs-xs);
  text-transform: uppercase;
  letter-spacing: var(--onegov-ls-wider);
  color: var(--onegov-color-muted);
  font-weight: var(--onegov-fw-semibold);
}
.onegov-sidenav__item {
  display: flex;
  align-items: center;
  gap: var(--onegov-sp-2);
  padding: var(--onegov-sp-2) var(--onegov-sp-3);
  border-radius: var(--onegov-radius-sm);
  color: var(--onegov-color-text);
  text-decoration: none;
  font-weight: var(--onegov-fw-medium);
  transition: background var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-sidenav__item:hover { background: var(--onegov-color-neutral-100); }
.onegov-sidenav__item--active {
  background: var(--onegov-color-primary-soft);
  color: var(--onegov-color-primary);
}

.onegov-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--onegov-sp-1);
  margin: 0 0 var(--onegov-sp-4);
  padding: 0;
  list-style: none;
  font-size: var(--onegov-fs-sm);
  color: var(--onegov-color-muted);
}
.onegov-breadcrumb__sep { color: var(--onegov-color-subtle); }
.onegov-breadcrumb__item { color: var(--onegov-color-muted); text-decoration: none; }
.onegov-breadcrumb__item:hover { color: var(--onegov-color-link-hover); text-decoration: underline; }
.onegov-breadcrumb__item--current { color: var(--onegov-color-text-strong); font-weight: var(--onegov-fw-medium); }

.onegov-pagination {
  display: inline-flex;
  align-items: center;
  gap: var(--onegov-sp-1);
}
.onegov-pagination__btn {
  min-width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--onegov-color-bg);
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius-sm);
  color: var(--onegov-color-text);
  font: inherit;
  font-size: var(--onegov-fs-sm);
  cursor: pointer;
  text-decoration: none;
  padding: 0 var(--onegov-sp-2);
  transition:
    background var(--onegov-duration-fast) var(--onegov-ease-standard),
    border-color var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-pagination__btn:hover:not(:disabled) {
  background: var(--onegov-color-neutral-100);
}
.onegov-pagination__btn--active {
  background: var(--onegov-color-primary);
  color: var(--onegov-color-primary-contrast);
  border-color: var(--onegov-color-primary);
}
.onegov-pagination__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.onegov-pagination__ellipsis {
  padding: 0 var(--onegov-sp-2);
  color: var(--onegov-color-muted);
}

.onegov-footer {
  background: var(--onegov-color-neutral-50);
  border-top: 1px solid var(--onegov-color-neutral-200);
  padding: var(--onegov-sp-7) var(--onegov-sp-6);
  color: var(--onegov-color-neutral-600);
  font-size: var(--onegov-fs-sm);
}
.onegov-footer__cols {
  display: flex;
  gap: var(--onegov-sp-7);
  flex-wrap: wrap;
  margin-bottom: var(--onegov-sp-5);
}
.onegov-footer__col { flex: 1 1 200px; }
.onegov-footer__col-title {
  font-weight: var(--onegov-fw-semibold);
  color: var(--onegov-color-text-strong);
  margin-bottom: var(--onegov-sp-2);
}
.onegov-footer__bottom {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--onegov-sp-3);
  padding-top: var(--onegov-sp-4);
  border-top: 1px solid var(--onegov-color-neutral-200);
  font-size: var(--onegov-fs-xs);
}

/* =================================================================== */
/* Data display — Badge / Pill / Avatar / StatusIndicator / Divider    */
/* =================================================================== */

.onegov-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--onegov-sp-1);
  padding: 2px 8px;
  font-size: var(--onegov-fs-xs);
  font-weight: var(--onegov-fw-semibold);
  border-radius: var(--onegov-radius-sm);
  background: var(--onegov-color-neutral-100);
  color: var(--onegov-color-neutral-700);
  line-height: 1.4;
  border: 1px solid transparent;
  white-space: nowrap;
}
.onegov-badge--info { background: var(--onegov-color-info-soft); color: var(--onegov-color-info-hover); }
.onegov-badge--success { background: var(--onegov-color-success-soft); color: var(--onegov-color-success-hover); }
.onegov-badge--warning { background: var(--onegov-color-warning-soft); color: var(--onegov-color-warning-hover); }
.onegov-badge--danger { background: var(--onegov-color-danger-soft); color: var(--onegov-color-danger-hover); }
.onegov-badge--lg { padding: 4px 12px; font-size: var(--onegov-fs-sm); }
.onegov-badge--pill { border-radius: var(--onegov-radius-full); }

.onegov-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--onegov-radius-full);
  background: var(--onegov-color-primary-soft);
  color: var(--onegov-color-primary);
  font-weight: var(--onegov-fw-semibold);
  font-size: var(--onegov-fs-sm);
  overflow: hidden;
  flex: 0 0 auto;
}
.onegov-avatar img { width: 100%; height: 100%; object-fit: cover; }
.onegov-avatar--sm { width: 28px; height: 28px; font-size: var(--onegov-fs-xs); }
.onegov-avatar--lg { width: 56px; height: 56px; font-size: var(--onegov-fs-lg); }
.onegov-avatar--xl { width: 80px; height: 80px; font-size: var(--onegov-fs-xl); }

.onegov-status {
  display: inline-flex;
  align-items: center;
  gap: var(--onegov-sp-2);
  font-size: var(--onegov-fs-sm);
  color: var(--onegov-color-text);
}
.onegov-status__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--onegov-radius-full);
  flex: 0 0 auto;
  background: var(--onegov-color-neutral-400);
}
.onegov-status--success .onegov-status__dot { background: var(--onegov-color-success); }
.onegov-status--warning .onegov-status__dot { background: var(--onegov-color-warning); }
.onegov-status--danger .onegov-status__dot { background: var(--onegov-color-danger); }
.onegov-status--info .onegov-status__dot { background: var(--onegov-color-info); }
.onegov-status--pulse .onegov-status__dot {
  animation: onegov-pulse 1.6s ease-in-out infinite;
}

.onegov-divider {
  border: 0;
  border-top: 1px solid var(--onegov-color-border);
  margin: var(--onegov-sp-5) 0;
  width: 100%;
  height: 0;
}
.onegov-divider--vertical {
  border-top: 0;
  border-left: 1px solid var(--onegov-color-border);
  margin: 0 var(--onegov-sp-3);
  width: 0;
  height: auto;
  align-self: stretch;
}
.onegov-divider--inset { margin-inline: var(--onegov-sp-5); }

/* =================================================================== */
/* Feedback — Spinner / ProgressBar / Skeleton / Alert / EmptyState    */
/* =================================================================== */

.onegov-spinner {
  display: inline-block;
  width: 1.25em;
  height: 1.25em;
  border: 2px solid var(--onegov-color-neutral-200);
  border-top-color: var(--onegov-color-primary);
  border-radius: var(--onegov-radius-full);
  animation: onegov-spin 800ms linear infinite;
}
.onegov-spinner--sm { width: 1em; height: 1em; }
.onegov-spinner--lg { width: 2em; height: 2em; border-width: 3px; }

.onegov-progress {
  width: 100%;
  height: 6px;
  background: var(--onegov-color-neutral-100);
  border-radius: var(--onegov-radius-full);
  overflow: hidden;
}
.onegov-progress__fill {
  height: 100%;
  background: var(--onegov-color-primary);
  border-radius: inherit;
  transition: width var(--onegov-duration-base) var(--onegov-ease-standard);
}
.onegov-progress--indeterminate .onegov-progress__fill {
  width: 30% !important;
  animation: onegov-progress-indeterminate 1.5s ease-in-out infinite;
}

.onegov-skeleton {
  display: block;
  background: linear-gradient(
    90deg,
    var(--onegov-color-neutral-100) 0%,
    var(--onegov-color-neutral-200) 50%,
    var(--onegov-color-neutral-100) 100%
  );
  background-size: 200% 100%;
  border-radius: var(--onegov-radius-sm);
  animation: onegov-shimmer 1.5s ease-in-out infinite;
  height: 1em;
  width: 100%;
}
.onegov-skeleton--circle { border-radius: var(--onegov-radius-full); }
.onegov-skeleton--text { height: 0.9em; }

.onegov-alert {
  display: flex;
  gap: var(--onegov-sp-3);
  padding: var(--onegov-sp-4);
  border-radius: var(--onegov-radius-md);
  border-left: 4px solid var(--onegov-color-info);
  background: var(--onegov-color-info-soft);
}
.onegov-alert--success { border-left-color: var(--onegov-color-success); background: var(--onegov-color-success-soft); }
.onegov-alert--warning { border-left-color: var(--onegov-color-warning); background: var(--onegov-color-warning-soft); }
.onegov-alert--danger { border-left-color: var(--onegov-color-danger); background: var(--onegov-color-danger-soft); }
.onegov-alert__icon { flex: 0 0 auto; font-size: 18px; line-height: 1; }
.onegov-alert__body { flex: 1 1 auto; min-width: 0; }
.onegov-alert__title {
  margin: 0 0 var(--onegov-sp-1);
  font-weight: var(--onegov-fw-semibold);
  color: var(--onegov-color-text-strong);
}
.onegov-alert__text { margin: 0; font-size: var(--onegov-fs-sm); }
.onegov-alert__close {
  flex: 0 0 auto;
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: var(--onegov-sp-1);
  color: var(--onegov-color-muted);
  border-radius: var(--onegov-radius-sm);
}
.onegov-alert__close:hover { background: rgba(0, 0, 0, 0.05); color: var(--onegov-color-text); }

.onegov-empty {
  text-align: center;
  padding: var(--onegov-sp-9) var(--onegov-sp-5);
  color: var(--onegov-color-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--onegov-sp-3);
}
.onegov-empty__illustration {
  width: 64px;
  height: 64px;
  border-radius: var(--onegov-radius-full);
  background: var(--onegov-color-neutral-100);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--onegov-color-muted);
}
.onegov-empty__title {
  margin: 0;
  font-size: var(--onegov-fs-lg);
  font-weight: var(--onegov-fw-semibold);
  color: var(--onegov-color-text-strong);
}
.onegov-empty__description {
  margin: 0;
  max-width: 420px;
  color: var(--onegov-color-muted);
  font-size: var(--onegov-fs-sm);
}

/* =================================================================== */
/* Page primitives — Hero / CardGrid / SearchBox                       */
/* =================================================================== */

.onegov-hero {
  padding: var(--onegov-sp-12) var(--onegov-sp-6);
  background:
    linear-gradient(135deg, var(--onegov-color-primary) 0%, var(--onegov-color-primary-hover) 100%);
  color: var(--onegov-color-primary-contrast);
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: var(--onegov-sp-4);
  border-radius: var(--onegov-radius-lg);
  overflow: hidden;
  position: relative;
}
.onegov-hero--center { text-align: center; align-items: center; }
.onegov-hero__eyebrow {
  font-size: var(--onegov-fs-xs);
  font-weight: var(--onegov-fw-semibold);
  text-transform: uppercase;
  letter-spacing: var(--onegov-ls-wider);
  opacity: 0.85;
}
.onegov-hero__title {
  margin: 0;
  font-family: var(--onegov-font-display);
  font-size: var(--onegov-fs-3xl);
  font-weight: var(--onegov-fw-bold);
  letter-spacing: var(--onegov-ls-tight);
  line-height: 1.05;
  color: var(--onegov-color-primary-contrast);
}
@media (min-width: 768px) {
  .onegov-hero__title { font-size: var(--onegov-fs-4xl); }
}
.onegov-hero__description {
  margin: 0;
  max-width: 640px;
  font-size: var(--onegov-fs-lg);
  line-height: var(--onegov-lh-snug);
  opacity: 0.92;
}
.onegov-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--onegov-sp-3);
  margin-top: var(--onegov-sp-3);
}

.onegov-cardgrid {
  display: grid;
  gap: var(--onegov-sp-5);
  grid-template-columns: 1fr;
}
@media (min-width: 640px) {
  .onegov-cardgrid--cols-2 { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 768px) {
  .onegov-cardgrid--cols-3 { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1024px) {
  .onegov-cardgrid--cols-4 { grid-template-columns: repeat(4, 1fr); }
}

.onegov-searchbox {
  display: flex;
  align-items: stretch;
  gap: 0;
  background: var(--onegov-color-bg);
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius-md);
  padding: 0;
  overflow: hidden;
  transition:
    border-color var(--onegov-duration-fast) var(--onegov-ease-standard),
    box-shadow var(--onegov-duration-fast) var(--onegov-ease-standard);
  width: 100%;
  max-width: 720px;
}
.onegov-searchbox:focus-within {
  border-color: var(--onegov-color-primary);
  box-shadow: 0 0 0 3px rgba(29, 79, 155, 0.18);
}
.onegov-searchbox__icon {
  display: inline-flex;
  align-items: center;
  padding-left: var(--onegov-sp-4);
  color: var(--onegov-color-muted);
  flex: 0 0 auto;
}
.onegov-searchbox__input {
  flex: 1 1 auto;
  border: 0;
  outline: none;
  padding: var(--onegov-sp-3) var(--onegov-sp-4);
  font: inherit;
  background: transparent;
  color: var(--onegov-color-text);
  min-height: var(--onegov-target-size);
}
.onegov-searchbox__input::placeholder { color: var(--onegov-color-muted); }
.onegov-searchbox__submit {
  background: var(--onegov-color-primary);
  color: var(--onegov-color-primary-contrast);
  border: 0;
  padding: 0 var(--onegov-sp-5);
  font: inherit;
  font-weight: var(--onegov-fw-semibold);
  cursor: pointer;
  transition: background var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-searchbox__submit:hover { background: var(--onegov-color-primary-hover); }
.onegov-searchbox__suggestions {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--onegov-color-bg);
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius-md);
  box-shadow: var(--onegov-shadow-lg);
  z-index: var(--onegov-z-dropdown);
  list-style: none;
  margin: 0;
  padding: var(--onegov-sp-1);
  max-height: 320px;
  overflow-y: auto;
}
.onegov-searchbox-host { position: relative; }
.onegov-searchbox__suggestion {
  display: block;
  padding: var(--onegov-sp-2) var(--onegov-sp-3);
  border-radius: var(--onegov-radius-sm);
  color: var(--onegov-color-text);
  text-decoration: none;
  cursor: pointer;
  transition: background var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.onegov-searchbox__suggestion:hover,
.onegov-searchbox__suggestion[aria-selected='true'] {
  background: var(--onegov-color-primary-soft);
  color: var(--onegov-color-primary);
}

/* =================================================================== */
/* Animations                                                          */
/* =================================================================== */

@keyframes onegov-spin {
  to { transform: rotate(360deg); }
}
@keyframes onegov-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes onegov-modal-in {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes onegov-page-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes onegov-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes onegov-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
@keyframes onegov-progress-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
`;

/**
 * Returns the theme CSS for a given persona. Today the same string ships for
 * every persona — persona variants live entirely in `:host([data-persona])`
 * selectors so a single `<style>` element covers all four. The function
 * exists so the renderer's call site reads naturally and so a future build
 * step can ship per-persona stripped variants without changing call sites.
 */
export function themeFor(_persona: Persona): string {
  return THEME_CSS;
}
