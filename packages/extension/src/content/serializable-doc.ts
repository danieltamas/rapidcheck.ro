/**
 * `SerializableDoc` adapter — wraps the live `Document` (or any `Element`
 * subtree) to satisfy the `@onegov/core` extractor's DOM-free interface.
 *
 * The whole point of this thin shim is invariant boundary: `@onegov/core`
 * never sees a real `Document`/`Element`, never calls `setAttribute`, never
 * reads `.value`, never holds a reference past the synchronous extract pass.
 * It only reads what the `SerializableEl` contract advertises:
 *   - `tag` (lower-case)
 *   - `text` (trimmed `textContent`)
 *   - `attr(name)` (string or null)
 *   - `children` (direct element children, lazy)
 *
 * Adapters are read-only by construction. We never write back to the page —
 * which is required by Invariant #1 (original DOM untouched) and Invariant #2
 * (no form data read or written; we deliberately do NOT expose `.value`,
 * `.elements`, or `FormData`).
 *
 * Children are computed lazily (on first access) so traversing a partial
 * tree doesn't allocate the whole subtree upfront.
 */

import type { SerializableDoc, SerializableEl } from '@onegov/core';

/**
 * Wrap a real `Document` (or any `ParentNode` such as a sub-element) in a
 * `SerializableDoc`. The adapter holds the wrapped node by reference but
 * never mutates it.
 */
export function wrapDocument(root: ParentNode): SerializableDoc {
  return {
    query(selector: string): SerializableEl | null {
      try {
        const el = root.querySelector(selector);
        return el ? wrapElement(el) : null;
      } catch {
        // Invalid selector strings should not crash the extractor — they
        // simply yield no match. This matches the documented behaviour where
        // a missing element drops its node from the output.
        return null;
      }
    },
    queryAll(selector: string): SerializableEl[] {
      try {
        const list = root.querySelectorAll(selector);
        const out: SerializableEl[] = [];
        list.forEach((el) => out.push(wrapElement(el)));
        return out;
      } catch {
        return [];
      }
    },
  };
}

/**
 * Wrap a single `Element` in a `SerializableEl`. Children accessor is lazy
 * via a getter so deep trees don't allocate eagerly.
 */
function wrapElement(el: Element): SerializableEl {
  const wrapped: SerializableEl = {
    tag: el.tagName.toLowerCase(),
    // `textContent` may be `null` on certain document nodes (it is not on
    // Element, but defensive coercion costs nothing and keeps the contract).
    text: (el.textContent ?? '').trim(),
    attr(name: string): string | null {
      return el.getAttribute(name);
    },
    // Materialised below via Object.defineProperty so this stays a real
    // property the consumer can read off `.children`.
    children: [],
  };
  let cached: SerializableEl[] | null = null;
  Object.defineProperty(wrapped, 'children', {
    enumerable: true,
    get(): SerializableEl[] {
      if (cached !== null) return cached;
      const out: SerializableEl[] = [];
      for (const child of Array.from(el.children)) {
        out.push(wrapElement(child));
      }
      cached = out;
      return cached;
    },
  });
  return wrapped;
}
