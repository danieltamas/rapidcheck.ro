/**
 * Diagnostic banner — fallback for sparse extraction (v0.1.1).
 *
 * Rendered by every persona layout when `tree.nodes.length < 3`. Addresses
 * owner feedback "I don't see any UI for anaf" — there should always be a
 * visible affordance proving the layer is active even when the rule pack
 * extracted little or nothing.
 *
 * Premium feel: large headline, soft gradient surface, subtle expandable
 * details so curious users can see what was captured (good for debug + trust).
 *
 * Accepts a `nodeCount` so the banner is honest about how many semantic
 * nodes the extractor found. The owner sees this — never lies about partial
 * extraction.
 */

import type { SemanticNode } from '@onegov/core';

interface Props {
  domain: string;
  nodes: ReadonlyArray<SemanticNode>;
}

const DEFAULT_LEDE =
  'Layer onegov este activ pe acest site. Suntem încă în versiunea timpurie — pe măsură ce regulile cresc, vei vedea mai mult conținut adaptat.';

export function DiagnosticBanner({ domain, nodes }: Props) {
  return (
    <section class="onegov-diag" aria-labelledby="onegov-diag-title">
      <h1 class="onegov-diag__title" id="onegov-diag-title">
        Layer onegov activ pe {domain}
      </h1>
      <p class="onegov-diag__lede">{DEFAULT_LEDE}</p>
      <details class="onegov-diag__details">
        <summary class="onegov-diag__summary">
          Diagnostic ({nodes.length} {nodes.length === 1 ? 'element extras' : 'elemente extrase'})
        </summary>
        <ul class="onegov-diag__list" aria-label="Elemente extrase">
          {nodes.map((node) => {
            const text =
              typeof (node.data as Record<string, unknown>)['text'] === 'string'
                ? ((node.data as Record<string, unknown>)['text'] as string).slice(0, 80)
                : '';
            return (
              <li key={node.id}>
                <span>{node.type}</span>
                {text ? <span> · {text}</span> : null}
              </li>
            );
          })}
          {nodes.length === 0 ? <li>(nimic încă — pagina nu se potrivește unei rute)</li> : null}
        </ul>
      </details>
    </section>
  );
}

/**
 * Helper for persona layouts: returns true when the tree is too sparse to
 * render a useful main view. The threshold (3) is the contract from the
 * v0.1.1 task spec.
 */
export function isSparse(nodeCount: number): boolean {
  return nodeCount < 3;
}
