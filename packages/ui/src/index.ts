/**
 * @onegov/ui — public barrel.
 *
 * Tracks 3 (components / personas / theme) lands the real renderer. The stub
 * here exists so the dependency graph compiles end-to-end immediately and the
 * extension package can import a well-typed `render` symbol from day one.
 */

export { render } from './renderer.js';
