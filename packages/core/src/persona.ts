/**
 * Persona override application.
 *
 * Takes a `Route` (as authored in the rule pack) and a `Persona` (the user's
 * current selection from the popup) and returns a NEW route with the persona
 * overrides applied. Pure: never mutates the input route, never returns the
 * input by reference when overrides apply.
 *
 * Override semantics (matches SPEC §5.1 and the task spec):
 *
 *   - `layout`     If present, replaces the route's default `layout` name.
 *   - `hide`       Removes any `ExtractRule` whose `id` is in the list. Both
 *                  base ids and `multiple`-mode suffixed ids (`x.0`, `x.1`)
 *                  are matched against; here we only see base ids because
 *                  rules carry the base id and the suffixing happens later
 *                  in the extractor — so this filter is on rule.id directly.
 *   - `emphasize`  Lifts the matching ids to the head of `extract`, in the
 *                  order they appear in `emphasize`. Any rule not in the
 *                  list keeps its original relative order.
 *
 * If the route carries no `personas` field at all, OR if the named persona
 * has no entry, the function returns the route unchanged (deep-equal, but
 * not necessarily by reference — callers must not rely on identity).
 */

import type { Persona, PersonaOverride, Route } from './types.js';

/**
 * Apply the persona's overrides to a route. Returns a new `Route` value;
 * `route` itself is never mutated.
 */
export function applyPersonaOverrides(route: Route, persona: Persona): Route {
  const override: PersonaOverride | undefined = route.personas?.[persona];
  if (!override) return route;

  let extract = route.extract;

  // hide first — emphasize then operates on the surviving set so an id can't
  // be both hidden and emphasized at the same time (hide wins).
  if (override.hide && override.hide.length > 0) {
    const hideSet = new Set(override.hide);
    extract = extract.filter((rule) => !hideSet.has(rule.id));
  }

  if (override.emphasize && override.emphasize.length > 0) {
    const emphasizeOrder = override.emphasize;
    const idIndex = new Map<string, number>();
    emphasizeOrder.forEach((id, idx) => idIndex.set(id, idx));

    const promoted = extract
      .filter((rule) => idIndex.has(rule.id))
      // Stable sort by the requested emphasize order.
      .sort((a, b) => (idIndex.get(a.id) ?? 0) - (idIndex.get(b.id) ?? 0));

    const remaining = extract.filter((rule) => !idIndex.has(rule.id));
    extract = [...promoted, ...remaining];
  }

  const layout = override.layout ?? route.layout;

  return {
    match: route.match,
    layout,
    extract,
    ...(route.personas ? { personas: route.personas } : {}),
  };
}
