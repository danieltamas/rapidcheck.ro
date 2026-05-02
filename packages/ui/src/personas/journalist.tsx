/**
 * Journalist persona — wide layout, tables prominent, copy-as-CSV on tables.
 *
 * Inherits the premium shell (with `wide` flag → 1200px max-width) and the
 * diagnostic fallback. Persona-specific:
 *   - Tables float to the bottom of the layout for skim-then-drill flow.
 *   - Other content stays in a single column above the tables.
 *   - The Table component already surfaces a copy-as-CSV affordance when
 *     persona === 'journalist' (lives in `components/Table.tsx`).
 */

import type { SemanticNode, SemanticTree } from '@onegov/core';

import { AppShell } from './shell.js';
import { DiagnosticBanner, isSparse } from './diagnostic.js';
import { RenderedNode } from './shared.js';

interface Props {
  tree: SemanticTree;
}

function partition(nodes: ReadonlyArray<SemanticNode>): {
  tables: SemanticNode[];
  other: SemanticNode[];
} {
  const tables: SemanticNode[] = [];
  const other: SemanticNode[] = [];
  for (const node of nodes) {
    if (node.type === 'table') tables.push(node);
    else other.push(node);
  }
  return { tables, other };
}

export function JournalistLayout({ tree }: Props) {
  if (isSparse(tree.nodes.length)) {
    return (
      <AppShell domain={tree.domain} crumb={tree.layout} persona="journalist" wide>
        <DiagnosticBanner domain={tree.domain} nodes={tree.nodes} />
      </AppShell>
    );
  }

  const { tables, other } = partition(tree.nodes);

  return (
    <AppShell domain={tree.domain} crumb={tree.layout} persona="journalist" wide>
      {other.map((node) => (
        <RenderedNode key={node.id} node={node} persona="journalist" />
      ))}
      {tables.map((node) => (
        <div key={node.id} class="onegov-card onegov-card--premium">
          <RenderedNode node={node} persona="journalist" />
        </div>
      ))}
    </AppShell>
  );
}
