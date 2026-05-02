# onegov.ro — A Universal UX Layer Over Romanian Government Portals

A Manifest V3 WebExtension that transforms Romanian government portals into a unified, persona-adapted UI **without modifying underlying form data, sessions, or submissions**. The extension is the wedge; AI fallback, mobile shells, telemetry, community rule packs and form bridging compound on top of it.

**See `SPEC.md` for the full v0.1 execution plan and `SITES_COVERAGE.md` for the verified site inventory.** This file is the operating manual — those are the product spec.

> **v0.1 scope: Chrome desktop only.** Firefox parity moves to v0.2. The codebase stays cross-browser-compatible (avoid Chrome-only APIs where alternatives exist) but Firefox packaging, `web-ext`, `addons-linter`, and `browser_specific_settings.gecko` are deferred. v0.1 ships a single `dist/extension/` loaded via `chrome://extensions` → Load unpacked.

---

## What this project IS and IS NOT

| | |
| --- | --- |
| **IS** | A browser extension. A read-only, privacy-respecting visual layer over already-rendered gov pages. Open source, MIT-licensed, community-extensible via rule packs. |
| **IS NOT** | A scraper. A proxy. A backend. A replacement portal. Anything that touches user form data in v0.1. Anything that ships remote code. |

The non-negotiable invariants from `SPEC.md §3` define this product. If a change weakens any invariant, it does not ship — no matter how clever it is.

### The five invariants (memorize these)

1. **Original DOM is never mutated.** Renderer mounts a shadow host as a sibling under `<body>`. Shadow root is `mode: 'closed'`. Page CSS cannot reach in; page JS cannot enumerate it.
2. **No form data is touched.** v0.1 renders read-only views. v0.2 will dispatch submissions through the original form element so CSRF tokens, session cookies, and anti-bot fingerprints flow untouched.
3. **No remote code execution.** Rule packs are declarative JSON. No `eval`, no `Function()`, no remote script loading, no `innerHTML` with rule-pack data.
4. **No network requests in v0.1** beyond loading bundled assets. No analytics, no third-party scripts. CSP-tight.
5. **The user can always escape.** One click on "afișează site-ul original" hides the entire overlay. One click in popup disables the extension on the current site.

Any PR that violates an invariant is rejected on sight, regardless of test results.

---

## MANDATORY WORKFLOW

### Step 1: Determine Your Mode

| Mode | Trigger | You DO | You NEVER DO |
| --- | --- | --- | --- |
| **Orchestrator** | "plan", "start job", "create tasks" | Create job specs, spawn workers in worktrees, handle merges + docs, spawn reviewer | Write implementation code |
| **Worker** | "implement", "build", "fix", specific task | Create task branch, implement, write tests, write DONE report | Merge into group branch. Skip the DONE report. Skip tests. Touch the original DOM. |
| **Reviewer** | Spawned by orchestrator after worker completes | Review code, run tests, run cross-browser smoke, file issues in REVIEW report | Write implementation code. Approve with open issues. Approve any change that weakens an invariant. |
| **Single-agent** | Direct instruction without role context | Branch, implement, test, self-review, DONE report, docs, merge | Skip the branch, DONE report, or tests |
| **Rule-pack author** | "write a pack for X site", "extend the verified list" | Inspect the live site, write declarative JSON, validate with `bun run validate-packs`, manually QA in Chrome + Firefox | Touch TypeScript source. Add new permissions to manifest without orchestrator approval. |
| **Diagnoser** | "extension breaks on X site", "icon stuck on red", regression in shadow DOM mounting, persona switch lag | OBSERVE → HYPOTHESIZE → PREDICT → ACT → VERIFY (see ONSTART Diagnosis Workflow) | Change the manifest, host_permissions, or invariants without evidence. Try the opposite of your last fix. Commit a revert without first writing a diagnostic note. |

**State your mode in your first response.** If the task is Diagnoser shape, do NOT branch and start editing — follow the Diagnosis Workflow in `ONSTART.md`.

### Step 2: Branch (if writing code)

```bash
git checkout main && git pull 2>/dev/null
git checkout -b job/<job>/<group> 2>/dev/null || git checkout job/<job>/<group>
git checkout -b job/<job>/<group>-<task>
git branch --show-current  # VERIFY before writing code
```

### Step 3: Implement + Test

**Worker MUST write tests for every task.** No exceptions.

| What changed | Required tests |
| --- | --- |
| Core engine (`packages/core`) | bun:test unit tests against pure functions. ≥10 cases for verifier, ≥20 for lookalike (incl. Cyrillic homographs and TLD swaps). |
| UI components (`packages/ui`) | Render tests with mock `SemanticTree`. Visual snapshot via `test-harness.html`. |
| Extension shell (`packages/extension`) | Background service worker logic tested via headless bun:test. Content-script behavior asserted via Playwright E2E (Chrome + Firefox). |
| Rule packs (`rule-packs/`) | All packs validate against `schema.json`. Manual QA against the live site, screenshots committed to `jobs/<job>/qa/`. |
| Bug fixes | Regression test proving the bug is fixed. |

Tests go in `packages/<pkg>/tests/` next to the code they test, or `packages/<pkg>/src/**/__tests__/`. Use `bun test` (bun:test under the hood). E2E in `e2e/`.

### Step 4: DONE Report

After implementation + tests pass, write `jobs/<job>/DONE-<task>.md`:

```
# Completed: <title>
**Task:** <task>.md | **Status:** done | **Date:** YYYY-MM-DD
## Changes Made
- file:line — what and why
## Tests Written
- file — what it covers
## Acceptance Criteria Check
- [x] criterion — note
## Invariant Check
- [x] Original DOM unchanged (only appended `<div id="onegov-root">` differs)
- [x] No form data read or written
- [x] No remote code, no `eval`/`Function()`/remote script
- [x] No new network requests outside bundled assets
- [x] "Afișează site-ul original" still hides overlay
## Cross-Browser Check
- [x] Chrome (latest stable) — loads, no console errors
- [x] Firefox (latest stable) — loads, no console errors
```

### Step 5: Code Review (MANDATORY)

**The orchestrator MUST spawn a reviewer agent after each worker completes.** The reviewer:

1. **Reads** every changed file in the task branch
2. **Runs** `bun test` and `bun run validate-packs` — all must pass
3. **Loads** the unpacked extension in Chrome and Firefox; smoke-tests against at least one verified domain and one off-list domain
4. **Checks** for: invariant violations, missing tests, host-permission creep, manifest changes, new dependencies, bundle-size growth, accessibility regressions
5. **Writes** `jobs/<job>/REVIEW-<task>.md`:

```
# Review: <title>
**Task:** <task>.md | **Reviewer verdict:** PASS | FAIL | **Date:** YYYY-MM-DD
## Tests
- [x] All unit tests pass (N tests)
- [x] All rule packs validate
- [x] Chrome smoke OK
- [x] Firefox smoke OK
## Invariants
- [x] / [ ] for each of the five invariants
## Code Quality
- [x] or [ ] for each check, with notes
## Issues Found
### 🔴 Blockers (must fix before merge)
- file:line — description
### 🟡 Warnings (should fix)
### 🟢 Suggestions (optional)
```

6. If **FAIL**: orchestrator sends the REVIEW report back to the worker to fix. Worker fixes, updates DONE report, and review repeats.
7. If **PASS**: orchestrator proceeds to merge.

**A task is NOT complete until the reviewer returns PASS.** The fix→review loop repeats until all blockers are resolved.

### Step 6: Update Docs + Merge

1. Update `docs/ARCHITECTURE.md` if you added/changed modules, public API, or message protocols
2. Append entry to `docs/LOG.md`
3. Squash merge task into group branch
4. Delete task branch

### Worktree Policy & Multi-Worker Safety

**Concurrent workers overwriting each other's work is the single biggest risk in this monorepo.** The rules below are not negotiable.

#### Isolation Rules

- **All sub-agents MUST use** `isolation: "worktree"`**.**
- **Worktrees live under** `.claude/worktrees/`**, which is gitignored.** That's where the Claude Code harness creates them; do not relocate. `.worktrees/` is also gitignored as a defensive fallback.
- **Subagent setup pre-installs `web-ext` + transitive deps** (incl. `node-forge` shipping a legacy `SocketPool.swf` that some antivirus products false-positive on). The SWF is dormant Flash; never executed in modern Node. Add `**/node_modules/node-forge/flash/**` to AV exclusions if needed.
- **The orchestrator stays on** `main`**.** It is the ONLY agent that touches `main`.
- **Workers NEVER touch** `main`**, group branches, or any branch they didn't create.** They only work on their task branch.
- **Reviewer runs in a separate worktree** — reads the worker's branch, never modifies it.

#### Branching & Merge Protocol (Orchestrator Only)

```
main
 └── job/v0.1-foundation/extension          (group branch — orchestrator creates)
      ├── job/v0.1-foundation/extension-background   (task branch — worker creates)
      ├── job/v0.1-foundation/extension-content      (task branch — worker creates)
      └── job/v0.1-foundation/extension-popup        (task branch — worker creates)
```

1. **Orchestrator creates group branches** from `main` before spawning workers.
2. **Workers create task branches** from the group branch they're assigned to.
3. **Workers NEVER merge.** They commit to their task branch and report done.
4. **Orchestrator merges task → group** only after reviewer PASS, one task at a time, sequentially.
5. **Orchestrator merges group → main** only after ALL tasks in the group are merged and tested.

#### Concurrent Worker Rules

| Rule | Why |
| --- | --- |
| **Never run two workers that modify the same package.** | Two writers in `packages/core/src/` will conflict silently. Sequence them. |
| **Merge tasks into group one at a time.** | Never batch-merge. Merge task A, verify, then merge task B. |
| **Rebase before merge.** | Before merging task → group, rebase on the latest group: `git checkout task && git rebase group`. |
| **Run tests after every merge.** | After merging task → group: `bun test`. If tests fail, revert the merge and fix. |
| **Lock main during group→main merge.** | When merging a group branch into main, NO other merges may happen. |
| **Never force-push shared branches.** | `--force` on group branches or main destroys other workers' base. Forbidden. |

#### What To Do When a Merge Conflicts

1. **Stop.** Do not auto-resolve.
2. **Identify** which worker's changes conflict.
3. **Rebase** the later task on top of the earlier (already-merged) task.
4. **Re-run tests + cross-browser smoke** after rebase.
5. **Re-review** if the rebase changed logic (not just whitespace).

#### Cleanup

- Delete task branches after group merge: `git branch -d job/<job>/<group>-*`
- Delete group branch after main merge
- `git worktree prune`
- Delete the worktree directory: `rm -rf .claude/worktrees/<id>`

---

## Stack

| Layer | Technology | Location |
| --- | --- | --- |
| **Build** | Vite (multi-entry for MV3) | `packages/extension/vite.config.ts` |
| **Language** | TypeScript (strict) | everywhere |
| **Monorepo** | Bun workspaces | root `package.json` |
| **UI runtime** | Preact (NOT React) | `packages/ui` |
| **Styling** | Plain CSS with custom properties (NO Tailwind, NO CSS-in-JS) | `packages/ui/src/theme.css` |
| **Validation** | Zod | `packages/core` |
| **eTLD+1 parsing** | `psl` | `packages/core/src/domain-verifier.ts` |
| **IDNA / homograph** | `idna-uts46-hx` (or equivalent) | `packages/core/src/lookalike.ts` |
| **Unit tests** | bun:test | per-package `tests/` |
| **E2E tests** | Playwright (Chromium + Firefox) | `e2e/` |
| **Firefox tooling** | `web-ext` | dev only |
| **Lint** | ESLint + `@typescript-eslint` | root config |
| **Format** | Prettier | root config |

### Forbidden additions

- **No React.** Preact's API is identical and the bundle is 10× smaller — critical for content scripts.
- **No Tailwind, no CSS-in-JS runtime, no UI component library** (shadcn/Radix/MUI). Build the 8 atomic components by hand — they need persona variability and shadow-DOM cleanliness.
- **No state management library.** Preact signals or local state is sufficient.
- **No remote rule pack loading in v0.1.** Bundled only. (v0.2 introduces Ed25519-signed remote updates.)
- **No telemetry SDK, no analytics, no error reporters that phone home.** Privacy is the product.

---

## Repository Layout

```
onegov.ro/                      # repo root (project codename: onegov.ro)
├── packages/
│   ├── core/                   # DOM-free pure TypeScript: types, verifier, lookalike, schema, extractor
│   ├── ui/                     # Preact components + persona variants + theme tokens
│   └── extension/              # MV3 shell: background SW, content script, popup, manifest
├── rule-packs/                 # Declarative JSON: schema, verified domains, per-site packs
├── scripts/                    # build, package, gen-icons
├── e2e/                        # Playwright cross-browser tests
├── jobs/                       # job specs, DONE reports, REVIEW reports, QA artifacts
├── docs/                       # ARCHITECTURE.md, LOG.md
├── .claude/worktrees/          # gitignored — Claude Code harness creates subagent worktrees here
├── SPEC.md                     # v0.1 execution plan
├── SITES_COVERAGE.md           # verified Romanian gov site inventory
├── CLAUDE.md                   # this file (agent operating manual)
├── ONSTART.md                  # agent boot procedure
├── CODING.md                   # engineering patterns
├── TESTING.md                  # test guide
├── SECURITY.md                 # threat model + responsible disclosure
├── CONTRIBUTING.md             # open source contributor guide
├── README.md                   # public-facing intro
├── LICENSE                     # MIT
├── .gitignore
├── package.json                # workspaces
└── tsconfig.base.json
```

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│ Extension Shell (MV3) — packages/extension                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Background   │  │ Content      │  │ Popup UI     │      │
│  │ Service      │  │ Script       │  │ (Preact)     │      │
│  │ Worker       │  │ (per tab)    │  │              │      │
│  │              │  │              │  │              │      │
│  │ icon state   │  │ shadow root  │  │ persona pick │      │
│  │ msg routing  │  │ extract→render│ │ show original│      │
│  │ storage      │  │ observe DOM  │  │ status pill  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼──────────────┘
          ▼                 ▼                 ▼
┌────────────────────────────────────────────────────────────┐
│ Core Engine — packages/core (DOM-free, pure TS)            │
│  • domain-verifier.ts    eTLD+1 match → DomainStatus       │
│  • lookalike.ts          Levenshtein, IDNA, nearest        │
│  • rule-pack-loader.ts   load + validate (Zod)             │
│  • semantic-extractor.ts rule + serialized DOM → SemTree   │
│  • persona.ts            persona overrides on routes       │
└────────────────────────────────────────────────────────────┘
          │                                   │
          ▼                                   ▼
┌──────────────────────┐  ┌────────────────────────────────┐
│ UI — packages/ui     │  │ Rule Packs — rule-packs/       │
│ Preact components    │  │ bundled JSON                   │
│ + 4 persona variants │  │ + verified domain roster       │
└──────────────────────┘  └────────────────────────────────┘
```

See `docs/ARCHITECTURE.md` for the live, updated diagram and module API.

---

## Personas

Manual picker in popup, persisted in `browser.storage.local`. Default: `standard`.

| Persona | Audience | Visual signature |
| --- | --- | --- |
| `pensioner` | Older citizens, low digital literacy | ≥18px type, single column, max one action per screen, inline "ce înseamnă?" tooltips |
| `standard` | Default | Clean gov-standard layout, identitate.gov.ro tokens |
| `pro` | Accountants, lawyers, repeat users | Dense, keyboard hints visible, batch actions |
| `journalist` | Investigators | Wide tables, anomaly highlights, copy-as-CSV affordances |

A behavioural classifier ships in v0.2. v0.1 is manual only.

---

## Domain status state machine

The browser action icon reflects per-tab `DomainStatus` from `packages/core/src/domain-verifier.ts`:

| Status | Icon | Meaning | Behaviour |
| --- | --- | --- | --- |
| `verified` | 🟢 green | Hostname's eTLD+1 matches `_verified-domains.json` | Content script may render rule-pack overlay |
| `lookalike` | 🔴 red | Levenshtein ≤ 2 OR Cyrillic homograph OR TLD swap of a verified domain | Content script does NOT render. v0.2: anti-phishing toast. |
| `unknown` | ⚪ gray | Off-list | Content script exits cleanly. No rule pack loads. |

Lookalike detection lives entirely in `packages/core/src/lookalike.ts` and must catch:
- `anaf-portal.ro` (Levenshtein + suffix)
- `аnaf.ro` (Cyrillic а homograph, IDNA-normalised)
- `anaf.com` (TLD swap)

---

## Rule pack contract

Rule packs are declarative JSON validated by Zod against `rule-packs/schema.json`. The `RulePack` and `Route` types live in `packages/core/src/types.ts` — that file is the source of truth.

**Authoring workflow:**
1. Open the target site in Chrome DevTools
2. Identify semantic elements (headings, key paragraphs, forms, action links)
3. Write `extract` rules with stable selectors (prefer `[data-*]` and stable IDs; fall back to structural selectors as a last resort)
4. Define persona overrides (`hide` / `emphasize` / `layout`)
5. `bun run validate-packs`
6. Load the extension and confirm extraction picks up correct content
7. Commit screenshots of before/after (per persona) to `jobs/<job>/qa/`

**v0.1 ship targets** (per `SITES_COVERAGE.md §8`):
1. `anaf.ro` — homepage + CUI lookup
2. `dgep.mai.gov.ro` — homepage + appointment flow (most-complained category on fara-hartie.gov.ro)
3. `portal.just.ro` — case search (institutional showcase + self-admitted broken)
4. `ghiseul.ro` — homepage + payment flow (highest-traffic gov site)
5. `rotld.ro` — homepage (developer-flagged niche showcase)
6. `itmcluj.ro` — homepage (the 2005 → 2026 transformation showcase — strongest visual contrast available)

---

## Quick Start

```bash
# Install (Bun workspaces)
bun install

# Dev mode: rebuild on change
bun run dev

# Type-check + lint everything
bun run check

# Run all unit tests
bun test

# Validate rule packs against schema
bun run validate-packs

# Build production bundles
bun run build

# Package for stores (unsigned in v0.1)
bun run package
# → dist/onegov-chrome.zip
# → dist/onegov-firefox.xpi

# Run E2E (Playwright, Chromium + Firefox)
bun run e2e
```

### Loading the extension

**Chrome:** `chrome://extensions` → enable Developer mode → Load unpacked → select `dist/extension/`.
**Firefox:** `web-ext run --source-dir dist/extension/` from `packages/extension/`, or `about:debugging` → This Firefox → Load Temporary Add-on.

### Required tools

- Bun ≥ 1.2 (Node.js 24 compatibility target)
- - Chrome (latest stable) and Firefox (latest stable)
- `web-ext` (`bun add -g web-ext`) for Firefox dev loop

---

## Critical Rules

- **The five invariants are absolute.** See top of this file. No PR may weaken them.
- **MAX 500 lines per source file. Hard limit.** Split into modules.
- **TypeScript strict mode everywhere.** No `any`. Use `unknown` and narrow.
- **ENGLISH in all code.** Variables, function names, comments, types, log messages, commit messages, error codes — everything. Romanian is allowed only in user-facing UI text (labels, descriptions, popup copy, persona names) since the audience is Romanian citizens.
- **Bundle size budget.** Content script + UI ≤ 80KB minified+gzipped. Total extension package ≤ 2MB. CI fails if exceeded.
- **Performance budget.** Content script render-to-paint < 200ms after `document_idle`. Persona switch < 500ms. Memory < 50MB.
- **No new host_permissions** without orchestrator approval. Each new entry is an attack-surface expansion and a Web Store review-flag.
- **No new dependencies** without orchestrator approval. Audit transitively. Prefer zero-dep utilities over npm packages for trivial work (Levenshtein is 20 lines).
- **No `chrome.*` API access outside** `packages/extension`. Core and UI must remain browser-API-free so they can be unit-tested in Node and reused in v0.2's mobile shells.
- **Closed shadow root only.** `mode: 'closed'`. Never `'open'`. Never expose the shadow handle to page scripts.
- **No `innerHTML` with rule-pack-derived data.** Preact's JSX escaping is the only allowed text path. Lint rule enforced.
- **No `eval`, no `Function()`, no `setTimeout(string)`, no `setInterval(string)`.** Lint rule enforced.
- **No remote fetching in extension code.** Only `chrome.runtime.getURL()` for bundled assets. Lint rule enforced (no `fetch()` to external origins).
- **Original DOM byte-identical before/after.** The DOM-integrity test in `e2e/` snapshots `documentElement.outerHTML` before and after content-script activation; the diff must contain only the appended `<div id="onegov-root">`.
- **No telemetry. No analytics. No error reporters that phone home.** If you need diagnostics, log to `console` behind a dev-mode flag.
- **Accessibility (WCAG 2.2 AA minimum).** This is a UX layer over public services. The whole point is making things accessible.
- **Respect `prefers-reduced-motion`.** All animations gated.
- **Adopt published gov design tokens.** `identitate.gov.ro` colours, fonts, spacing. Don't invent a design language.

### Anti-guessing rules (carry-over from production-ops projects)

- **Revert circuit breaker.** If you're about to commit a change that reverts something from your last 3 commits, STOP. Write a diagnostic note: what you've tried, what you observed, what evidence you'd need to stop guessing.
- **One hypothesis in flight per symptom.** If fix #1 didn't work, don't try fix #2 before collecting evidence why #1 failed.
- **Commit-rate alarm.** More than 5 commits/hour on a single regression = guessing mode. Stop, observe, ask.

---

## UI/UX Design Principles

### Design Language

- Adopt **`identitate.gov.ro`** as ground truth: PANTONE 280C blue, 92px header, 72px logo, max width 1280px, recommended fonts (Arial, Calibri, Verdana, Tahoma, Trebuchet, Ubuntu fallback).
- **The layer enforces what the gov has already published but barely implements.** Never invent a competing visual identity.
- **Per-persona theme tokens** as CSS custom properties scoped inside the shadow root (`--onegov-color-primary`, `--onegov-font-size-base`, etc.).

### What the layer restyles

Page chrome, navigation, headings, paragraphs, lists, tables, search forms, cookie banners (replaced with unified `@onegov/ui` consent module that proxies decisions through to the source page).

### What the layer leaves alone (transparent passthrough)

CAPTCHAs (reCAPTCHA, hCaptcha, Turnstile), OAuth iframes, payment iframes, 3-D-Secure flows, e-signature widgets, file inputs flagged with `accept*=signature`, and any element a rule pack tags with `data-onegov-passthrough="1"`. See `SITES_COVERAGE.md` Appendix B for the canonical selector list.

### Interaction Design

- Skeleton loaders for any async render
- Toasts (success / error / info) for user-initiated actions only
- Smooth transitions via CSS where possible (no Framer Motion in the content script — too heavy)
- Search inside the layer is debounced and live
- Empty states are designed (illustration + clear CTA), never blank
- Touch targets ≥ 44×44px
- Visible focus rings, full keyboard navigation, screen-reader-friendly markup

---

## Git

- Author: `Daniel Tamas <hello@danieltamas.ro>`
- Branching: `main` → `job/<name>/<group>` → `job/<name>/<group>-<task>`
- Commits: Conventional Commits (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`)
- Merge: squash per task into group, regular merge group into main
- **NEVER add `Co-Authored-By` or any co-author trailer to commits.** All commits are authored solely by Daniel Tamas. Non-negotiable.

---

## SOPs — Standard Operating Procedures

### After EVERY completed task

1. `docs/ARCHITECTURE.md` — Update if you added/changed modules, message protocols, public API
2. `docs/LOG.md` — Append an entry
3. `CLAUDE.md` — Update only if the work changes rules or adds new patterns

### When adding a new core module

1. Create `packages/core/src/<module>.ts`
2. Export public API from `packages/core/src/index.ts`
3. Write bun:test tests in `packages/core/tests/<module>.test.ts`
4. **No DOM, no browser APIs.** If you need to operate on a document, take a `SerializableDoc` (see `types.ts`).
5. Update `docs/ARCHITECTURE.md`

### When adding a new UI component

1. Create `packages/ui/src/components/<Name>.tsx`
2. Accept `persona: Persona` prop and respond to it
3. Add render test + add to `test-harness.html`
4. Bundle-size check: `bun run build && du -sh dist/extension/content.js`
5. Update `docs/ARCHITECTURE.md`

### When adding a new rule pack

1. Create `rule-packs/<domain>.json`
2. Inspect the live site and write `extract` rules with stable selectors
3. Define persona overrides (at least one persona must produce a visibly different result)
4. `bun run validate-packs` — must pass
5. Manually QA in Chrome **and** Firefox; commit before/after screenshots to `jobs/<job>/qa/`
6. If the domain isn't already in `_verified-domains.json`, add it with a sourced `source` URL
7. Update `host_permissions` in `packages/extension/src/manifest.json` (orchestrator approval required)
8. Update `SITES_COVERAGE.md` if the site materially changes the catalogue

### When extending the verified domain list

1. Add entries to `rule-packs/_verified-domains.json` with `domain` (eTLD+1), `category` (`gov` | `public-interest`), `addedAt` (ISO date), `source` (URL evidence)
2. Run lookalike test suite to ensure no false positives against existing list
3. Bump `version` in the file
4. Document the addition in `docs/LOG.md`

### When changing manifest permissions

1. **Orchestrator approval required.** No worker may add permissions unilaterally.
2. Justify in the task spec: which capability requires it, why no narrower alternative works
3. Update `manifest.json` for both Chrome and Firefox flavours (handled by build script)
4. Re-run cross-browser smoke
5. Update `SECURITY.md` threat model section

### When releasing v0.x

1. All acceptance criteria in `SPEC.md §8` ticked
2. Verification protocol in `SPEC.md §9` executed and recorded
3. Bump `version` in `packages/extension/src/manifest.json` and root `package.json`
4. `bun run package` produces `dist/onegov-chrome.zip` + `dist/onegov-firefox.xpi`
5. Tag: `git tag v0.1.0 && git push --tags`
6. Update `README.md` install instructions
7. Demo recording per `SITES_COVERAGE.md §9`
