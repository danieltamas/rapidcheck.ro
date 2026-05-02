/**
 * @onegov/ui — public barrel.
 *
 * The renderer is the only public entry point other packages import. Atomic
 * components and persona layouts are intentionally NOT re-exported — they are
 * implementation details routed through the renderer. The visual harness
 * imports them directly from their files for inspection only.
 *
 * Per-component supporting types (e.g. FormFieldDescriptor) are exported so
 * the rule-pack-loader / extractor can shape data the renderer expects.
 */

export { render } from './renderer.js';
export { sanitizeHref } from './components/Link.js';
export { THEME_CSS, themeFor } from './theme.js';
export type { FormFieldDescriptor } from './components/types.js';
