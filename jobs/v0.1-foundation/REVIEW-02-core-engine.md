# Review: Track 2 — core engine implementation

**Task:** 02-core-engine.md | **Reviewer verdict:** PASS | **Date:** 2026-05-02

## Tests

- [x] All unit tests pass (110 tests, 190 expect calls, 7 files, 60ms)
- [x] Lookalike security cases empirically verified against a populated roster
  (Cyrillic homograph, TLD swap × 3, suffix attack, negative cases)
- [x] No `node-forge` / `web-ext` / `addons-linter` in `bun pm ls`
- [x] `bun run check` exits 0 (`tsc --build packages/core packages/ui packages/extension`)
- [x] `bun run build` exits 0 (extension bundles produced cleanly)

Test tail (counts):

```
 110 pass
 0 fail
 190 expect() calls
Ran 110 tests across 7 files. [60.00ms]
```

Worker claim of 110/110 verified.

Empirical security verification (run via `bun -e` against a populated test roster
containing `anaf.ro`, `onrc.ro`, `gov.ro`, `mai.gov.ro`, `data.gov.ro`):

```
Cyrillic аnaf.ro:  lookalike, reason=homograph, nearest=anaf.ro
anaf.com:          lookalike, reason=tld_swap,  nearest=anaf.ro
anaf.org:          lookalike, reason=tld_swap,  nearest=anaf.ro
anaf.net:          lookalike, reason=tld_swap,  nearest=anaf.ro
anaf-portal.ro:    lookalike, reason=levenshtein, nearest=anaf.ro
google.com:        unknown
wikipedia.org:     unknown
dgep.mai.gov.ro:   verified  (resolves via psl to gov.ro)
data.gov.ro:       verified  (resolves via psl to gov.ro)
mai.gov.ro:        verified  (resolves via psl to gov.ro)
```

All required cases pass. No false positives on `google.com` / `wikipedia.org`.

## Invariants

- [x] Original DOM unchanged — N/A, package is pure TS with no DOM access.
  Verified by grep: no `document.`, `window.`, `chrome.`, `browser.`,
  `fetch(`, or `XMLHttpRequest` references in `packages/core/src/**`
  (the only matches are JSDoc comments).
- [x] No form data — N/A, no DOM at all.
- [x] **No remote code execution** (load-bearing for Track 2) — no `eval`,
  no `new Function`, no `innerHTML` write, no `setTimeout`/`setInterval`
  with string args, no `import()` with non-literal args. Rule-pack loader
  uses Zod `.parse()` only.
- [x] **Core stays DOM-free** (load-bearing) — verified via the
  `tests/no-dom.test.ts` baseline + grep audit.
- [x] No new network requests — `loadBundled` takes an injected fetcher;
  no `fetch` is called from `@onegov/core` source.

## Code Quality

- [x] No `any` types (grep confirmed)
- [x] No `default` exports (grep confirmed)
- [x] All public exports flow through `packages/core/src/index.ts` barrel
- [x] No file > 500 lines (largest is `lookalike.ts` at 316; tests max at 256)
- [x] Pure functions — `applyPersonaOverrides` returns a new `Route` object
  literal with rebuilt `extract` array; spot-checked by reading the source
- [x] Conventional commit messages on all 7 commits (`feat(core)`, `test(core)`,
  `chore(core)`, `docs(jobs)`)
- [x] No `Co-Authored-By` trailers (verified via `git log main..HEAD --format=%B | grep -i co-authored`)
- [x] No `.only`, `.skip`, `console.log`, or `debugger` in tests
- [x] `packages/core/src/types.ts` is byte-identical to main
  (`git diff main..HEAD -- packages/core/src/types.ts` empty)
- [x] `psl-shim.d.ts` declares only the `psl` runtime surface needed
  (`parse`, `ParsedDomain`, `PslErrorResult`); also declares `get` and
  `isValid` but they are unused — see suggestion below
- [x] Tests exercise edge cases beyond happy paths (Cyrillic+Greek, Punycode
  round-trip, IPv6 literals, malformed roster, no-mutation guards,
  hide-wins-over-emphasize)

## Deviations from worker's DONE report

None of substance. Every claim verified against the diff:

- Test count exact (110)
- All five module deliverables match the file contents
- The `LookalikeMatch` type re-export is in `index.ts` line 28 as claimed
- The `psl-shim.d.ts` is the file claimed and works as advertised
- The Punycode test fixture (`xn--naf-5cd.ro`) was empirically verified by
  re-running `findNearest` against it — returns `homograph` reason with
  `nearest=anaf.ro`

## Notable findings

1. **`psl` collapses `*.gov.ro` to `gov.ro`.** Because `gov.ro` is treated as
   the public suffix in the bundled PSL, every `*.gov.ro` host (including
   `mai.gov.ro`, `dgep.mai.gov.ro`, `data.gov.ro`) reduces to eTLD+1
   `gov.ro`. The verifier picks the `gov.ro` roster entry, never the
   `mai.gov.ro` entry. Effect: ANY `*.gov.ro` subdomain matches as
   `verified` via the `gov.ro` entry. This is correct behaviour
   (Romanian gov controls `.gov.ro` registration), but Track 5 needs to
   know the more-specific `mai.gov.ro` / `data.gov.ro` entries are
   redundant for the verifier — they remain useful for category metadata
   if rule packs key off the specific subdomain entry.

2. **SLD-prefix algorithm choice for suffix attacks.** The worker
   correctly notes pure Levenshtein at distance ≤ 2 cannot reach
   `anaf-portal.ro` (distance 7). The implementation uses an SLD-prefix
   check: any candidate whose SLD starts with a verified SLD on the same
   TLD is flagged as `reason: 'levenshtein'`. Empirical false-positive
   audit:

   - `anaf.ro`, `gov.ro`, `mai.gov.ro` against themselves → `verified`
     (exact match wins; SLD-prefix is skipped for verified entries).
   - `data.gov.ro`, `dgep.mai.gov.ro` → `verified` via the `gov.ro` entry.
   - `government.ro` → `lookalike` of `gov.ro` (false-positive risk on
     legitimate but unaffiliated `.ro` domains starting with `gov`).
   - `anafiscale.ro`, `anafx.ro` → `lookalike` of `anaf.ro` (same risk).

   This is by design — the spec calls suffix attacks under
   `reason: 'levenshtein'`. The false-positive surface is bounded by the
   verified roster: only domains whose first letters match a verified
   SLD on the same TLD get flagged. Given the v0.1 ship list is
   small (~30 entries) and government-scoped, this is acceptable. Worth
   tracking if community-contributed rosters expand to short / common
   SLDs (e.g. adding a hypothetical `it.ro` entry would flag every
   `.ro` domain whose SLD starts with `it`).

3. **Lookalike matches against `gov.ro` roster entries** could collide
   with the suffix-prefix algorithm in unexpected ways once Track 5
   ships the full roster. Lookalike test suite re-run after Track 5
   commits its expanded roster is recommended (per CLAUDE.md SOP for
   "extending the verified domain list").

4. **`route.personas` passthrough.** `applyPersonaOverrides` always
   spreads `personas` through the new `Route` because it's only reached
   when `route.personas` exists. The conditional spread
   `...(route.personas ? { personas: route.personas } : {})` is always
   truthy at this code path; could be `personas: route.personas`
   directly. Cosmetic only.

## Issues Found

### 🔴 Blockers (must fix before merge)

None.

### 🟡 Warnings (should fix)

- `packages/core/src/lookalike.ts:262-291` — the SLD-prefix branch returns
  a `distance` value computed via real Levenshtein against the matched
  verified entry, which can far exceed `MAX_LOOKALIKE_DISTANCE` (e.g. 7
  for `anaf-portal.ro`). The shape is correct
  (`{ kind: 'lookalike', reason: 'levenshtein', distance: 7 }`) but the
  semantic is "this is a suffix attack we caught with a different
  algorithm" — not "this is a typo within 2 edits." Downstream consumers
  (popup status pill, UI badge) shouldn't treat `distance` as
  authoritative on this branch; document this in the JSDoc on
  `LookalikeMatch` so the extension shell doesn't surface the raw
  distance to users as "X edits away."

### 🟢 Suggestions (optional)

- `packages/core/src/psl-shim.d.ts:28-29` — `get` and `isValid` are
  declared but unused. Trim to just the `parse` surface to keep the shim
  honest about what we actually depend on (any future addition would be
  a deliberate decision rather than a dormant declaration).
- `packages/core/src/persona.ts:65` — the conditional spread for
  `personas` is always truthy at that code path (we'd have early-returned
  otherwise). Simplify to `personas: route.personas` and add a
  non-null assertion or a defensive default. Pure cosmetic.
- `packages/core/src/lookalike.ts` — the `CONFUSABLES` table is small by
  design but the worker's follow-up note about Romanian-context
  homographs (`ş` vs `s`, `ţ` vs `t`) is worth pursuing. Out of scope
  for Track 2; file as a follow-up issue against Track 5 or a future
  security-hardening track.
- Consider adding a `levenshtein.test.ts`-style table-driven
  property test that asserts `findNearest` is deterministic for the
  full v0.1 roster (every entry against every entry should return
  `null` — i.e. no roster entry is a lookalike of another). This would
  catch roster-poisoning regressions in Track 5 automatically.

## Reviewer notes

- Worker's DONE report is accurate, terse, and honest. Every checked
  acceptance-criteria box matches the implementation.
- The follow-ups the worker filed (ESLint v8/v9 mismatch, upstream `psl`
  types fix, confusable map review) are all real and worth tracking, but
  none affect this task's verdict.
- Track 2 is unblocked for merge. After merge, rerun the empirical
  security suite once Track 5's expanded `_verified-domains.json` lands;
  the empty roster currently shipped means `verifyDomain` against the
  bundled file returns `unknown` for everything (not a Track 2 bug — Track
  5's deliverable).
