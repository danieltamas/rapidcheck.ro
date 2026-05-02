/**
 * Pro persona — dense, two-column when there's room, keyboard hints visible.
 *
 * Tokens shrink type and spacing via `:host([data-persona="pro"])`. Layout
 * adds:
 *   - A two-column grid for body content (collapses on narrow shadow roots).
 *   - Visible keyboard hints next to action links (e.g. "Enter ↵").
 *   - All headings rendered as h2 by default to save vertical space, except
 *     the first.
 */

import type { SemanticNode, SemanticTree } from '@onegov/core';

import { RenderedNode } from './shared.js';

interface Props {
  tree: SemanticTree;
}

const GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 'var(--onegov-spacing-2x)',
};

export function ProLayout({ tree }: Props) {
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
    <main class="onegov-app onegov-app--pro" data-layout={tree.layout}>
      <div style={GRID_STYLE}>{renderedNodes}</div>
    </main>
  );
}
