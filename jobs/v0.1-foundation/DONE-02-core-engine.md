# Completed: Core engine implementation (Track 2)

**Task:** 02-core-engine.md | **Status:** done | **Date:** 2026-05-02

## Changes Made

- `packages/core/src/domain-verifier.ts:1-91` — replaced the `unknown`-only
  stub with the real `verifyDomain(hostname, list)`. Lowercases + trims +
  drops a trailing dot, parses eTLD+1 via `psl`, exact-matches against the
  roster, falls back to `findNearest`, then explicitly re-checks the
  homograph-folded eTLD+1 so a Cyrillic gov domain not on the roster can
  never come back `verified` by accident.
- `packages/core/src/lookalike.ts:1-316` — full rewrite. Two-row DP
  Levenshtein, IDN decoder via `idna-uts46-hx`, embedded Unicode TR39
  confusable table (Cyrillic + Greek + Latin-extended look-alikes),
  layered detector: homograph → TLD swap → suffix attack → Levenshtein ≤ 2.
  Suffix attacks (`anaf-portal.ro`, `anafportal.ro`) live in the
  `levenshtein` reason bucket per the task spec, even though the raw edit
  distance exceeds 2 — they're caught by SLD-prefix matching against the
  verified roster.
- `packages/core/src/rule-pack-loader.ts:1-114` — replaced the
  hand-rolled `validate` with a Zod schema that mirrors `types.ts` exactly.
  Every nested object is `.strict()`. `loadBundled` distinguishes fetcher
  errors (returns `null`) from validation errors (rethrows ZodError so a
  malformed bundled pack surfaces in CI).
- `packages/core/src/semantic-extractor.ts:1-98` — iterates rules over the
  injected `SerializableDoc`, applies the `attrs` mapping (`textContent`
  alias plus named attributes), and emits one node per match. Pure: no
  input mutation, missing selectors silently drop the node.
- `packages/core/src/persona.ts:1-67` — `applyPersonaOverrides` returns a
  new `Route` value with `hide` / `emphasize` / `layout` applied. Hide
  beats emphasize on the same id; emphasize order is preserved; routes
  with no override return by reference (cheap no-op).
- `packages/core/src/index.ts:1-31` — refreshed barrel comment and added
  `LookalikeMatch` type re-export so the extension shell can type its
  background icon state machine.
- `packages/core/src/psl-shim.d.ts:1-30` — local declaration shim. `psl`
  ships its types under `types/index.d.ts` but its `package.json` exports
  map omits the `types` condition, so TS Bundler resolution can't find
  them upstream. Re-declared the small surface we use.

## Tests Written

- `packages/core/tests/domain-verifier.test.ts` — 21 tests covering
  exact match, www / spv subdomains, psl public-suffix collapse
  (`mai.gov.ro` → `gov.ro`), case + trailing-dot + whitespace
  normalisation, all three lookalike reasons (suffix attack, TLD swap,
  homograph, Punycode IDN), defensive returns for empty / IPv4 / IPv6 /
  localhost / single-label / empty roster / malformed roster, plus a
  no-mutation guarantee on the input roster.
- `packages/core/tests/lookalike.test.ts` — 35 tests: levenshtein
  primitive (7 — kitten→sitting, identical strings, empty operands,
  symmetry, single sub/del/ins), homograph folding (8 — pure ASCII pass,
  case + trim, trailing dot, Cyrillic а, Greek ο, Punycode round-trip,
  empty input), TLD swap (4 — anaf.com / .org / .net, onrc.com),
  suffix attacks under the `levenshtein` reason (3 — `anaf-portal.ro`,
  `anafportal.ro`, `onrc-payments.ro`), single-edit Levenshtein typos
  (3), six negative cases (google.com, wikipedia.org, off-list,
  empty input, empty roster, the verified domain itself), two
  robustness cases (uppercase + trailing dot, whitespace-only).
- `packages/core/tests/rule-pack-loader.test.ts` — 15 tests covering
  happy path, missing required fields (`domain`, `routes`), wrong enum
  on `extract.type`, extra fields at root and inside nested objects,
  non-object inputs (null, string), empty `id` rejection, optional
  personas, fetcher success path, fetcher rejection (Error and
  non-Error), validation rethrow on bad payload, path construction.
- `packages/core/tests/semantic-extractor.test.ts` — 12 tests covering
  empty rule list, single extraction picking the first match, multiple
  mode with indexed ids, missing-element drop semantics, textContent vs
  named-attribute mapping, missing attribute defaults to '', type
  preservation, attrs-omitted yields empty data, no input mutation,
  URL passthrough, multiple-with-no-matches.
- `packages/core/tests/persona.test.ts` — 13 tests covering identity
  for missing-personas / missing-entry / empty-override, hide /
  emphasize / layout individually, the pensioner combination case,
  no-mutation on both route and extract array, silent ignore for
  nonexistent ids, hide-wins precedence over emphasize, route.match
  passthrough.
- Pre-existing `packages/core/tests/no-dom.test.ts` (2) and
  `packages/core/tests/types.test.ts` (12) continue to pass — the
  baseline assertions were preserved by design.

**Total:** 110 tests, 190 assertions, 0 failures.

## Acceptance Criteria Check

### `domain-verifier.ts`

- [x] `verifyDomain` is the only public export
- [x] Uses `psl` for eTLD+1 parsing
- [x] Returns `verified` on exact match
- [x] Returns `lookalike` via `findNearest`
- [x] Returns `unknown` otherwise
- [x] Hostnames normalised (lowercase, trim, IDN-decode via
      `idna-uts46-hx` inside the lookalike layer)
- [x] Defensive against empty/malformed inputs (never throws)

### `lookalike.ts`

- [x] `levenshtein(a, b)` exported
- [x] `normalizeHomograph(domain)` folds Cyrillic / Greek confusables
      using a documented TR39-derived map
- [x] `findNearest(host, list)` returns the layered result
- [x] TLD swap: `anaf.com` → matches `anaf.ro` with reason `tld_swap`
- [x] Suffix attack: `anaf-portal.ro` → flagged via `levenshtein`
      reason
- [x] Homograph: `аnaf.ro` (U+0430) → flagged via `homograph`
- [x] Distance threshold: `levenshtein ≤ 2` triggers a flag
- [x] `google.com` / `wikipedia.org` not flagged

### `rule-pack-loader.ts`

- [x] Zod schema mirrors `types.ts` with `.strict()` on every object
- [x] `validate(input)` throws `ZodError` on bad input
- [x] `loadBundled(domain, fetcher)` calls injected fetcher,
      validates, returns pack or null
- [x] No real `fetch` in this module

### `semantic-extractor.ts`

- [x] `extract(rules, doc, url)` iterates rules and applies
      `query`/`queryAll` per `multiple`
- [x] `attrs` map handles `textContent` alias and named attrs
- [x] Missing elements omit nodes (no throw)
- [x] `id` preserved from rule onto output node (suffixed for
      `multiple`)
- [x] `domain` and `layout` returned empty by design

### `persona.ts`

- [x] `applyPersonaOverrides(route, persona)` returns new Route
- [x] No mutation of input
- [x] Identity when no override exists for the persona
- [x] `hide` removes matching ids
- [x] `emphasize` lifts ids to head, preserving emphasize order
- [x] `layout` overrides default

### Public surface

- [x] `index.ts` re-exports every named export from the five modules
      plus `types.ts` (also exposes `LookalikeMatch`)
- [x] No `default` exports
- [x] `bun run check` passes (strict, no `any`)

## Invariant Check

- [x] Original DOM unchanged (N/A — pure module, no DOM access)
- [x] No form data read or written
- [x] No remote code; no `eval` / `Function()` / remote script
- [x] No new network requests; no `fetch` / `XMLHttpRequest` in source
- [x] "Afișează site-ul original" still hides overlay (N/A here —
      core has no rendering surface)

## Cross-Browser Check

- [x] Chrome (latest stable) — N/A, core is DOM-free; the build
      embeds it into the extension bundle which loads cleanly
- [ ] Firefox — deferred per v0.1 Chrome-desktop-only scope

## Notes

- `psl` ships its TS types under `types/index.d.ts` but the
  `package.json` `exports` map does not surface them under TS Bundler
  resolution. Worked around with a local `psl-shim.d.ts`. Upstream fix
  would be a `types` condition in the exports map; documented inline.
- The Punycode test (`xn--naf-5cd.ro` → `аnaf.ro`) was empirically
  generated via `idna-uts46-hx.toAscii('\u0430naf.ro')` rather than
  guessed. The naïve guess `xn--naf-9cd.ro` decodes to a different
  Cyrillic letter (б, not а).
- Suffix-attack detection uses an SLD-prefix check (verified SLD is a
  prefix of the candidate SLD with the same TLD), reported under
  `reason: 'levenshtein'` per the task spec. Pure Levenshtein at
  distance ≤ 2 cannot reach `anaf-portal.ro` (distance 7).
- ESLint cannot run (`bun run lint` fails because the scaffold ships
  a v8-format `.eslintrc.cjs` while the lockfile carries ESLint v9).
  Pre-existing condition; out of scope. Filed as a follow-up below.

## Follow-ups worth filing

1. **Fix project ESLint config.** `.eslintrc.cjs` is a v8 format; ESLint
   v9 expects `eslint.config.js`. Affects all packages.
2. **Upstream PR to `psl`.** Add `"types": "./types/index.d.ts"` to the
   `exports[.]` map so consumers under Bundler resolution don't need a
   local shim.
3. **Confusable map review.** The TR39 table embedded in
   `lookalike.ts` is intentionally small. A registrar-style audit for
   commonly-abused Romanian-context homographs (`ş` vs `s`, `ţ` vs
   `t`, etc.) would harden detection.
