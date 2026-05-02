/**
 * Rule-pack loader and validator.
 *
 * Rule packs are declarative JSON shipped inside the extension bundle. The
 * five-invariants policy forbids `eval`/`Function`/remote code, so the loader
 * does two things and only two things:
 *
 *   1. Validate an arbitrary `unknown` payload as a `RulePack` using a Zod
 *      schema that mirrors `types.ts` exactly. Every object schema is
 *      `.strict()` so unknown keys are rejected — a future SPEC change must
 *      go through the type contract first.
 *   2. Load a bundled pack via an injected `fetcher`. The fetcher is supplied
 *      by the extension content script (wired to `chrome.runtime.getURL`),
 *      keeping `@onegov/core` browser-API-free.
 *
 * Behaviour summary (matches the task spec):
 *   - `validate` throws a `ZodError` on any malformed input, including extra
 *     unknown fields at the root or inside nested objects.
 *   - `loadBundled` swallows fetcher errors (e.g. 404, missing pack) and
 *     returns `null` — the content script then exits cleanly. Validation
 *     errors are NOT swallowed: a malformed bundled pack is a build-time bug
 *     that should surface loudly.
 */

import { z } from 'zod';

import type { RulePack } from './types.js';

const PERSONA_VALUES = ['pensioner', 'standard', 'pro', 'journalist'] as const;
const EXTRACT_TYPES = ['heading', 'paragraph', 'list', 'table', 'form', 'link', 'image'] as const;

// `_comment` is an explicit authoring nicety: rule-pack JSON has no native
// comment syntax, so authors annotate intent with a `_comment` string field
// at the route / extract / persona-override level. The schema preserves
// `.strict()` for every other key (typo protection) but tolerates _comment
// as opt-in metadata. Loader silently keeps it; nothing reads it at runtime.
const COMMENT_FIELD = { _comment: z.string().optional() };

const ExtractRuleSchema = z
  .object({
    id: z.string().min(1),
    selector: z.string().min(1),
    type: z.enum(EXTRACT_TYPES),
    attrs: z.record(z.string()).optional(),
    multiple: z.boolean().optional(),
    ...COMMENT_FIELD,
  })
  .strict();

const PersonaOverrideSchema = z
  .object({
    layout: z.string().min(1).optional(),
    hide: z.array(z.string()).optional(),
    emphasize: z.array(z.string()).optional(),
    ...COMMENT_FIELD,
  })
  .strict();

const PersonasSchema = z
  .object(
    PERSONA_VALUES.reduce<Record<(typeof PERSONA_VALUES)[number], z.ZodTypeAny>>(
      (acc, persona) => {
        acc[persona] = PersonaOverrideSchema.optional();
        return acc;
      },
      {} as Record<(typeof PERSONA_VALUES)[number], z.ZodTypeAny>,
    ),
  )
  .strict();

const RouteSchema = z
  .object({
    match: z
      .object({
        pattern: z.string().min(1),
      })
      .strict(),
    layout: z.string().min(1),
    extract: z.array(ExtractRuleSchema),
    personas: PersonasSchema.optional(),
    ...COMMENT_FIELD,
  })
  .strict();

const RulePackSchema = z
  .object({
    $schema: z.string().min(1),
    domain: z.string().min(1),
    version: z.string().min(1),
    routes: z.array(RouteSchema),
  })
  .strict();

/**
 * Validate an arbitrary `unknown` payload as a `RulePack`. Throws `ZodError`
 * on any deviation from the contract. The cast to `RulePack` is safe: the
 * Zod schema is the runtime mirror of the static type.
 */
export function validate(input: unknown): RulePack {
  return RulePackSchema.parse(input) as RulePack;
}

/**
 * Load a bundled rule pack for the given eTLD+1. The `fetcher` resolves a
 * path (relative to the extension origin) to its parsed JSON payload —
 * supplied by the content script as something like
 * `(p) => fetch(chrome.runtime.getURL(p)).then((r) => r.json())`.
 *
 * Returns `null` when the fetcher rejects (pack file missing, network error,
 * etc.). Validation errors propagate: a malformed bundled pack is a build-
 * time defect that must not be silently ignored.
 */
export async function loadBundled(
  domain: string,
  fetcher: (url: string) => Promise<unknown>,
): Promise<RulePack | null> {
  let raw: unknown;
  try {
    raw = await fetcher(`rule-packs/${domain}.json`);
  } catch {
    return null;
  }
  return validate(raw);
}
