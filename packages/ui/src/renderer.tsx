/**
 * Renderer — top-level entry that mounts the persona-adapted Preact tree
 * into the closed shadow root supplied by the content script.
 *
 * Contract:
 *   - Idempotent. Re-rendering the same `(tree, persona)` pair into the same
 *     `target` is a no-op visually (Preact reconciles in place).
 *   - Theme injection is idempotent. A single `<style data-onegov-theme="1">`
 *     element is created on first call and reused thereafter.
 *   - The host element (the closed shadow root's `host`) gets `data-persona`
 *     set so theme tokens cascade. We never read or write any other host
 *     attribute.
 *
 * Constraints (per CLAUDE.md):
 *   - No `chrome.*`, no `browser.*`, no direct `document.*` / `window.*`
 *     access. We may call `target.ownerDocument.createElement` because the
 *     ShadowRoot exposes that document reference and we need it to construct
 *     elements; this is the only document touch and it does NOT mutate the
 *     surrounding page.
 *   - All text reaches the DOM via Preact JSX (escaped). No `innerHTML`.
 */

import { render as preactRender } from 'preact';

import type { Persona, SemanticTree } from '@onegov/core';

import { themeFor } from './theme.js';
import { PensionerLayout } from './personas/pensioner.js';
import { StandardLayout } from './personas/standard.js';
import { ProLayout } from './personas/pro.js';
import { JournalistLayout } from './personas/journalist.js';

const STYLE_FLAG = 'data-onegov-theme';
const MOUNT_ID = 'onegov-app';

function selectLayout(tree: SemanticTree, persona: Persona) {
  switch (persona) {
    case 'pensioner':
      return <PensionerLayout tree={tree} />;
    case 'pro':
      return <ProLayout tree={tree} />;
    case 'journalist':
      return <JournalistLayout tree={tree} />;
    case 'standard':
    default:
      return <StandardLayout tree={tree} />;
  }
}

/**
 * Mount or update the persona-adapted Preact app inside the given closed
 * shadow root. Safe to call repeatedly with the same arguments.
 */
export function render(tree: SemanticTree, persona: Persona, target: ShadowRoot): void {
  // 1. Mark the host element with `data-persona` so the CSS cascade picks the
  //    right token set. The host is exposed by the ShadowRoot reference even
  //    when the shadow root is closed.
  const host = target.host;
  if (host instanceof Element) {
    if (host.getAttribute('data-persona') !== persona) {
      host.setAttribute('data-persona', persona);
    }
  }

  // 2. Inject the theme stylesheet idempotently.
  const existingStyle = target.querySelector(`style[${STYLE_FLAG}]`);
  if (!existingStyle) {
    const ownerDoc = target.ownerDocument;
    if (ownerDoc) {
      const style = ownerDoc.createElement('style');
      style.setAttribute(STYLE_FLAG, '1');
      // Plain string assignment — `textContent` is the safe path for
      // `<style>` elements (does NOT parse HTML, unlike innerHTML).
      style.textContent = themeFor(persona);
      target.appendChild(style);
    }
  }

  // 3. Resolve or create the mount node, then let Preact reconcile.
  let mount = target.querySelector<HTMLElement>(`#${MOUNT_ID}`);
  if (!mount) {
    const ownerDoc = target.ownerDocument;
    if (!ownerDoc) {
      // No document available (extremely unlikely with a real ShadowRoot —
      // bail rather than throw so the caller's invariants hold).
      return;
    }
    mount = ownerDoc.createElement('div');
    mount.id = MOUNT_ID;
    target.appendChild(mount);
  }

  preactRender(selectLayout(tree, persona), mount);
}
