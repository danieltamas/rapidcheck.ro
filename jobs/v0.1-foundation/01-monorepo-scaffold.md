# Task: Monorepo scaffold + core types (Track 1 — Foundation)

**Job:** v0.1-foundation
**Group:** scaffold
**Branch:** `job/v0.1-foundation/scaffold-monorepo`
**Mode:** Worker (single-task)
**Blocks:** Tracks 2, 3, 4, 5 — every other worker depends on `@onegov/core/types`

---

## Mission

Stand up the Bun-workspaces monorepo so subsequent tracks can begin in parallel. The unblocking event is committing a **complete, typed, exported `packages/core/src/types.ts`** matching `SPEC.md §5.1`. Everything else (Vite config, manifest skeleton, empty bundle producing a loadable Chrome extension) is supporting work that proves the build pipeline functions end-to-end.

> **v0.1 = Chrome desktop ONLY.** No Firefox, no `web-ext`, no `addons-linter`, no `browser_specific_settings.gecko`, no `.xpi` packaging in this task or anywhere in v0.1. Cross-browser parity is a v0.2 deliverable.

---

## Acceptance criteria

- [ ] Root `package.json` declares Bun workspaces: `packages/*`
- [ ] `tsconfig.base.json` with strict mode + project references
- [ ] Three workspace packages exist with their own `package.json` + `tsconfig.json`:
  - [ ] `@onegov/core` — pure TS, no DOM, no browser globals; depends only on `psl`, `idna-uts46-hx`, `zod`
  - [ ] `@onegov/ui` — depends on Preact + `@onegov/core`
  - [ ] `@onegov/extension` — depends on `@onegov/core`, `@onegov/ui`; the only package allowed `chrome.*`
- [ ] **`packages/core/src/types.ts` is complete** per `SPEC.md §5.1`: `VerifiedDomain`, `VerifiedDomainList`, `DomainStatus`, `Persona`, `RulePack`, `Route`, `PersonaOverride`, `ExtractRule`, `SerializableDoc`, `SerializableEl`, `SemanticTree`, `SemanticNode`. All exported via `packages/core/src/index.ts` barrel.
- [ ] Each package's `src/index.ts` exists (barrels); other module files may be empty stubs that re-export `// TODO` placeholders only where required to make builds pass
- [ ] `packages/extension/vite.config.ts` configured for three entries (`background`, `content`, `popup`) outputting to root `dist/extension/`
- [ ] `packages/extension/src/manifest.json` matches `SPEC.md §5.3` skeleton **with these v0.1 deviations**: omit `browser_specific_settings.gecko` entirely (Firefox is v0.2). Set `host_permissions` and `content_scripts.matches` from the **v0.1 ship list** in `SITES_COVERAGE.md §8`:
  ```
  *://*.anaf.ro/*
  *://dgep.mai.gov.ro/*
  *://*.depabd.mai.gov.ro/*
  *://portal.just.ro/*
  *://*.ghiseul.ro/*
  *://*.rotld.ro/*
  *://itmcluj.ro/*
  ```
- [ ] Root `package.json` scripts:
  - [ ] `bun run check` — typecheck all packages (no lint yet, that's a follow-up)
  - [ ] `bun run build` — runs Vite build in `packages/extension`
  - [ ] `bun run validate-packs` — runs `scripts/validate-packs.ts` (script may be a no-op stub for now since no packs exist yet, but must exit 0 cleanly)
- [ ] `bun install` succeeds on a clean clone
- [ ] `bun run check` succeeds
- [ ] `bun run build` produces `dist/extension/` containing at minimum `manifest.json`, `background.js`, `content.js`, `popup.html`, `popup.js` — even if the JS files are essentially empty
- [ ] The unpacked `dist/extension/` loads in **Chrome (latest stable)** without error — no console errors in the service worker or extension page. This is the only browser target in v0.1. Firefox / `web-ext` / `browser_specific_settings.gecko` / `.xpi` packaging are explicitly out of scope until v0.2.
- [ ] `.eslintrc.cjs` and `.prettierrc.json` committed at root (basic config; the custom invariant lint rules from `CODING.md §Tooling` can be added in a follow-up task)
- [ ] Empty `scripts/` dir contains `validate-packs.ts` stub
- [ ] Empty `rule-packs/` dir contains `_verified-domains.json` with just `{ "version": "0.0.0", "updatedAt": "<today>", "domains": [] }` (so packs validation has something to load even before Track 5 lands)
- [ ] `docs/ARCHITECTURE.md` initialized with the architecture diagram from `CLAUDE.md §Architecture Overview`
- [ ] `docs/LOG.md` initialized with one entry for this task

---

## Required tests

Per `CLAUDE.md §Step 3`, every task needs tests. For this scaffold:

- [ ] `packages/core/tests/types.test.ts` — type-level test that imports every exported type and constructs a minimal valid value. Confirms the public API exists and the barrel works. Use `bun test`.
- [ ] `packages/core/tests/no-dom.test.ts` — smoke test asserting `@onegov/core` can be imported in a pure-Node context with no `document`/`window`/`chrome` globals available (assertion: `globalThis.document === undefined` after import).
- [ ] Root `bun test` runs the suite and exits 0.

---

## Hard constraints (read CLAUDE.md before starting)

- **Five invariants are not testable yet** (no runtime), but `manifest.json` must already encode invariants 4 + 5: minimal `host_permissions` (only ship-list domains), minimal `permissions` (`storage`, `scripting`, `activeTab`, `webNavigation` only — nothing else).
- **No `chrome.*` outside `packages/extension`.**
- **No new runtime dependencies** beyond: `preact`, `psl`, `idna-uts46-hx`, `zod`. Dev deps allowed: `typescript`, `vite`, `@types/chrome`, `prettier`, `eslint`, `@typescript-eslint/*`. **Explicitly NOT in v0.1: `web-ext`, `addons-linter`, `@types/firefox-webext-browser`, `playwright` Firefox project.** All Firefox-related tooling is deferred to v0.2.
- **MAX 500 lines per file.**
- **TypeScript strict, no `any`.**
- **English in code; Romanian only in user-facing UI text** (none yet — this is scaffold).
- **No `Co-Authored-By` in commits.**

---

## What you will report back

After completion, write `jobs/v0.1-foundation/DONE-01-monorepo-scaffold.md` per `CLAUDE.md §Step 4`.

Include in your final summary to the orchestrator:
1. Branch name and commit hashes
2. Output of `bun run check`, `bun test`, `bun run build` (paste tail)
3. Confirmation extension loaded in Chrome (one screenshot or "loaded clean" line). If you cannot launch Chrome from the worker environment, explicitly state so and defer the load test to the reviewer.
4. Any deviations from this spec (with justification)
5. List of follow-up work that should be its own task (e.g. invariant lint rules, icon generation script)

---

## Out of scope (deferred to later tasks)

- Implementation of `domain-verifier.ts`, `lookalike.ts`, `rule-pack-loader.ts`, `semantic-extractor.ts`, `persona.ts` (Track 2)
- Preact components and persona variants (Track 3)
- Background service worker logic, content script Preact mounting, popup UI (Track 4)
- Actual rule packs and the verified domain roster (Track 5)
- Custom invariant ESLint rules, icon generation, packaging scripts (follow-up tasks)
- E2E test fixtures (Playwright comes after Track 4)
