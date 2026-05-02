/**
 * Journalist persona — wide tables, anomaly highlighting hooks, copy-as-CSV.
 *
 * Tables are the centrepiece for this persona; the Table component already
 * surfaces a "Copiază ca CSV" affordance when persona === 'journalist'. The
 * layout pulls every table to a full-width row and renders the rest of the
 * tree above it in a single column.
 */

import type { SemanticNode, SemanticTree } from '@onegov/core';

import { RenderedNode } from './shared.js';

interface Props {
  tree: SemanticTree;
}

function partition(nodes: SemanticNode[]): { tables: SemanticNode[]; other: SemanticNode[] } {
  const tables: SemanticNode[] = [];
  const other: SemanticNode[] = [];
  for (const node of nodes) {
    if (node.type === 'table') tables.push(node);
    else other.push(node);
  }
  return { tables, other };
}

export function JournalistLayout({ tree }: Props) {
  const { tables, other } = partition(tree.nodes);

  return (
    <main class="onegov-app" data-layout={tree.layout} data-journalist="1">
      {other.map((node) => (
        <RenderedNode key={node.id} node={node} persona="journalist" />
      ))}
      {tables.map((node) => (
        <RenderedNode key={node.id} node={node} persona="journalist" />
      ))}
    </main>
  );
}
