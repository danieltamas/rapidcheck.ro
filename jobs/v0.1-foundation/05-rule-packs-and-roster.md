# Task: Rule packs + verified-domain roster (Track 5)

**Job:** v0.1-foundation
**Group:** rule-packs
**Branch:** `job/v0.1-foundation/rule-packs`
**Mode:** Worker (single-task)
**Touches only:** `rule-packs/**` (and `scripts/validate-packs.ts` if the validator needs to be fleshed out beyond the Track 1 stub)

> **v0.1 = Chrome desktop ONLY.** No Firefox concerns; rule packs are platform-agnostic.

---

## Mission

Author the six v0.1 rule packs and curate the verified-domain roster from the seed list to ≥ 30 production-quality entries. Rule packs are pure declarative JSON validated by Zod; you will not write TypeScript except to extend `scripts/validate-packs.ts` if needed.

The verified-domain roster is the single highest-leverage v0.1 artifact (per SITES_COVERAGE.md): it powers the green/gray/red phishing detection independently of rule-pack coverage.

---

## Acceptance criteria

### `rule-packs/_verified-domains.json` — expand seed to ≥ 30 entries

- [ ] Bump `version` to `0.1.0`
- [ ] Update `updatedAt` to today's ISO date (`2026-05-02`)
- [ ] At least the **15 seed domains** from `SPEC.md` Appendix A
- [ ] Plus enough additional entries from `SITES_COVERAGE.md` §3 (Tier 1) and §6 (Tier 2 ministries / regulators) to reach **≥ 30 total**
- [ ] Every entry has all four fields: `domain` (eTLD+1, no scheme/path/subdomain), `category` (`gov` or `public-interest`), `addedAt` (ISO date), `source` (URL pointing to public evidence the domain is operated by a Romanian public institution)
- [ ] **Curation discipline** (per CONTRIBUTING.md):
  - No commercial vendor sites (notary marketplaces, accounting SaaS, e-commerce platforms even if "gov-adjacent")
  - No domains you cannot personally evidence are operated by a Romanian public institution
  - `category: gov` for state institutions; `category: public-interest` only where genuinely warranted (e.g. `demoanaf.ro`)

### Six v0.1 rule packs

Order is the priority order — get `anaf.ro.json` and `itmcluj.ro.json` solid first, since those are the demo headliners.

#### `rule-packs/anaf.ro.json`

- [ ] Two routes: `^/$` (homepage) and one inner page (suggested: the public CUI lookup at `/web/guest/persoane-juridice/cui-platitor-tva`)
- [ ] Layouts: `landing` and `lookup`
- [ ] Extract rules with stable selectors (prefer `[data-*]` and stable IDs; structural selectors only as fallback). Document selector source in a leading `_comment` field at the route level.
- [ ] At least one persona override per route (`pensioner` simplifies; `pro` densifies)
- [ ] Validates against the Zod schema

#### `rule-packs/dgep.mai.gov.ro.json`

- [ ] Homepage route + appointment-flow route
- [ ] **Most-complained category on fara-hartie.gov.ro** — this is the symbolically-loaded pack. Make it good.
- [ ] Persona overrides emphasize the appointment booking CTA for `pensioner`

#### `rule-packs/portal.just.ro.json`

- [ ] Case search route
- [ ] **Self-admitted broken** institutional showcase — render the search form and result list cleanly
- [ ] Persona overrides hide the "alternative search engine" advisory banner for `pro` (they know what to do)

#### `rule-packs/ghiseul.ro.json`

- [ ] Homepage + payment flow route
- [ ] Highest-traffic gov site; baseline comparison case
- [ ] Persona overrides distinguish anonymous vs account-based flows

#### `rule-packs/rotld.ro.json`

- [ ] Homepage only
- [ ] Niche showcase for the developer audience (developer-flagged)
- [ ] Minimal pack — just clean up the homepage

#### `rule-packs/itmcluj.ro.json`

- [ ] Homepage only
- [ ] **2005 → 2026 transformation showcase** — the strongest visual contrast available. The single most important demo asset.
- [ ] Family A (legacy `<FONT>` tag) template per SITES_COVERAGE.md §3.7. Selectors will likely be `font`, `td`, `table`-based — that's the whole point.
- [ ] All four persona variants must produce a visibly different result on this site. Pick selectors with that in mind.

### Validator

- [ ] `scripts/validate-packs.ts` (extend from Track 1 stub) loads every `*.json` in `rule-packs/`, parses with `JSON.parse`, then validates with `validate()` from `@onegov/core`
- [ ] Skips `_verified-domains.json` (different schema — validate that separately with a small inline schema or a Zod schema added to `@onegov/core` if you keep this surgical)
- [ ] Exits non-zero on any validation failure
- [ ] Pretty-prints which file failed and which path

### Manual QA

For each of the 6 packs, **manually open the live site in Chrome and inspect** that the selectors you wrote actually pick up the elements you intend. This is critical — rule packs that validate against the schema but don't match real selectors are useless.

- [ ] Document QA in `jobs/v0.1-foundation/qa/<domain>/notes.md` per pack: list each `extract.id`, the live element you targeted, whether your selector hit it
- [ ] If the live site uses anti-bot or CAPTCHA on first load, document that and note the rule-pack will need passthrough handling in v0.2

You do **not** need to load the extension and visually verify the rendered overlay yet — that's Track 4's responsibility. You're verifying selector accuracy only.

---

## Hard constraints

- **No TypeScript edits except `scripts/validate-packs.ts`.** If you find the validator needs a Zod schema for `_verified-domains.json`, you may add it to `@onegov/core` — but flag it loudly in the DONE report and keep it minimal.
- **No `node-forge` in deps.** Verify before commit.
- **Stable selectors.** No CSS-in-JS hashes. No `:nth-child(N)` without a comment justifying it.
- **No host_permissions changes** in the manifest. The Track 1 ship list is authoritative for v0.1.
- **JSON files use 2-space indent**, trailing newline, no trailing commas (it's JSON, not JSONC).
- **English in `_comment` fields**. Where you label a Romanian-language UI element in a comment, quote the Romanian and translate in parens.
- **No `Co-Authored-By` trailers ever.**

---

## What you will report back

After completion, write `jobs/v0.1-foundation/DONE-05-rule-packs-and-roster.md` per `CLAUDE.md §Step 4`.

In the summary:
1. Branch + commit hashes
2. Output of `bun run validate-packs` (must exit 0)
3. Final count of verified-domain roster entries
4. List of the 6 rule packs + which routes each covers
5. Any selector that's known-fragile (with reason — e.g. "site uses CSS-in-JS, fell back to nth-child")
6. Sites where the live HTML differs significantly from what SPEC.md / SITES_COVERAGE.md described (interesting findings worth flagging)
7. `bun pm ls 2>&1 | grep -ci node-forge` (must be 0)
8. Files changed count
9. Path to `jobs/v0.1-foundation/qa/` notes

Be terse.

---

## Out of scope

- Loading the extension and visually verifying rendered output (Track 4 + integration phase)
- Adding new domains to `host_permissions` in the manifest (separate orchestrator-approved task)
- E2E tests against rule packs (later)
- Form-bridging (v0.2)
