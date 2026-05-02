/**
 * Semantic extractor — pure function over a `SerializableDoc`.
 *
 * STATUS: Stub. Track 2 implements rule application; the content script
 * (Track 4) supplies the `SerializableDoc` adapter wrapping the live document.
 *
 * Returning an empty tree from the stub is safe: the renderer treats empty
 * `nodes` as a no-op and the page stays untouched.
 */

import type { ExtractRule, SemanticTree, SerializableDoc } from './types.js';

export function extract(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _rules: ExtractRule[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _doc: SerializableDoc,
  url: string,
): SemanticTree {
  // TODO(Track 2 / semantic-extractor): iterate rules, query the doc, build
  // SemanticNode entries respecting `multiple`, `attrs`, and the `textContent`
  // alias.
  return {
    url,
    domain: '',
    layout: '',
    nodes: [],
  };
}
