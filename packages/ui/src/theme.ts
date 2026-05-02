/**
 * Theme — design tokens as a string the renderer injects into the shadow root.
 *
 * The CSS lives twice: once in `theme.css` (authoring source — what designers
 * read) and once inlined here (what the bundle ships). They are kept in sync
 * by hand because Vite's library-mode CSS handling adds a top-level
 * side-effect import that doesn't reach inside a closed shadow root. Keeping
 * the canonical text in TS lets the renderer drop a single `<style>` element
 * inside the shadow root and walk away.
 *
 * The string MUST stay byte-equivalent to `theme.css` for the visual harness
 * to remain accurate. A future `scripts/sync-theme.ts` could codegen this from
 * the .css file; for v0.1 we sync by hand and trust the diff review.
 *
 * Tokens follow identitate.gov.ro: PANTONE 280C blue (#003B73), recommended
 * fonts (Arial / Calibri / Verdana / Tahoma / Trebuchet / Ubuntu fallback),
 * 8px spacing base. Persona overrides via `:host([data-persona="<name>"])`.
 *
 * v0.1.1 polish — premium token layer added (see theme.css for full notes).
 */

import type { Persona } from '@onegov/core';

export const THEME_CSS = `:host {
  --onegov-color-primary: #003b73;
  --onegov-color-primary-contrast: #ffffff;
  --onegov-color-bg: #ffffff;
  --onegov-color-surface: #f7f9fc;
  --onegov-color-text: #1a1a1a;
  --onegov-color-muted: #5b6b7d;
  --onegov-color-border: #d0d7de;
  --onegov-color-link: #003b73;
  --onegov-color-link-hover: #1d4f9b;
  --onegov-color-link-visited: #5b3a8a;
  --onegov-color-danger: #b3261e;
  --onegov-color-success: #1f7a3a;
  --onegov-color-warning: #b06700;
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
  --onegov-font-base: Arial, Calibri, Verdana, Tahoma, Trebuchet MS, Ubuntu, sans-serif;
  --onegov-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --onegov-font-display: system-ui, -apple-system, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif;
  --onegov-font-size-base: 16px;
  --onegov-font-size-small: 14px;
  --onegov-font-size-h1: 32px;
  --onegov-font-size-h2: 24px;
  --onegov-font-size-h3: 19px;
  --onegov-line-height: 1.55;
  --onegov-line-height-heading: 1.25;
  --onegov-font-weight-body: 400;
  --onegov-font-weight-strong: 700;
  --onegov-fs-xs: 12px;
  --onegov-fs-sm: 14px;
  --onegov-fs-md: 16px;
  --onegov-fs-lg: 20px;
  --onegov-fs-xl: 28px;
  --onegov-fs-2xl: 36px;
  --onegov-spacing: 8px;
  --onegov-spacing-half: 4px;
  --onegov-spacing-2x: 16px;
  --onegov-spacing-3x: 24px;
  --onegov-spacing-4x: 32px;
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
  --onegov-max-width: 1280px;
  --onegov-radius: 4px;
  --onegov-radius-large: 8px;
  --onegov-radius-sm: 4px;
  --onegov-radius-md: 8px;
  --onegov-radius-lg: 16px;
  --onegov-radius-full: 9999px;
  --onegov-shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 4px rgba(15, 23, 42, 0.04);
  --onegov-shadow-elevated: 0 4px 12px rgba(15, 23, 42, 0.1);
  --onegov-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
  --onegov-shadow-md: 0 2px 6px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04);
  --onegov-shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.06);
  --onegov-focus-ring: 2px solid #1d4f9b;
  --onegov-focus-offset: 2px;
  --onegov-target-size: 44px;
  --onegov-transition-fast: 120ms ease-out;
  --onegov-transition-medium: 200ms ease-out;
  --onegov-duration-fast: 120ms;
  --onegov-duration-base: 200ms;
  --onegov-duration-slow: 320ms;
  --onegov-ease-standard: cubic-bezier(0.2, 0, 0.2, 1);
  --onegov-ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
}
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
* { box-sizing: border-box; }
.onegov-app { margin: 0 auto; max-width: var(--onegov-max-width); padding: var(--onegov-spacing-3x) var(--onegov-spacing-2x); }
.onegov-app--pro { padding: var(--onegov-spacing-2x); }
.onegov-app--pensioner { padding: var(--onegov-spacing-4x) var(--onegov-spacing-3x); }
.onegov-h1, .onegov-h2, .onegov-h3 { margin: 0 0 var(--onegov-spacing-2x); font-weight: var(--onegov-font-weight-strong); line-height: var(--onegov-line-height-heading); color: var(--onegov-color-primary); }
.onegov-h1 { font-size: var(--onegov-font-size-h1); }
.onegov-h2 { font-size: var(--onegov-font-size-h2); }
.onegov-h3 { font-size: var(--onegov-font-size-h3); }
.onegov-p { margin: 0 0 var(--onegov-spacing-2x); color: var(--onegov-color-text); font-size: var(--onegov-font-size-base); }
.onegov-p--muted { color: var(--onegov-color-muted); font-size: var(--onegov-font-size-small); }
.onegov-list { margin: 0 0 var(--onegov-spacing-2x); padding-left: var(--onegov-spacing-3x); }
.onegov-list li { margin-bottom: var(--onegov-spacing-half); }
.onegov-table-wrap { margin: 0 0 var(--onegov-spacing-2x); overflow-x: auto; border: 1px solid var(--onegov-color-border); border-radius: var(--onegov-radius); }
.onegov-table { width: 100%; border-collapse: collapse; font-size: var(--onegov-font-size-base); }
.onegov-table th, .onegov-table td { padding: var(--onegov-spacing) var(--onegov-spacing-2x); text-align: left; border-bottom: 1px solid var(--onegov-color-border); vertical-align: top; }
.onegov-table th { background: var(--onegov-color-surface); font-weight: var(--onegov-font-weight-strong); color: var(--onegov-color-primary); }
.onegov-table tr:last-child td { border-bottom: none; }
.onegov-table--journalist th, .onegov-table--journalist td { white-space: nowrap; }
.onegov-form { display: grid; gap: var(--onegov-spacing-2x); margin: 0 0 var(--onegov-spacing-2x); }
.onegov-field { display: grid; gap: var(--onegov-spacing-half); }
.onegov-field__label { font-weight: var(--onegov-font-weight-strong); color: var(--onegov-color-text); }
.onegov-field__input, .onegov-field__textarea, .onegov-field__select { font: inherit; color: var(--onegov-color-text); background: var(--onegov-color-bg); border: 1px solid var(--onegov-color-border); border-radius: var(--onegov-radius); padding: var(--onegov-spacing) var(--onegov-spacing-2x); min-height: var(--onegov-target-size); width: 100%; }
.onegov-field__hint { color: var(--onegov-color-muted); font-size: var(--onegov-font-size-small); }
.onegov-field__readonly-banner { font-size: var(--onegov-font-size-small); color: var(--onegov-color-muted); border-left: 3px solid var(--onegov-color-warning); padding-left: var(--onegov-spacing); margin-bottom: var(--onegov-spacing); }
.onegov-link { color: var(--onegov-color-link); text-decoration: underline; text-underline-offset: 2px; }
.onegov-link:hover { color: var(--onegov-color-link-hover); }
.onegov-link--blocked { color: var(--onegov-color-text); text-decoration: none; cursor: default; }
.onegov-card { border: 1px solid var(--onegov-color-border); border-radius: var(--onegov-radius-large); padding: var(--onegov-spacing-2x); background: var(--onegov-color-bg); box-shadow: var(--onegov-shadow); margin: 0 0 var(--onegov-spacing-2x); }
.onegov-card__title { margin: 0 0 var(--onegov-spacing); font-size: var(--onegov-font-size-h3); color: var(--onegov-color-primary); }
.onegov-button { display: inline-flex; align-items: center; justify-content: center; font: inherit; font-weight: var(--onegov-font-weight-strong); min-height: var(--onegov-target-size); min-width: var(--onegov-target-size); padding: var(--onegov-spacing) var(--onegov-spacing-2x); border-radius: var(--onegov-radius); border: 1px solid var(--onegov-color-primary); background: var(--onegov-color-primary); color: var(--onegov-color-primary-contrast); cursor: pointer; transition: background var(--onegov-transition-fast), color var(--onegov-transition-fast); }
.onegov-button:hover { background: var(--onegov-color-link-hover); border-color: var(--onegov-color-link-hover); }
.onegov-button--secondary { background: var(--onegov-color-bg); color: var(--onegov-color-primary); }
.onegov-button--secondary:hover { background: var(--onegov-color-surface); color: var(--onegov-color-link-hover); }
.onegov-button:disabled { opacity: 0.5; cursor: not-allowed; }
.onegov-h1--pensioner { letter-spacing: -0.01em; }
.onegov-p--pensioner { line-height: 1.8; }
.onegov-list--pensioner li { margin-bottom: var(--onegov-spacing); }
.onegov-card--pensioner { border-width: 2px; }
.onegov-button--pensioner { font-size: var(--onegov-font-size-base); letter-spacing: 0.01em; }
.onegov-kbd-hint { display: inline-block; margin-left: var(--onegov-spacing-half); padding: 0 var(--onegov-spacing-half); font-family: var(--onegov-font-mono); font-size: var(--onegov-font-size-small); color: var(--onegov-color-muted); border: 1px solid var(--onegov-color-border); border-radius: 2px; }
.onegov-table-tools { display: flex; gap: var(--onegov-spacing); padding: var(--onegov-spacing) var(--onegov-spacing-2x); background: var(--onegov-color-surface); border-bottom: 1px solid var(--onegov-color-border); font-size: var(--onegov-font-size-small); }
.onegov-table-tools__action { background: transparent; border: 1px solid var(--onegov-color-border); border-radius: var(--onegov-radius); padding: var(--onegov-spacing-half) var(--onegov-spacing); font: inherit; font-size: var(--onegov-font-size-small); color: var(--onegov-color-link); cursor: pointer; }
.onegov-shell { min-height: 100%; display: flex; flex-direction: column; background: var(--onegov-color-bg); }
.onegov-shell__topbar { display: flex; align-items: center; gap: var(--onegov-sp-3); padding: var(--onegov-sp-4) var(--onegov-sp-6); background: var(--onegov-color-primary); color: var(--onegov-color-primary-contrast); box-shadow: var(--onegov-shadow-md); }
.onegov-shell__brand { display: inline-flex; align-items: center; gap: var(--onegov-sp-2); font-family: var(--onegov-font-display); font-weight: 700; font-size: var(--onegov-fs-md); letter-spacing: -0.01em; }
.onegov-shell__brand-mark { width: 24px; height: 24px; border-radius: var(--onegov-radius-sm); background: var(--onegov-color-primary-contrast); color: var(--onegov-color-primary); display: inline-grid; place-items: center; font-weight: 800; font-family: var(--onegov-font-display); font-size: 14px; line-height: 1; }
.onegov-shell__crumb { font-size: var(--onegov-fs-sm); color: var(--onegov-color-primary-contrast); opacity: 0.85; margin-left: var(--onegov-sp-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.onegov-shell__main { flex: 1 1 auto; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.onegov-shell__inner { max-width: 960px; margin: 0 auto; padding: var(--onegov-sp-9) var(--onegov-sp-6) var(--onegov-sp-11); }
.onegov-shell__inner--wide { max-width: 1200px; }
.onegov-shell__footer { border-top: 1px solid var(--onegov-color-neutral-200); background: var(--onegov-color-neutral-50); padding: var(--onegov-sp-4) var(--onegov-sp-6); font-size: var(--onegov-fs-xs); color: var(--onegov-color-neutral-600); display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--onegov-sp-3); }
.onegov-shell__footer-mark { font-family: var(--onegov-font-display); font-weight: 700; }
.onegov-card--premium { border: 1px solid var(--onegov-color-neutral-200); border-radius: var(--onegov-radius-lg); padding: var(--onegov-sp-6); background: var(--onegov-color-bg); box-shadow: var(--onegov-shadow-sm); margin: 0 0 var(--onegov-sp-5); transition: box-shadow var(--onegov-duration-base) var(--onegov-ease-standard); }
.onegov-card--premium:hover { box-shadow: var(--onegov-shadow-md); }
.onegov-diag { border: 1px solid var(--onegov-color-neutral-200); border-radius: var(--onegov-radius-lg); padding: var(--onegov-sp-7); background: linear-gradient(180deg, var(--onegov-color-neutral-50) 0%, var(--onegov-color-bg) 100%); box-shadow: var(--onegov-shadow-sm); }
.onegov-diag__title { margin: 0 0 var(--onegov-sp-2); font-family: var(--onegov-font-display); font-size: var(--onegov-fs-xl); font-weight: 700; letter-spacing: -0.01em; color: var(--onegov-color-primary); }
.onegov-diag__lede { margin: 0 0 var(--onegov-sp-5); color: var(--onegov-color-neutral-700); font-size: var(--onegov-fs-md); }
.onegov-diag__details { margin-top: var(--onegov-sp-4); padding: var(--onegov-sp-4); background: var(--onegov-color-neutral-50); border-radius: var(--onegov-radius-md); border: 1px solid var(--onegov-color-neutral-200); }
.onegov-diag__summary { cursor: pointer; font-weight: 600; font-size: var(--onegov-fs-sm); color: var(--onegov-color-neutral-700); user-select: none; }
.onegov-diag__list { margin: var(--onegov-sp-3) 0 0; padding-left: var(--onegov-sp-5); font-family: var(--onegov-font-mono); font-size: var(--onegov-fs-xs); color: var(--onegov-color-neutral-600); }
.onegov-pro-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--onegov-sp-4); }
:host *:focus-visible { outline: var(--onegov-focus-ring); outline-offset: var(--onegov-focus-offset); }
@media (prefers-reduced-motion: reduce) {
  :host { --onegov-transition-fast: 0ms; --onegov-transition-medium: 0ms; --onegov-duration-fast: 0ms; --onegov-duration-base: 0ms; --onegov-duration-slow: 0ms; }
  * { animation: none !important; transition: none !important; }
}`;

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
