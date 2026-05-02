/**
 * Semantic extractor — pure function over a `SerializableDoc`.
 *
 * Given a flat list of `ExtractRule`s and a doc adapter, produces a
 * `SemanticTree`. Pure: never mutates input arrays or elements, never throws
 * on missing matches (a missing element simply omits its node from the
 * output).
 *
 * The extractor is the boundary where rule-pack data first meets the page.
 * It must NEVER write back to the document, and it must never pass attribute
 * values to anything that interprets HTML — that's the renderer's job. Here
 * we only read strings.
 *
 * Output `domain` and `layout` are intentionally empty: the caller (content
 * script) fills `domain` from `location.host`/`psl` and `layout` from the
 * persona-resolved Route. Keeping them empty here keeps the extractor a true
 * pure function whose outputs depend only on its inputs.
 */

import type {
  ExtractRule,
  SemanticNode,
  SemanticTree,
  SerializableDoc,
  SerializableEl,
} from './types.js';

/** Sentinel used in `attrs` to mean "the element's textContent". */
const TEXT_CONTENT_KEY = 'textContent';

/**
 * Run all extraction rules against the doc. Returns a `SemanticTree` with
 * one or more `SemanticNode`s per matched rule (one per match for `multiple`,
 * a single node for the default single-shot variant).
 *
 * Rules whose selectors find no element are silently dropped — this is the
 * documented behaviour and matches how a missing CMS widget on a partial
 * page render shouldn't break the overlay.
 */
export function extract(
  rules: ExtractRule[],
  doc: SerializableDoc,
  url: string,
): SemanticTree {
  const nodes: SemanticNode[] = [];

  for (const rule of rules) {
    if (rule.multiple === true) {
      const matches = doc.queryAll(rule.selector);
      matches.forEach((el, index) => {
        const data = readAttrs(el, rule.attrs);
        nodes.push({
          // Suffix the index so each multiple-match gets a unique stable id.
          id: `${rule.id}.${String(index)}`,
          type: rule.type,
          data,
        });
      });
    } else {
      const el = doc.query(rule.selector);
      if (!el) continue;
      nodes.push({
        id: rule.id,
        type: rule.type,
        data: readAttrs(el, rule.attrs),
      });
    }
  }

  return {
    url,
    domain: '',
    layout: '',
    nodes,
  };
}

/**
 * Read the `attrs` mapping off an element. The mapping is `outputKey ->
 * sourceKey`, where `sourceKey` is either the literal string `"textContent"`
 * or a DOM attribute name. Missing source keys default to `''` (the renderer
 * treats empty strings as missing values, never as a render error).
 */
function readAttrs(
  el: SerializableEl,
  attrs: ExtractRule['attrs'],
): Record<string, unknown> {
  if (!attrs) return {};
  const out: Record<string, unknown> = {};
  for (const [outKey, sourceKey] of Object.entries(attrs)) {
    if (sourceKey === TEXT_CONTENT_KEY) {
      out[outKey] = el.text;
    } else {
      out[outKey] = el.attr(sourceKey) ?? '';
    }
  }
  return out;
}
