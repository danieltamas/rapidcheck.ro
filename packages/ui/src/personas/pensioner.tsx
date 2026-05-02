/**
 * Pensioner persona — large type, single column, generous spacing.
 *
 * Behaviour:
 *   - Heading goes on top, full width (always level 1).
 *   - Each subsequent node lives on its own row with extra padding so a user
 *     with low digital literacy never has to choose between competing actions.
 *   - The first link node gets promoted to a prominent spot. We don't render
 *     more than one prominent action per screen; everything else flows below.
 *
 * Token-driven sizing (≥ 20px body, larger headings, 16px spacing) comes from
 * `:host([data-persona="pensioner"])` overrides in `theme.css`.
 */

import type { SemanticNode, SemanticTree } from '@onegov/core';

import { RenderedNode } from './shared.js';

interface Props {
  tree: SemanticTree;
}

function partitionNodes(nodes: SemanticNode[]): {
  heading: SemanticNode | null;
  primaryAction: SemanticNode | null;
  rest: SemanticNode[];
} {
  let heading: SemanticNode | null = null;
  let primaryAction: SemanticNode | null = null;
  const rest: SemanticNode[] = [];
  for (const node of nodes) {
    if (heading === null && node.type === 'heading') {
      heading = node;
      continue;
    }
    if (primaryAction === null && node.type === 'link') {
      primaryAction = node;
      continue;
    }
    rest.push(node);
  }
  return { heading, primaryAction, rest };
}

export function PensionerLayout({ tree }: Props) {
  const { heading, primaryAction, rest } = partitionNodes(tree.nodes);

  return (
    <main class="onegov-app onegov-app--pensioner" data-layout={tree.layout}>
      {heading ? <RenderedNode node={heading} persona="pensioner" headingLevel={1} /> : null}
      {primaryAction ? (
        <div class="onegov-card onegov-card--pensioner">
          <RenderedNode node={primaryAction} persona="pensioner" />
        </div>
      ) : null}
      {rest.map((node) => (
        <RenderedNode key={node.id} node={node} persona="pensioner" />
      ))}
    </main>
  );
}
