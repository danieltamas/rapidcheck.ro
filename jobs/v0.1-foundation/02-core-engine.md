# Task: Core engine implementation (Track 2)

**Job:** v0.1-foundation
**Group:** core
**Branch:** `job/v0.1-foundation/core-engine`
**Mode:** Worker (single-task)
**Touches only:** `packages/core/**`

> **v0.1 = Chrome desktop ONLY.** No Firefox tooling, no `web-ext`, no `addons-linter`, no `node-forge`.

---

## Mission

Replace the empty stubs in `@onegov/core` with the full implementation of the five engine modules: domain verifier, lookalike detector, rule-pack loader+validator, semantic extractor, persona override applier. **The package must remain DOM-free, browser-API-free, and fully unit-testable in pure Node.**

The types in `packages/core/src/types.ts` are the contract; do not change them. If you find a real bug in a type, stop and report — do not edit.

---

## Acceptance criteria

### `domain-verifier.ts`

- [ ] `verifyDomain(hostname: string, list: VerifiedDomainList): DomainStatus` is the only public export
- [ ] Uses `psl` for eTLD+1 parsing
- [ ] Returns `{ kind: 'verified', domain }` on exact eTLD+1 match
- [ ] Returns `{ kind: 'lookalike', nearest, distance, reason }` if `findNearest` matches
- [ ] Returns `{ kind: 'unknown' }` otherwise
- [ ] Hostnames are normalized (lowercased, trimmed, IDN-decoded via `idna-uts46-hx`) before lookup
- [ ] Defensive against empty/malformed inputs (returns `unknown`, never throws)

### `lookalike.ts`

- [ ] `levenshtein(a: string, b: string): number` — pure, exported for testability
- [ ] `normalizeHomograph(domain: string): string` — folds Cyrillic / Greek confusables to ASCII (use a small static map; document the chosen confusable set; cite Unicode TR39 confusables.txt as the source if you embed entries)
- [ ] `findNearest(host: string, list: VerifiedDomainList): { nearest: VerifiedDomain; distance: number; reason: 'levenshtein' | 'homograph' | 'tld_swap' } | null`
- [ ] **TLD swap detection:** `anaf.com` → matches `anaf.ro` with reason `tld_swap`
- [ ] **Suffix attack detection:** `anaf-portal.ro` → flagged via `levenshtein` reason
- [ ] **Homograph detection:** `аnaf.ro` (U+0430 Cyrillic а) → flagged via `homograph` reason
- [ ] Distance threshold: `levenshtein ≤ 2` triggers a flag (pre-TLD-swap fallback)
- [ ] Genuine off-list domains (e.g. `google.com`) are NOT flagged

### `rule-pack-loader.ts`

- [ ] Zod schema mirrors the `RulePack` type from `types.ts` (use `.strict()` on every object)
- [ ] `validate(input: unknown): RulePack` throws `ZodError` on bad input
- [ ] `loadBundled(domain: string, fetcher: (url: string) => Promise<unknown>): Promise<RulePack | null>` calls the injected fetcher, validates, returns `RulePack` or `null` if not found
- [ ] **No real `fetch` here.** The fetcher is injected at call site (the content script provides one wired to `chrome.runtime.getURL`). This keeps the package DOM-free.

### `semantic-extractor.ts`

- [ ] `extract(rules: ExtractRule[], doc: SerializableDoc, url: string): SemanticTree`
- [ ] Iterates rules; for each, uses `doc.query` or `doc.queryAll` based on `multiple`
- [ ] Maps `attrs` keys to either `'textContent'` or a named DOM attribute
- [ ] Missing elements → node omitted from output (does NOT throw)
- [ ] Preserves `id` from rule into output `SemanticNode`
- [ ] Output `SemanticTree.layout` defaults to the route's layout (caller passes — see `persona.ts`); for this module's signature, return a tree with empty `layout` string and let the caller fill it

### `persona.ts`

- [ ] `applyPersonaOverrides(route: Route, persona: Persona): Route`
- [ ] Returns a new `Route` object (do not mutate the input)
- [ ] If no override exists for the persona, returns the input route unchanged
- [ ] `hide` semantics: extract rules with matching ids are removed from `route.extract`
- [ ] `emphasize` semantics: matching ids are moved to the head of `route.extract`, in given order
- [ ] `layout` semantics: replaces `route.layout` if specified

### Public surface

- [ ] `packages/core/src/index.ts` re-exports every named export from the five modules + `types.ts`
- [ ] No `default` exports — named only
- [ ] `bun run check` passes (strict mode, no `any`)

---

## Required tests (in `packages/core/tests/`)

All using `bun:test`. Aim for ~50+ assertions across these files.

### `domain-verifier.test.ts` (≥ 10 cases)

- Verified eTLD+1 → `verified`
- Subdomain of verified (`www.anaf.ro`, `spv.anaf.ro`) → `verified` (via eTLD+1 match)
- Off-list (`google.com`) → `unknown`
- Lookalike (`anaf-portal.ro`) → `lookalike`
- Empty string → `unknown` (no throw)
- IPv4 literal → `unknown`
- `localhost` → `unknown`
- Mixed case (`ANAF.RO`) → `verified` after normalization
- Trailing dot (`anaf.ro.`) → `verified`
- Punycode IDN input (`xn--naf-...`) resolves to its homograph canonical and flags as `lookalike`

### `lookalike.test.ts` (≥ 20 cases — the security-critical module)

Levenshtein:
- `levenshtein('kitten','sitting')` = 3
- `levenshtein('','abc')` = 3
- `levenshtein('a','a')` = 0

Homograph:
- `аnaf.ro` (Cyrillic а U+0430) → `lookalike`, reason `homograph`
- `οnrc.ro` (Greek ο U+03BF) → `lookalike`, reason `homograph`
- All-ASCII genuine off-list (`google.com`) → null

TLD swap:
- `anaf.com`, `anaf.org`, `anaf.net` → `lookalike`, reason `tld_swap`

Suffix attack:
- `anaf-portal.ro` → `lookalike`, reason `levenshtein`
- `anafportal.ro` → `lookalike`, reason `levenshtein`

Negative cases:
- `wikipedia.org` (distance > 2 from any) → null
- `unrelated.gov.ro` → null
- Empty input → null (no throw)

### `rule-pack-loader.test.ts`

- Valid pack fixture → returns typed `RulePack`
- Missing required field (e.g. no `domain`) → throws `ZodError`
- Wrong type (`extract.type: 'invalid'`) → throws `ZodError`
- Extra unknown field at root → throws `ZodError` (because `.strict()`)
- `loadBundled` with a fetcher that throws → returns `null`
- `loadBundled` with a fetcher returning malformed JSON → throws

### `semantic-extractor.test.ts`

- Single extraction picks first match
- `multiple: true` returns all matches
- Missing element → node omitted (output array shorter)
- `textContent` attr mapping works
- Named attr (`href`) mapping works
- Empty rule list → empty `nodes` array
- Node `id` preserved exactly

### `persona.test.ts`

- No override for persona → input route returned unchanged (referential equality NOT required, but field-equal)
- `hide` removes matching ids
- `emphasize` lifts matching ids to top, preserving relative order
- `layout` override replaces route default
- Combination: `hide` + `emphasize` + `layout` all applied

---

## Hard constraints

- **No `chrome.*` / `browser.*` / `document` / `window` / `fetch` / `XMLHttpRequest`.** Lint rule will catch you; reviewer will catch you.
- **No new dependencies** beyond what Track 1 added (`psl`, `idna-uts46-hx`, `zod`).
- **No mutation of input objects.** Pure functions everywhere.
- **MAX 500 lines per file.**
- **No `any`.** Use `unknown` and narrow.
- **English in code; English commit messages.** Conventional Commits.
- **No `Co-Authored-By` trailers ever.**
- **Do not modify `types.ts`.** If you find a real type bug, stop and report.

---

## What you will report back

After completion, write `jobs/v0.1-foundation/DONE-02-core-engine.md` per `CLAUDE.md §Step 4`.

In the summary to me:
1. Branch + commit hashes (latest 5)
2. Tail of `bun run check`, `bun test --filter @onegov/core`, `bun run build`
3. Test count: total assertions, passing count, any skipped
4. `bun pm ls 2>&1 | grep -ci node-forge` (must be 0)
5. Any deviations + justification
6. Any follow-up tasks worth filing
7. Files changed count

Be terse.

---

## Out of scope

- UI work (Track 3)
- Extension shell wiring (Track 4)
- Rule-pack content / verified-domain roster expansion (Track 5)
- E2E tests (later)
- Custom invariant ESLint rules (separate follow-up)
