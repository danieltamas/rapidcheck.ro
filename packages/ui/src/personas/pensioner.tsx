/**
 * Pensioner persona — large type, single column, generous spacing (v0.1.1).
 *
 * Inherits the premium shell + diagnostic fallback. Persona-specific
 * affordances:
 *   - Heading is always rendered as level 1 (commanding).
 *   - The first link in the tree is promoted as a prominent action card.
 *   - Each remaining node lives on its own row with a heavier card border.
 *   - Inline "ce înseamnă?" markers next to jargon would live here in v0.2;
 *     for v0.1.1 we keep the contract-level signal (the persona tokens make
 *     body copy ≥20px) and ship the layout.
 *
 * Token-driven sizing (≥ 20px body, larger headings, 16px spacing) comes
 * from `:host([data-persona="pensioner"])` overrides in `theme.css`.
 */

import type { SemanticNode, SemanticTree } from '@onegov/core';

import { AppShell } from './shell.js';
import { DiagnosticBanner, isSparse } from './diagnostic.js';
import { RenderedNode } from './shared.js';

interface Props {
  tree: SemanticTree;
}

function partitionNodes(nodes: ReadonlyArray<SemanticNode>): {
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
  if (isSparse(tree.nodes.length)) {
    return (
      <AppShell domain={tree.domain} crumb={tree.layout} persona="pensioner">
        <DiagnosticBanner domain={tree.domain} nodes={tree.nodes} />
      </AppShell>
    );
  }

  const { heading, primaryAction, rest } = partitionNodes(tree.nodes);

  return (
    <AppShell domain={tree.domain} crumb={tree.layout} persona="pensioner">
      {heading ? <RenderedNode node={heading} persona="pensioner" headingLevel={1} /> : null}
      {primaryAction ? (
        <div class="onegov-card onegov-card--pensioner onegov-card--premium">
          <RenderedNode node={primaryAction} persona="pensioner" />
        </div>
      ) : null}
      {rest.map((node) => (
        <div key={node.id} class="onegov-card onegov-card--pensioner onegov-card--premium">
          <RenderedNode node={node} persona="pensioner" />
        </div>
      ))}
    </AppShell>
  );
}
