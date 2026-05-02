/**
 * Rule-pack loader and validator.
 *
 * STATUS: Stubs. Track 2 owns the Zod schema mirroring `types.ts` and the
 * bundled-fetch helper. The signatures here are the contract the content
 * script (Track 4) wires against.
 *
 * The `fetcher` indirection keeps `@onegov/core` browser-API-free: the content
 * script supplies a function that resolves to `chrome.runtime.getURL(...)` and
 * fetches, but core itself never imports `chrome.*`.
 */

import type { RulePack } from './types.js';

/**
 * Validate an arbitrary `unknown` payload as a `RulePack`. Throws a Zod error
 * when validation fails.
 */
export function validate(input: unknown): RulePack {
  // TODO(Track 2 / rule-pack-loader): real Zod schema mirroring SPEC §5.1.
  // The shape below is intentionally minimal so this stub never silently
  // accepts garbage — it asserts the bare-minimum surface and casts.
  if (
    typeof input !== 'object' ||
    input === null ||
    !('domain' in input) ||
    !('routes' in input)
  ) {
    throw new Error('rule-pack-loader: stub validate rejected non-pack input');
  }
  return input as RulePack;
}

/**
 * Load a bundled rule pack for the given eTLD+1 via the supplied `fetcher`.
 * Returns `null` when the pack is missing or invalid; never throws.
 */
export async function loadBundled(
  domain: string,
  fetcher: (url: string) => Promise<unknown>,
): Promise<RulePack | null> {
  try {
    const data = await fetcher(`rule-packs/${domain}.json`);
    return validate(data);
  } catch {
    return null;
  }
}
