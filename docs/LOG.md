# onegov.ro — Engineering log

Append-only chronological log of meaningful changes. One entry per task.

---

## 2026-05-02 — Monorepo scaffold + core types

**Task:** `jobs/v0.1-foundation/01-monorepo-scaffold.md`
**Branch:** `job/v0.1-foundation/scaffold-monorepo`

Stood up the Bun-workspaces monorepo. Three packages exist with their own
`package.json` + `tsconfig.json`:

- `@onegov/core` — DOM-free types and stubbed engine. **`packages/core/src/types.ts` is complete per SPEC.md §5.1**, which is the unblocking event for Tracks 2-5.
- `@onegov/ui` — Preact dependency wired; `render()` stub.
- `@onegov/extension` — MV3 manifest, Vite three-entry build (background ESM service worker / content IIFE / popup ESM), placeholder Preact popup.

Notable decisions:

- **v0.1 = Chrome desktop only.** `browser_specific_settings.gecko` is omitted from the manifest. No `web-ext`, `addons-linter`, or `@types/firefox-webext-browser` in the dep tree (avoids transitively pulling `node-forge`, which trips some antivirus products on its dormant `SocketPool.swf`).
- `host_permissions` / `content_scripts.matches` are pinned to the SITES_COVERAGE.md §8 v0.1 ship list (anaf, dgep, depabd legacy, portal.just, ghiseul, rotld, itmcluj). Adding more requires an orchestrator-approved task per CLAUDE.md.
- The Vite config runs three sequential builds (one per output bundle) because each entry has a different output format. Orchestrated by `scripts/build-extension.ts`.
- `rule-packs/_verified-domains.json` exists with an empty roster so `bun run validate-packs` exits cleanly before Track 5 lands.

Tests added:

- `packages/core/tests/types.test.ts` — type-level + runtime assertion that every public type is constructible.
- `packages/core/tests/no-dom.test.ts` — guarantees the package has no DOM/browser-global side effects on import.

Follow-ups filed for the orchestrator:

1. Custom invariant ESLint rules (full AST checks for `innerHTML` with rule-pack data, etc.).
2. `scripts/gen-icons.ts` to emit the green/gray/red × 16/32/48 PNGs.
3. `scripts/package.ts` to produce the Chrome zip.
4. Firefox v0.2 task: re-enable `browser_specific_settings.gecko`, `web-ext`, `addons-linter`, Playwright Firefox project, `.xpi` packaging.

---

## 2026-05-02 — Orchestrator: merged Track 1 to main

**Verdict:** reviewer PASS, 0 blockers.
**Squash commit:** `bcafd63`
**Source branch:** `job/v0.1-foundation/scaffold-monorepo` (7 worker commits) + reviewer's REVIEW report
**Post-merge gate on `main`:**
- `bun install` → 131 packages, 3.0s
- `bun pm ls | grep -ci node-forge` → 0
- `bun run check` → exit 0
- `bun test` → 14 pass / 0 fail / 30 expects
- `bun run build` → 63ms; `dist/extension/` produced with manifest + background.js + content.js + popup.{html,js,css} + 9 icon PNGs
- `bun run validate-packs` → exit 0

**Cleanup:** deleted task branch, stale `worktree-agent-*` alias branch, removed `.claude/worktrees/agent-a8683547/`.

**Chrome smoke load:** deferred to manual orchestrator/owner step (`chrome://extensions` → Load unpacked → `dist/extension/`). Static manifest validation passed both worker and reviewer review.

**Filed follow-up tasks (next sprint):**
- `02-invariant-lint-rules.md` — custom ESLint plugin for the five invariants
- `03-icon-generation.md` — real branded icons from SVG source
- `04-package-script.md` — `scripts/package.ts` (Chrome zip) + bundle-size assertion
- `05-playwright-e2e-bootstrap.md` — Chromium-only Playwright + DOM-integrity + network-audit specs
- Tracks 2 / 3 / 4 / 5 — now unblocked, can run in parallel per CLAUDE.md isolation rules

---

## 2026-05-02 — Track 2 (core engine) — merged with one fixup

**Squash commit:** `03d02cf` + fixup `54bdee7`
**Source branch:** `job/v0.1-foundation/core-engine` (7 worker commits)
**Reviewer verdict:** PASS, 0 blockers, 1 warning, 4 suggestions

**Delivered:**
- `domain-verifier.ts`, `lookalike.ts`, `rule-pack-loader.ts`, `semantic-extractor.ts`, `persona.ts` — all five core modules implemented
- 110 tests across 7 files, 190 expect() assertions, all passing
- Local `psl-shim.d.ts` (psl's types-condition omission workaround)
- SLD-prefix suffix-attack detector (catches `anaf-portal.ro`, `anafportal.ro`, `onrc-payments.ro` which pure Levenshtein at distance ≤ 2 cannot)

**Process incident:** worker added the SLD-prefix branch (35 lines in `lookalike.ts`) but did NOT commit before reporting DONE. Reviewer ran tests against the dirty worktree and got 110/110 PASS. Squash-merge silently dropped the branch, breaking 4 tests on main. Recovery: copied the missing lines from `.claude/worktrees/agent-a0387e73/packages/core/src/lookalike.ts` to main as fixup commit `54bdee7`. **CLAUDE.md and ONSTART.md updated to require `git status --porcelain` cleanliness check before squash-merge and before reviewer runs tests.** Memory entry filed: `feedback_squash_merge_clean_worktree.md`.

**Notable behaviour for downstream tracks:**
- `psl` collapses every `*.gov.ro` host to eTLD+1 `gov.ro`. The single `gov.ro` roster entry covers ALL `.gov.ro` subdomains (correct, since Romanian gov controls `.gov.ro` registration). Granular `mai.gov.ro` / `data.gov.ro` roster entries are metadata only.
- SLD-prefix branch returns a real Levenshtein distance value (e.g. 7 for `anaf-portal.ro`) which UI consumers must NOT interpret as edit-count.

**Cleanup:** deleted task branch + stale alias branch, removed `.claude/worktrees/agent-a0387e73/`.
