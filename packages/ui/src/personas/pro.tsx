/**
 * Pro persona — dense, two-column where there's room (v0.1.1).
 *
 * Inherits the premium shell + diagnostic fallback. Persona-specific:
 *   - Body content lives in a responsive grid (`auto-fit, minmax(320px,1fr)`)
 *     that collapses gracefully on narrow viewports.
 *   - First heading stays h1 for orientation; subsequent headings drop to h2
 *     to save vertical real estate.
 *   - Links carry a small kbd hint badge so keyboard-driven users see "↵".
 *   - Tokens (smaller type, denser spacing) come from
 *     `:host([data-persona="pro"])` in theme.css.
 */

import type { SemanticNode, SemanticTree } from '@onegov/core';

import { AppShell } from './shell.js';
import { DiagnosticBanner, isSparse } from './diagnostic.js';
import { RenderedNode } from './shared.js';

interface Props {
  tree: SemanticTree;
}

export function ProLayout({ tree }: Props) {
  if (isSparse(tree.nodes.length)) {
    return (
      <AppShell domain={tree.domain} crumb={tree.layout} persona="pro">
        <DiagnosticBanner domain={tree.domain} nodes={tree.nodes} />
      </AppShell>
    );
  }

  let firstHeadingSeen = false;
  const renderedNodes = tree.nodes.map((node: SemanticNode) => {
    if (node.type === 'heading' && !firstHeadingSeen) {
      firstHeadingSeen = true;
      return <RenderedNode key={node.id} node={node} persona="pro" headingLevel={1} />;
    }
    if (node.type === 'heading') {
      return <RenderedNode key={node.id} node={node} persona="pro" headingLevel={2} />;
    }
    if (node.type === 'link') {
      return (
        <span key={node.id}>
          <RenderedNode node={node} persona="pro" />
          <span class="onegov-kbd-hint" aria-hidden="true">
            ↵
          </span>
        </span>
      );
    }
    return <RenderedNode key={node.id} node={node} persona="pro" />;
  });

  return (
    <AppShell domain={tree.domain} crumb={tree.layout} persona="pro">
      <div class="onegov-pro-grid">{renderedNodes}</div>
    </AppShell>
  );
}
