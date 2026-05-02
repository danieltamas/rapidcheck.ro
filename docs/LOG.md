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
