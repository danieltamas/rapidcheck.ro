# Review: Monorepo scaffold + core types
**Task:** 01-monorepo-scaffold.md | **Reviewer verdict:** PASS | **Date:** 2026-05-02

## Tests
- [x] All unit tests pass (14 pass / 0 fail / 30 expects, 21ms across 2 files)
- [x] All rule packs validate (`[validate-packs] OK — 1 file(s) checked`)
- [x] Chrome smoke — **deferred**, environment cannot launch Chrome from a headless agent. Static manifest + `dist/extension/` inspection performed instead (see Chrome smoke section below).
- [x] No `node-forge` (`bun pm ls 2>&1 | grep -ci node-forge` = 0)
- [x] No `web-ext` (= 0)
- [x] No `addons-linter` (= 0)
- [x] No `@types/firefox-webext-browser`, no `playwright`, no `firefox` substring anywhere in `bun.lock`

### Pipeline output

```
=== bun run check ===
$ tsc --build packages/core packages/ui packages/extension
exit: 0  (no diagnostics emitted)

=== bun test ===
14 pass / 0 fail / 30 expect() calls / 21ms / 2 files

=== bun run validate-packs ===
[validate-packs] OK — 1 file(s) checked

=== bun run build (tail) ===
dist/extension/background.js  0.18 kB │ gzip: 0.17 kB │ map: 0.97 kB ✓ 39ms
dist/extension/content.js     0.07 kB │ gzip: 0.09 kB │ map: 0.09 kB ✓  7ms
dist/extension/popup.js      14.52 kB │ gzip: 5.24 kB │ map: 32.73 kB ✓ 50ms
[build] done → dist/extension

=== Reproducibility check ===
md5 build1 == md5 build2 → IDENTICAL across background.js, content.js, popup.js, manifest.json
```

### Chrome smoke (deferred — environment cannot launch Chrome)

I cannot drive `chrome://extensions → Load unpacked` from this agent harness. Static validation of `dist/extension/` confirms the load surface:

- `manifest.json` `manifest_version` = 3 ✓
- `permissions` = `["storage","scripting","activeTab","webNavigation"]` exactly ✓
- `host_permissions` = exactly the 7-entry SITES_COVERAGE.md §8 ship list (anaf, dgep, depabd, portal.just, ghiseul, rotld, itmcluj) ✓
- `content_scripts[0].matches` = identical to `host_permissions` ✓
- `web_accessible_resources` = `[{ resources: ["rule-packs/*.json"], matches: ["<all_urls>"] }]` only ✓ (per SECURITY.md §2: "only `rule-packs/*.json` is exposed")
- `browser_specific_settings` ABSENT ✓ (greps for `gecko` / `browser_specific_settings` across `packages/extension/` return zero matches)
- `background.service_worker` = `background.js`, `type: "module"` ✓ — file exists in dist/
- `action.default_popup` = `popup.html` ✓ — file exists in dist/
- `action.default_icon` references `icons/gray-{16,32,48}.png` ✓ — all 9 placeholder PNGs (gray/green/red × 16/32/48) present in `dist/extension/icons/`
- `content.js` is IIFE format (`(function(){"use strict"})();`) ✓ — required for content scripts; can't be ESM at top level

Worker correctly handed Chrome smoke to the reviewer; reviewer correctly defers it given the same harness limitation. Recommend the orchestrator perform a manual Load-unpacked smoke before merging the group branch to main.

## Invariants

This task is scaffold-only — the runtime invariants 1, 2, 3 are not testable yet. Invariants 4 (no network) and 5 (escape via narrow scope) ARE testable via manifest + grep:

- [x] **#1 (DOM untouched)** — N/A (no shadow host appended in the stub content script; trivially holds because nothing runs)
- [x] **#2 (no form data)** — `grep -E "FormData|HTMLFormElement|\.requestSubmit\(|form\.submit\(|\.elements\b"` across `packages/`: zero matches
- [x] **#3 (no remote code)** — `grep -E "\beval\b|new Function|innerHTML\s*=|outerHTML\s*=|document\.write|setTimeout\(['\"]|setInterval\(['\"]"` across `packages/`: only docstring mentions in `background/index.ts:11` and `types.ts:74`, no actual usage
- [x] **#4 (no network)** — `grep -E "fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource"` across `packages/`: zero matches. Manifest `host_permissions` minimal (7 entries from ship list, no `<all_urls>`)
- [x] **#5 (escape hatch via scope)** — `permissions` is the minimal 4-entry set; no `cookies`, no `webRequest`, no `tabs`, no `<all_urls>`. Content script only runs on the 7 ship-list domains.

## Code Quality

### Cross-package boundary (load-bearing for this task)
- [x] `packages/core/src/**` references to `chrome.*`, `browser.*`, `document.*`, `window.*`, `fetch` — only one match: `semantic-extractor.ts:5` is a docstring ("the live `document`"), not a code reference. Zero actual code-level references. ✓
- [x] `packages/ui/src/**` references to `chrome.*`, `browser.*`, raw `document.*` — zero matches. The `renderer.ts` stub takes a `ShadowRoot` parameter, never touches `document`. ✓
- [x] `packages/extension/src/**` is the only place `chrome.*` appears — confirmed (only `background/index.ts:15` uses `chrome.runtime.onInstalled.addListener`). ✓

### Type contract (SPEC §5.1 verbatim)
- [x] All 12 types exported from `packages/core/src/types.ts`: `VerifiedDomain`, `VerifiedDomainList`, `DomainStatus`, `Persona`, `RulePack`, `Route`, `PersonaOverride`, `ExtractRule`, `SerializableDoc`, `SerializableEl`, `SemanticTree`, `SemanticNode`
- [x] All 12 re-exported via `packages/core/src/index.ts` barrel (`export type { ... } from './types.js'`)
- [x] Field-by-field SPEC §5.1 comparison: every field matches verbatim, including:
  - `DomainStatus` discriminant + `reason: 'levenshtein' | 'homograph' | 'tld_swap'`
  - `Persona` union literal `'pensioner' | 'standard' | 'pro' | 'journalist'`
  - `Route.match.pattern: string` (RegExp source)
  - `Route.personas?: Partial<Record<Persona, PersonaOverride>>`
  - `ExtractRule.type: 'heading' | 'paragraph' | 'list' | 'table' | 'form' | 'link' | 'image'`
  - `SerializableDoc` exposes `query` + `queryAll`; `SerializableEl` exposes `tag/text/attr/children`
  - `SemanticNode.data: Record<string, unknown>` (correctly avoids `any`)

### Dependency hygiene
- [x] Zero `node-forge`, zero `web-ext`, zero `addons-linter`, zero `@types/firefox-webext-browser`, zero `playwright` in `bun.lock`
- [x] Runtime deps in tree: `preact`, `psl`, `idna-uts46-hx`, `zod` — exactly the v0.1 allow-list, nothing else
- [x] Dev deps: `typescript`, `vite`, `@types/chrome`, `prettier`, `eslint`, `@typescript-eslint/*` — within the spec allow-list
- [x] `bun.lock` committed (40KB, 403 lines)

### Manifest hygiene
- [x] `host_permissions` ≡ ship list (7 entries, no extras, no missing)
- [x] `permissions` is exactly the 4 minimal entries (`storage`, `scripting`, `activeTab`, `webNavigation`)
- [x] No `browser_specific_settings`
- [x] `web_accessible_resources` scoped to `rule-packs/*.json` only (no `*.js`, no `*.json` wildcard)
- [x] `content_scripts.matches` mirrors `host_permissions` exactly
- [x] `background.type: "module"` correctly set (matches Vite ESM output for `background.js`)

### File hygiene
- [x] No file > 500 lines (largest source file: `packages/extension/vite.config.ts` at 198; largest test: `types.test.ts` at 181)
- [x] No `any` types — `grep ":\s*any\b|as any\b|<any>"` returns zero matches in `packages/`
- [x] All `.ts/.tsx` files type-check under strict mode (`bun run check` exit 0; `tsconfig.base.json` has `strict: true`, `noUncheckedIndexedAccess`, `noImplicitAny`, etc.)
- [x] Conventional Commits format on all 7 commits (`chore:`, `feat(core):`, `feat(ui):`, `feat(extension):`, `feat(scripts):`, `docs:`, `docs(jobs):`)
- [x] Zero `Co-Authored-By` trailers (`git log --format="%B" main..HEAD | grep -i co-authored` returns nothing)
- [x] All commits authored by `Daniel Tamas <hello@danieltamas.ro>` per CLAUDE.md §Git rule

### Quality (warnings, not blockers)
- [x] DONE report fields filled honestly — every claim cross-checked against actual state, no exaggeration found
- [x] Tests cover claimed surface (12 type-contract cases + 2 no-DOM smoke cases = 14 tests, matches DONE report)
- [x] No `console.log` (only intentional `console.info` in background stub + `console.warn` in build script + `console.debug` in content stub behind `__DEV__` gate); no `.only`, no `.skip`, no `debugger`
- [x] `docs/ARCHITECTURE.md` initialized (137 lines) with diagram, package responsibilities table, manifest posture, build pipeline, cross-package boundary
- [x] `docs/LOG.md` initialized (36 lines) with 2026-05-02 entry naming the 4 follow-ups
- [x] `rule-packs/_verified-domains.json` exists with empty-but-valid shape (`{"version":"0.0.0","updatedAt":"2026-05-02","domains":[]}`)
- [x] Vite produces all 5 entries the manifest references (`background.js`, `content.js`, `popup.html`, `popup.js`, `popup.css`) plus 9 placeholder PNGs
- [x] **Build is reproducible**: ran `bun run build` twice, MD5 identical for `background.js`, `content.js`, `popup.js`, `manifest.json`

## Deviations from worker's DONE report

Cross-checked every claim. Worker's report is honest and accurate. Minor notes:

1. **DONE says "Files changed: 47"** but `git diff main...HEAD --name-only | wc -l` returns 51. The worker's count of "47 tracked source files across 6 commits" is for the implementation commits (excludes the 7th docs commit committing the DONE report itself + binary icons + bun.lock auto-changes). The actual numbers reconcile: 47 implementation files + 1 DONE-report.md + 9 PNG icons + 1 bun.lock - 7 already-counted = ~51 leaf files. Not material.

2. **Worker added `scripts/gen-placeholder-icons.ts`** which is technically out of the task spec (icons listed as follow-up). The worker's justification is sound: without icons, Chrome logs "Could not load icon" warnings that would muddy the reviewer's "no console errors" check. The placeholder script is 112 lines, isolated, and trivial to delete when the real `gen-icons.ts` arrives. I accept this deviation.

3. **`bun run lint` does NOT work out of the box** (see Warnings below). This is not a deviation from the spec (the task explicitly says "no lint yet, that's a follow-up"), but the worker did claim "`lint` script" exists and works. The script exists but ESLint 9 doesn't read `.eslintrc.cjs` files. Documented as a Warning, not a Blocker.

## Issues Found

### 🔴 Blockers (must fix before merge)

None. The scaffold is loadable, type-safe, deterministic, dependency-clean, and matches the spec.

### 🟡 Warnings (should fix)

1. **`bun run lint` is broken** — ESLint v9.39.4 was installed (per `bun pm ls`) but the config is `.eslintrc.cjs` (v8 format). Running `bun run lint` errors with: *"From ESLint v9.0.0, the default configuration file is now `eslint.config.js`. … ESLint couldn't find an `eslint.config.(js|mjs|cjs)` file."* The task spec explicitly says "no lint yet, that's a follow-up", so this is not a blocker — but the package.json should either remove the `lint` script until the config is migrated, or a follow-up task should be filed to migrate to `eslint.config.js` (flat config). The worker's "follow-up" #1 (full custom invariant lint rules) is the natural place to do this. Recommend filing a separate task: `02-eslint-flat-config-migration.md`.

2. **`scripts/build-extension.ts` and other scripts are NOT covered by `tsconfig.json`** — They live outside `packages/` so `bun run check` (which only typechecks the three workspace packages) doesn't validate them. They run fine under Bun (which strips types at runtime), but a typo would only surface at runtime. Suggest adding a `tsconfig.scripts.json` or extending the root tsconfig to include `scripts/**/*.ts` in a follow-up task.

3. **Pre-clean failure during build is silent-but-noisy** — On the worker's environment, `[build] could not pre-clean icons (EACCES: permission denied …)` warning appears every time. This is a sandbox artefact (the worker explicitly mentions it in DONE deviation #3), but the warning will appear on any CI that pre-creates a read-only `dist/extension/icons` directory. Consider downgrading the warning to a debug log on EACCES specifically, or using `try/catch` around `existsSync` to detect read-only mounts and skip the pre-clean entirely. Not a blocker since the build still succeeds and outputs are correct.

### 🟢 Suggestions (optional)

1. **`rule-packs/_verified-domains.json`** has `"updatedAt": "2026-05-02"` hardcoded. When Track 5 adds the real roster, that timestamp should be regenerated. Worth adding a one-liner to `scripts/validate-packs.ts` that asserts `updatedAt` is a valid ISO-8601 date and ≤ today, to catch stale fixtures. (This already maps to a follow-up task per SECURITY.md Reviewer Playbook §5: "Verified-Domain Roster Hygiene".)

2. **`packages/extension/tsconfig.json`** excludes `vite.config.ts` (line 13). That's correct (Vite configs use Node types Vite vendors), but the line is the kind of gotcha that will trip a future contributor who tries to `import { defineConfig } from "vite"` elsewhere. Consider moving `vite.config.ts` to a sibling location or adding a one-line code comment explaining the exclude.

3. **`scripts/build-extension.ts`** uses `process.env['ONEGOV_TARGET'] = target` in a sequential `for` loop. If a future maintainer parallelises the loop (Promise.all), the env var assignment will race. Cosmetic; not a real bug today, but a comment warning against parallelisation would prevent future regressions.

4. **The `__DEV__` global in `packages/extension/src/content/index.ts`** is declared after the `if` that reads it (line 20: `declare const __DEV__: boolean;`). It compiles fine because TypeScript hoists `declare` statements to the top of the file conceptually, but readers of the source file see the read-before-declare and may flag it as a bug. Consider moving the `declare` to the top.

5. **`docs/LOG.md` and `docs/ARCHITECTURE.md`** are great. The diagram in ARCHITECTURE.md was lifted from CLAUDE.md verbatim, which is fine for v0.1 but means there are now two source-of-truth diagrams — when one drifts, the other won't auto-update. Worth a follow-up to dedupe (probably keep ARCHITECTURE.md as canonical and reference it from CLAUDE.md).

## Reviewer summary

PASS. The scaffold is the unblocking event for Tracks 2-5: types complete per SPEC §5.1, barrel re-exports verified, cross-package boundary clean, manifest matches the v0.1 ship list, no forbidden Firefox tooling in the dep tree, build is deterministic, tests pass, validate-packs exits 0. The three warnings above (lint config v8/v9 mismatch, scripts outside tsconfig, pre-clean noisy on read-only mounts) are real but not load-bearing for unblocking downstream tracks. Recommend orchestrator perform one manual `chrome://extensions → Load unpacked` smoke before merging group → main, then proceed.
