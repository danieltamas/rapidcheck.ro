/**
 * Renderer — top-level entry that mounts the persona-adapted Preact tree into
 * the closed shadow root supplied by the content script.
 *
 * STATUS: Stub. Track 3 implements the real `render`, including theme.css
 * injection and the persona-keyed component dispatch. The signature here is
 * the contract the extension content script (Track 4) wires against.
 *
 * The stub deliberately does nothing so the v0.1 extension loads cleanly
 * without a UI — the icon will turn gray (no rule pack matches) and the
 * shadow host is never created. Invariant 1 (DOM untouched) trivially holds.
 */

import type { Persona, SemanticTree } from '@onegov/core';

export function render(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tree: SemanticTree,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _persona: Persona,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _target: ShadowRoot,
): void {
  // TODO(Track 3 / ui-renderer): inject theme.css idempotently, mount the
  // App component, dispatch on tree.layout / node.type.
}
