/**
 * Standard persona — clean default.
 *
 * Adopts identitate.gov.ro tokens directly (PANTONE 280C blue, recommended
 * fonts, 8px spacing). Single column, normal density. This is what the
 * extension renders unless the user explicitly picks another persona.
 */

import type { SemanticTree } from '@onegov/core';

import { RenderedNode } from './shared.js';

interface Props {
  tree: SemanticTree;
}

export function StandardLayout({ tree }: Props) {
  return (
    <main class="onegov-app" data-layout={tree.layout}>
      {tree.nodes.map((node) => (
        <RenderedNode key={node.id} node={node} persona="standard" />
      ))}
    </main>
  );
}
