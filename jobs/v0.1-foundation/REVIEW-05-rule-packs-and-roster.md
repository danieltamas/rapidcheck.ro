# Review: Rule packs + verified-domain roster (Track 5)

**Task:** 05-rule-packs-and-roster.md | **Reviewer verdict:** FAIL | **Date:** 2026-05-02
**Branch:** `job/v0.1-foundation/rule-packs` (worktree `.claude/worktrees/agent-a294256d`)
**Reviewer worktree:** `.claude/worktrees/agent-af874075`
**Worker commits reviewed:** `8beca21`, `bec36fe`, `fd43cd1`, `b7d7fd6` (vs merge-base `0f406bc`)

---

## Process gate (CLAUDE.md §Branching & Merge Protocol rule 6)

- [x] Worker worktree clean before review (`git status --porcelain` returned empty)
- [x] Worker on correct branch (`job/v0.1-foundation/rule-packs`)
- [x] Worker stayed in scope: only `rule-packs/`, `scripts/validate-packs.ts`, `jobs/v0.1-foundation/qa/`, `jobs/v0.1-foundation/DONE-05-*.md` modified (verified via `git diff --stat <merge-base>..HEAD`)

The diff-stat against `main` is misleading because Track 2 (and Track 4a) have been merged into `main` after this branch diverged at `0f406bc`. Diff-stat against the actual merge-base shows clean scope: 15 files, 2101 insertions, 16 deletions, all in the worker's allowed paths.

---

## Tests

- [x] `bun install` clean (131 packages, no `node-forge` — `bun pm ls 2>&1 | grep -ci node-forge` = 0)
- [x] `bun run check` exits 0 (typecheck passes)
- [x] `bun test` — 14/14 pass on the worker branch (worker branched before Track 2 landed; Track 2's 96 tests are not on this branch yet, but main is at 110/110, so the post-rebase test count will be 110+ — verified separately on main)
- [x] `bun run validate-packs` exits 0 (7 files checked: 6 packs + `_verified-domains.json`)
- [x] `bun run build` exits 0 (background.js / content.js / popup.js all built)
- [x] No `Co-Authored-By` trailers (`git log main..HEAD --format="%B" | grep -i co-authored` returns nothing)

---

## Code Quality

- [x] All 6 packs have `domain` field matching their filename eTLD+1 (well, filename; see warning below for `dgep.mai.gov.ro`)
- [x] No pack uses `:has(script)` or other selectors triggering page-side computation
- [x] All persona-override `hide` / `emphasize` references resolve to existing `extract.id`s in the same route (verified via cross-reference script — 0 missing refs across all 6 packs)
- [x] No duplicate `extract.id`s within any single route (verified)
- [x] All packs have at least one persona override producing visibly different output (per QA notes; itmcluj.ro confirmed all four personas distinct per task hard requirement)
- [x] `_verified-domains.json` `version` bumped from `0.0.0` to `0.1.0`
- [x] `_verified-domains.json` `updatedAt` = `2026-05-02` (today)
- [x] All 73 entries have `domain`, `category`, `addedAt`, `source` fields populated
- [x] All `addedAt` values are valid ISO `YYYY-MM-DD`
- [x] All `source` values are http(s) URLs
- [x] All `domain` values are eTLD+1 form (no scheme, no path, no `www.` prefix, no slashes)
- [x] No duplicate domains
- [x] No commercial vendor sites in the roster — every entry resolves to a Romanian state institution or the project's own demoanaf.ro (sole `public-interest`)
- [x] Lookalike fallout test: 0 verified entries flagged as `lookalike` against another verified entry (0 false positives)
- [x] Lookalike still catches expected attacks: `anaf-portal.ro`, `anaf.com`, `anaf.org`, `ghiseul.org` all return `lookalike` (verified empirically)
- [x] Subdomain verification works: `www.anaf.ro`, `static.anaf.ro`, `subdomain.cdep.ro` all return `verified`
- [x] Manifest untouched: `git diff main packages/extension/src/manifest.json` is empty
- [x] Each shipped rule-pack domain has a matching entry in `manifest.json` `host_permissions` (cross-checked: anaf, dgep, ghiseul, itmcluj, portal.just.ro, rotld all covered)
- [x] QA notes exist for all 6 packs (`jobs/v0.1-foundation/qa/<domain>/notes.md`, 46–70 lines each, with per-`extract.id` selector verification tables, fragile-selector callouts, CAPTCHA/cookie posture, persona summaries)
- [x] DONE report claims match reality (73 entries verified by `jq`/script; the worker even self-corrected the count from 71 → 73 in `b7d7fd6`)
- [x] JSON files end with trailing newline
- [x] No trailing commas (it's plain JSON)
- [x] Conventional Commits format throughout
- [x] No `chrome.*` or `fetch(`/`XMLHttpRequest`/`sendBeacon`/`WebSocket`/`EventSource` in `scripts/validate-packs.ts`

---

## Schema compatibility check (orchestrator's mandated empirical test)

**Empirically tested with the actual production validator from `main`:**

```bash
cd /Users/danime/Sites/onegov.ro && bun -e '
import { validate } from "./packages/core/src/index.ts";
import fs from "node:fs";
for (const p of ["anaf.ro","dgep.mai.gov.ro","ghiseul.ro","itmcluj.ro","portal.just.ro","rotld.ro"]) {
  const data = JSON.parse(fs.readFileSync(".claude/worktrees/agent-a294256d/rule-packs/" + p + ".json", "utf-8"));
  try { console.log("PASS", p, "→", validate(data).domain); }
  catch (e) { console.log("FAIL", p, "→", e.errors?.[0]?.path?.join(".") || "?", ":", e.errors?.[0]?.message || e.message); }
}
'
```

**Result — every single pack FAILS:**

```
FAIL anaf.ro          → routes.0.extract.0 : Unrecognized key(s) in object: '_comment'
FAIL dgep.mai.gov.ro  → routes.0.extract.0 : Unrecognized key(s) in object: '_comment'
FAIL ghiseul.ro       → routes.0.extract.0 : Unrecognized key(s) in object: '_comment'
FAIL itmcluj.ro       → routes.0.extract.0 : Unrecognized key(s) in object: '_comment'
FAIL portal.just.ro   → routes.0.extract.0 : Unrecognized key(s) in object: '_comment'
FAIL rotld.ro         → routes.0.extract.0 : Unrecognized key(s) in object: '_comment'
```

**Counted `_comment` occurrences across all 6 packs:**
- 10 at the route level
- 68 at the extract-rule level
- 15 at the persona-override level
- **Total: 93 `_comment` fields, all in violation of the production `.strict()` schema.**

The worker's `scripts/validate-packs.ts` (lines 119–122, 137–139, 145–148) explicitly tolerates `_comment` strings at all three levels via inline branches — the comment at line 16–17 even acknowledges this divergence from the canonical Zod schema. The worker also flagged the discrepancy in the DONE report's "Hand-off notes for Track 2" section, recommending Track 2 either preserve the tolerance or strip comments at lint time.

**Track 2 has already merged to `main`** with a strict schema (6 `.strict()` calls in `packages/core/src/rule-pack-loader.ts` on `main`). When this branch is merged, the production loader will reject every pack at runtime — the content script's `loadBundled(domain, fetcher)` re-throws validation errors (it only swallows fetcher errors, not validation errors), so the extension will simply never render any overlay on any of the 6 demo sites. This is a v0.1 ship-blocker.

---

## Issues Found

### 🔴 Blockers (must fix before merge)

- **`rule-packs/*.json` (all 6 packs) — `_comment` fields will be rejected by the production `@onegov/core/validate()`.** Verified empirically against `main` (where Track 2's strict schema landed). 93 `_comment` fields across the 6 packs, all in object positions that the production Zod schema rejects with `.strict()`. The worker's local `scripts/validate-packs.ts` tolerates these because it's an inline shape validator that long-since diverged from the canonical schema; it should never have been the only gate.

  **Three options for the orchestrator (do exactly one):**

  1. **(RECOMMENDED) Patch the production schema to accept `_comment` strings.** Edit `packages/core/src/rule-pack-loader.ts` on `main` to add `_comment: z.string().optional()` to `ExtractRuleSchema`, `RouteSchema`, and `PersonaOverrideSchema` — three single-line additions, each before `.strict()`. This preserves the worker's authoring nicety (the comments are genuinely useful — they document selector source, fragility rationale, persona intent — see e.g. anaf.ro.json:7, ghiseul.ro.json:7) and keeps `.strict()` on every other key. Add a Track-2 follow-up to `docs/LOG.md`. The worker already wired tests to demand strictness, so add one positive test case asserting `_comment` is accepted and one negative test case asserting unknown non-`_comment` keys are still rejected.

  2. Strip `_comment` fields from all 6 packs before merge. This loses the documentation but keeps the schema pure. The QA notes carry most of the same information, so it's not a total loss.

  3. (DO NOT CHOOSE) Loosen `.strict()` to `.passthrough()`. This weakens the security posture — silently accepting any unknown key opens the door to typo-ed selectors, mis-named persona overrides, and shape drift over time. SECURITY.md §4 explicitly calls out the strict-schema check.

### 🟡 Warnings (should fix)

- **`rule-packs/_verified-domains.json:1-444` — 10 `*.gov.ro` entries are shadowed by the bare `gov.ro` entry under PSL.** Verified empirically: `verifyDomain("mai.gov.ro", list)` returns the `gov.ro` entry, not `mai.gov.ro`. Same for `mfinante.gov.ro`, `anpis.gov.ro`, `mcid.gov.ro`, `economie.gov.ro`, `pnrr.gov.ro`, `transparenta.gov.ro`, `fara-hartie.gov.ro`, `identitate.gov.ro`, `sgg.gov.ro`. They still verify (return `kind: "verified"`), but the matched entry is always `gov.ro`. Either: (a) drop the shadowed entries (preferred — removes dead config); (b) document at the top of the file why they're listed despite being shadowed (e.g. "explicit endorsement of which gov.ro branches the maintainer trusts"). Not a runtime bug, but the roster should mean what it says.

- **`rule-packs/dgep.mai.gov.ro.json` — pack `domain` field is the full hostname, not eTLD+1.** Every other pack uses eTLD+1 (`anaf.ro`, `ghiseul.ro`, `itmcluj.ro`, `portal.just.ro`, `rotld.ro`). `dgep.mai.gov.ro.json` uses the subdomain because the parent pack (`mai.gov.ro` would be too broad). The production schema (`z.string().min(1)`) doesn't enforce eTLD+1 form, and the manifest's `host_permissions` includes `*://dgep.mai.gov.ro/*` (matches), so this works. But `loadBundled(domain, fetcher)` constructs `rule-packs/${domain}.json` from a `domain` argument supplied by the content script (Track 4) — Track 4 needs to know which domain string to pass (full hostname vs eTLD+1). This isn't a Track-5 blocker, but Track 4 should be briefed accordingly.

- **`rule-packs/_verified-domains.json` — `iccj.ro` source URL points to `scj.ro`** (Supreme Court of Justice) rather than the iccj.ro institution itself. ICCJ is the Înalta Curte de Casaţie şi Justiţie; scj.ro may be a redirect or sister institution. Worth a sourced URL pointing at iccj.ro directly (e.g. `https://www.iccj.ro/contact`) for clarity.

### 🟢 Suggestions (optional)

- **`scripts/validate-packs.ts:1-326` — once the schema patch lands (per Blocker resolution option 1), trim this script to a thin wrapper around `@onegov/core/validate()` plus a small inline `validateVerifiedDomainList()` (since `@onegov/core` doesn't export one).** The worker explicitly flagged this in the DONE Hand-off notes section and the inline shape validator is an obvious maintenance liability — every schema field is now duplicated between `packages/core/src/rule-pack-loader.ts` and `scripts/validate-packs.ts`. Track 2's schema is the source of truth; this script should consume it.

- **`rule-packs/anaf.ro.json:7,79` — both routes target a single ANAF deployment path (`/anaf/internet/ANAF/`).** The worker's QA note explains why (`/web/guest/persoane-juridice/cui-platitor-tva` returned WebSEAL 403, real public CUI lookup is at `webservicesp.anaf.ro` with no UI page). Worth surfacing this in a v0.1 README or `SITES_COVERAGE.md` follow-up so the gap doesn't surprise demo viewers.

- **`rule-packs/itmcluj.ro.json:35-40` (`phone-numbers`)** — the QA note flags that `ul[type="square"]` lives inside a synthetic iframe and the v0.1 content script will silently extract zero nodes. Acceptable given v0.1 renderer contract handles empty `multiple: true` extractions, but the v0.2 frame-walker work item is worth opening as a tracking issue now while the context is fresh.

- **DONE-05 `bec36fe` commit message body says "expand verified-domains roster from seed to 71 entries"** — actual count is 73. Self-corrected in `b7d7fd6` for the DONE report but the commit message is permanent. Not actionable; logged for completeness.

---

## Summary

The rule-pack content is genuinely high-quality work — the selector audits are thorough, the QA notes are detailed, the persona overrides produce visibly distinct outputs (especially on itmcluj.ro per the task's hard requirement), and the verified-domain roster more than doubles the required count (73 vs ≥30 required) with disciplined sourcing. The lookalike fallout test passes cleanly and verification still works correctly for both subdomains and known phishing patterns.

The blocker is purely schema-compatibility: the worker's local validator and the production validator from `@onegov/core` (already on `main` post-Track-2-merge) diverged on a single point — `_comment` tolerance — and the worker authored 93 such fields. The fix is small and reversible (3-line schema patch on main) and the worker explicitly flagged the risk in their DONE hand-off note.

**Recommendation:** orchestrator applies the Blocker option 1 schema patch on `main`, then re-runs the empirical test to confirm all 6 packs validate, then merges this branch.
