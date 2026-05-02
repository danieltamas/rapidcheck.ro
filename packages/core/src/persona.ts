/**
 * Persona override application.
 *
 * STATUS: Stub. Track 2 implements `hide` / `emphasize` / `layout` semantics.
 * Returning the route unchanged is the safe identity: the standard persona
 * sees the route exactly as authored, which matches the SPEC default.
 */

import type { Persona, Route } from './types.js';

export function applyPersonaOverrides(
  route: Route,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _persona: Persona,
): Route {
  // TODO(Track 2 / persona-overrides): apply hide/emphasize/layout per SPEC §5.1.
  return route;
}
