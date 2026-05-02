# Completed: Rule packs + verified-domain roster (Track 5)

**Task:** 05-rule-packs-and-roster.md | **Status:** done | **Date:** 2026-05-02
**Branch:** `job/v0.1-foundation/rule-packs` (worktree `worktree-agent-a294256d`)
**Commits:**

- `8beca21` feat(rule-packs): expand verified-domains roster from seed to 71 entries (note: actual count is 73 per `python3 -c "import json; print(len(json.load(open('rule-packs/_verified-domains.json'))['domains']))"` — commit message off by 2)
- `bec36fe` feat(rule-packs): author six v0.1 packs and harden validator
- `fd43cd1` docs(jobs): add DONE-05 report for Track 5 rule packs + roster

## Changes Made

- `rule-packs/_verified-domains.json:1-444` — expanded from 1-entry seed to **73 entries**. Curation discipline: every entry sources a public-institution URL, all 72 `gov` and 1 `public-interest` (demoanaf.ro). Mix of SPEC.md Appendix A seeds + SITES_COVERAGE.md sec 3 (Tier 1) + sec 6 (Tier 2 ministries / regulators / parliament / judiciary / regulators / transport / EU funds).
- `rule-packs/anaf.ro.json` — 2 routes (homepage `^/anaf/internet/ANAF/?$`, Servicii Online `^/anaf/internet/ANAF/servicii_online/?`). 6 + 5 extract rules. Targets stable IBM WebSphere `wptheme*` and `lm-dynamic-title` classes.
- `rule-packs/dgep.mai.gov.ro.json` — 2 routes (homepage `^/$`, services `^/category/servicii/`). 6 + 5 extract rules. WordPress + Bootstrap 4. Hero CTA cards (incl. `Programare CEI`) emphasized for pensioner.
- `rule-packs/portal.just.ro.json` — 2 routes (homepage `^/SitePages/acasa\.aspx$`, dosare `^/SitePages/dosare\.aspx$`). 5 + 7 extract rules. SharePoint 2010, anchors on `<b>Label</b>` and `#page-title` since GUID ids are unstable. Pro persona hides advisory banner per task spec.
- `rule-packs/ghiseul.ro.json` — 2 routes (homepage `^/ghiseul/public/?$`, payment-flow `^/ghiseul/public/taxe`). 10 + 10 extract rules. All inputs have stable developer-authored ids (best-in-class).
- `rule-packs/rotld.ro.json` — 1 route (homepage `^/(home/?)?$`). 9 extract rules. Bespoke `.rt-*` classes, WHOIS form is the primary action.
- `rule-packs/itmcluj.ro.json` — 1 route (homepage `^/$`). 5 extract rules. The 2005 → 2026 transformation showcase. All four personas visibly different (pensioner strips noise, pro shows full sidebar+phones, journalist surfaces heritage marker).
- `scripts/validate-packs.ts:1-269` — replaced JSON.parse-only stub with a typed inline validator. Mirrors `packages/core/src/types.ts` exactly. Validates RulePack and VerifiedDomainList shapes, RegExp compilability, persona enum values, eTLD+1 form, ISO date format, http(s) source URLs, duplicate domain detection, duplicate extract.id detection, and tolerates `_comment` strings on routes / extract rules / persona overrides. Pretty-prints failures with dotted paths.
- `jobs/v0.1-foundation/qa/<domain>/notes.md` (6 files) — per-pack QA notes documenting fetch method, encoding, backend, anomalies vs SITES_COVERAGE.md, per-extract selector verification table, fragile selectors with rationale, CAPTCHA / cookie posture, and persona summaries.

## Verified domain roster

**73 entries** (≥ 30 required). Categories: 72 `gov`, 1 `public-interest`.

Includes all 15 SPEC Appendix A seeds, every Tier 1 from SITES_COVERAGE sec 3 (anaf, onrc, ghiseul, mfinante, dgep.mai.gov.ro, drpciv, portal.just.ro, monitoruloficial, ancpi, anpc, anre, bnr, cnas, cnpp, anpis, insse, rotld, data.gov.ro), plus Tier 2 ministries / regulators / judiciary / transport / parliament / EU funds (mae, mapn, mmediu, madr, mmuncii, mdlpa, cultura, mcid, economie, consiliulconcurentei, dataprotection, ansvsa, ancom, asfromania, cdep, senat, bec, roaep, iccj, ccr, csm1909, mpublic, diicot, politiaromana, politiadefrontiera, igsu, vama, fonduri-ue, pnrr, transparenta, fara-hartie, identitate, sgg, anof, anofm, rar, cnadnr, arr, cfr, cfrcalatori, inspectiamuncii, itmcluj, itmbucuresti, itmarad, itmiasi, pmb, primariaclujnapoca, primariatm, primaria-iasi, cjcluj, demoanaf).

## Six rule packs — route summary + persona override summary

| Pack                  | Routes | Persona overrides (visible differentiation)                                                                                          |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `anaf.ro`             | 2      | Each route × 4 personas, distinct emphasize/hide sets per route                                                                       |
| `dgep.mai.gov.ro`     | 2      | Pensioner hides carousel & nav, surfaces hero-cta cards. Pro shows everything dense. Journalist news-first.                          |
| `portal.just.ro`      | 2      | Pro HIDES advisory-banner (per task spec). Journalist emphasizes the broken-by-design admission. Pensioner keeps advisory visible.   |
| `ghiseul.ro`          | 2      | Pensioner anonymous-only (hides login). Pro login-first. Journalist hides login, shows counter + service catalogue.                  |
| `rotld.ro`            | 1      | Pensioner strips nav, surfaces WHOIS form + 3 cards. Pro WHOIS + deep-nav. Journalist source-verification first.                     |
| `itmcluj.ro`          | 1      | Pensioner strips ALL legacy chrome. Pro full sidebar + phones. Journalist surfaces heritage marker (the 2005 timestamp IS the story). |

**All four personas produce visibly different results on itmcluj.ro** (the demo headliner — task hard requirement).

## Validator output

```
$ bun run validate-packs
$ bun run scripts/validate-packs.ts
[validate-packs] OK — 7 file(s) checked
```

Sanity-tested by mutation: introduced bad regex pattern, missing extract.id, wrong type enum, mismatched domain → validator catches all four with dotted-path messages and exits 1.

## Fragile selectors flagged for v0.2 attention

- **itmcluj.ro `ul[type="square"]`** — institution profile (phones, address, leadership) lives inside a hidden `<TEXTAREA id="txtSource">` reflected into a synthetic iframe by inline JS. Live `document.querySelector` from content script will NOT see those nodes in v0.1. Renderer must handle empty `multiple:true` extractions gracefully (already part of renderer contract). v0.2: walk same-origin iframes.
- **portal.just.ro `#ctl00_MSO_ContentDiv font[color="red"]`** — depends on advisory still being a `<font>` tag rather than a CSS class. Acceptable: SharePoint 2010, banner unchanged for years.
- **portal.just.ro `table.s4-wpTopTable b`** — `<b>` is fragile in general, but for SharePoint webpart slicers it's the canonical label wrapper.
- **portal.just.ro `div[data-rel] ul li a[href*="acasa_default.aspx"]`** — `data-rel` semantic role bespoke to this site's Raphael map widget.
- **anaf.ro `a.btn.brighten`** — `.btn .brighten` pair is bespoke to the Servicii Online inline `<style>`. Route pattern constrains scope.
- **anaf.ro `.container .content p`** — generic class names, scoped only by the route pattern.
- **dgep.mai.gov.ro `.text-depabd`** — bespoke class. Site stable for years.
- **dgep.mai.gov.ro `section.main .card-body a.bg-warning`** — `.bg-warning` is Bootstrap utility but only used for orange CTAs here.
- **rotld.ro `div.col-md-4.text-center h3`** — relies on 3-card grid using exactly `.col-md-4`.

## Sites where live HTML differed materially from SITES_COVERAGE.md

- **anaf.ro** — SPEC.md Appendix A suggested inner page `/web/guest/persoane-juridice/cui-platitor-tva` returns **WebSEAL Forbidden 403**. ANAF's Liferay-style URLs are NOT publicly exposed; everything routes through WebSphere at `/anaf/internet/ANAF/`. Pack ships the homepage + `/anaf/internet/ANAF/servicii_online/` (which is actually labelled "Inregistrare utilizatori" in the breadcrumb). Public CUI lookup is at `webservicesp.anaf.ro` — a SOAP/REST API, no UI to overlay.
- **ghiseul.ro** — Behind Cloudflare's "managed challenge". Direct curl returns the JS challenge HTML, not the real page. Live verification REQUIRED Playwright. Not an extension blocker (content script runs after challenge clears in user's browser) but flagged for any v0.2 fetch-based pre-flight.
- **dgep.mai.gov.ro** — Appointment booking is OFF-DOMAIN at hub.mai.gov.ro/cei/programari/harta. Pack covers DGEP's own pages + surfaces the hub.mai.gov.ro CTA as a `hero-cta` link. hub.mai.gov.ro itself is a separate rule-pack target (deferred).
- **portal.just.ro** — Self-admitted-broken advisory CONFIRMED verbatim with `<font color="red">` HTML4 styling.

## Acceptance Criteria Check

- [x] `_verified-domains.json` ≥ 30 entries (delivered 71)
- [x] All four required fields per entry (`domain`, `category`, `addedAt`, `source`)
- [x] No commercial vendor sites; only Romanian public-institution domains
- [x] Six rule packs authored (anaf, dgep.mai.gov.ro, portal.just.ro, ghiseul, rotld, itmcluj)
- [x] anaf.ro ships 2 routes (homepage + servicii_online — see "Sites where live HTML differed" above)
- [x] dgep.mai.gov.ro ships 2 routes; pensioner emphasizes appointment CTAs
- [x] portal.just.ro ships 2 routes; pro hides advisory banner
- [x] ghiseul.ro ships 2 routes; anonymous vs account flows distinguished per persona
- [x] rotld.ro homepage minimal pack
- [x] itmcluj.ro homepage; all four personas visibly different
- [x] Every pack has `_comment` documenting selector source at the route level
- [x] Per-pack persona overrides; at least one persona produces a visibly different result
- [x] `bun run validate-packs` exits 0
- [x] Validator extended beyond JSON.parse stub; validates RulePack and VerifiedDomainList shapes
- [x] QA notes per pack in `jobs/v0.1-foundation/qa/<domain>/notes.md`

## Security Check

- [x] No secrets in code or logs
- [x] All rule pack data is declarative JSON — no `eval`, no `Function()`, no remote scripts
- [x] No `host_permissions` changes (manifest left untouched per task spec)
- [x] No new dependencies; validator uses only `node:fs`, `node:url`, `node:path`
- [x] `bun pm ls 2>&1 | grep -ci node-forge` → 0
- [x] No `Co-Authored-By` trailers on any commit

## Invariant Check

(Most invariants are runtime concerns for the content script / renderer, not for static rule-pack JSON. Listed for completeness.)

- [x] Original DOM unchanged — packs are read-only declarative JSON
- [x] No form data read or written — rule pack contains selectors only, no submissions
- [x] No remote code, no `eval`/`Function()`/remote script — declarative JSON
- [x] No new network requests — packs are bundled assets
- [x] Escape hatch unaffected — overlay still controlled by content script

## Cross-Browser Check

N/A for rule-pack JSON. v0.1 is Chrome-only per CLAUDE.md.

## Hand-off notes for Track 2 (rule-pack-loader Zod schema)

When the canonical Zod schema lands in `@onegov/core/src/rule-pack-loader.ts`, `scripts/validate-packs.ts` should be trimmed to a thin wrapper that:

1. Imports `validate` and a new `validateVerifiedDomainList` (to be added) from `@onegov/core`.
2. Walks `rule-packs/` and dispatches to the right validator.
3. Drops the inline `Validator` class and `validateRoute` / `validateExtractRule` / etc.

The shapes the inline validator enforces today are intentionally identical to `types.ts` so the swap is mechanical. The only authoring nicety the inline validator adds is `_comment` tolerance on routes / extract rules / persona overrides — Track 2 should preserve that (or strip the comments at lint time).

## Files changed count

13 files changed (counted by `git diff --stat job/v0.1-foundation/extension..HEAD`):

```
 jobs/v0.1-foundation/qa/anaf.ro/notes.md            | new
 jobs/v0.1-foundation/qa/dgep.mai.gov.ro/notes.md    | new
 jobs/v0.1-foundation/qa/ghiseul.ro/notes.md         | new
 jobs/v0.1-foundation/qa/itmcluj.ro/notes.md         | new
 jobs/v0.1-foundation/qa/portal.just.ro/notes.md     | new
 jobs/v0.1-foundation/qa/rotld.ro/notes.md           | new
 rule-packs/_verified-domains.json                   | 441 ++
 rule-packs/anaf.ro.json                             | new
 rule-packs/dgep.mai.gov.ro.json                     | new
 rule-packs/ghiseul.ro.json                          | new
 rule-packs/itmcluj.ro.json                          | new
 rule-packs/portal.just.ro.json                      | new
 rule-packs/rotld.ro.json                            | new
 scripts/validate-packs.ts                           | rewritten
```

## QA notes path

`jobs/v0.1-foundation/qa/` — six subdirectories, one per pack, each with a `notes.md`.
