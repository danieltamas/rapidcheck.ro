/**
 * Standard persona — the canonical premium look (v0.1.1).
 *
 * Single-column 960px max layout. Generous vertical rhythm via the new
 * --onegov-sp-* scale. Headers ride the identitate.gov.ro brand; cards wrap
 * each top-level node in subtle elevation so the hierarchy reads cleanly.
 *
 * On sparse extraction (fewer than 3 nodes) the diagnostic banner takes over
 * so the user always sees a visible "layer is active" affordance.
 */

import type { SemanticNode, SemanticTree } from '@onegov/core';

import { AppShell } from './shell.js';
import { DiagnosticBanner, isSparse } from './diagnostic.js';
import { RenderedNode } from './shared.js';

interface Props {
  tree: SemanticTree;
}

/**
 * Decide whether a node deserves its own premium card or should flow inline.
 * Headings + paragraphs flow; tables, lists, forms, links, images get cards
 * so they read as discrete affordances.
 */
function isCardCandidate(node: SemanticNode): boolean {
  return (
    node.type === 'table' ||
    node.type === 'list' ||
    node.type === 'form' ||
    node.type === 'link' ||
    node.type === 'image'
  );
}

export function StandardLayout({ tree }: Props) {
  if (isSparse(tree.nodes.length)) {
    return (
      <AppShell domain={tree.domain} crumb={tree.layout} persona="standard">
        <DiagnosticBanner domain={tree.domain} nodes={tree.nodes} />
      </AppShell>
    );
  }

  return (
    <AppShell domain={tree.domain} crumb={tree.layout} persona="standard">
      {tree.nodes.map((node) =>
        isCardCandidate(node) ? (
          <div key={node.id} class="onegov-card onegov-card--premium">
            <RenderedNode node={node} persona="standard" />
          </div>
        ) : (
          <RenderedNode key={node.id} node={node} persona="standard" />
        ),
      )}
    </AppShell>
  );
}
