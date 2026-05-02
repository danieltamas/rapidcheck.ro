# Task: UI components + persona variants + theme tokens (Track 3)

**Job:** v0.1-foundation
**Group:** ui
**Branch:** `job/v0.1-foundation/ui-components`
**Mode:** Worker (single-task)
**Touches only:** `packages/ui/**`

> **v0.1 = Chrome desktop ONLY.** All work must run in modern Chrome; no Firefox-specific concessions, no `web-ext`, no `node-forge` in deps.

---

## Mission

Build the eight atomic components, the four persona variants, the theme tokens, and the renderer entry point for `@onegov/ui`. The renderer takes a `SemanticTree` (from `@onegov/core`) and a `Persona` and mounts a Preact app inside a `ShadowRoot` you're given. **You never touch `document`, `window`, `chrome.*`, or any global beyond what the shadow host provides.**

The component library must be small, hand-rolled, and persona-aware. No shadcn, no Radix, no MUI, no Tailwind. Plain CSS with `--onegov-*` custom properties scoped inside the shadow root.

---

## Acceptance criteria

### 8 atomic components in `packages/ui/src/components/`

Each is a default-exported Preact functional component, accepts a `persona: Persona` prop, and adapts visually. Files:

- [ ] `Heading.tsx` — `{ text, level?: 1|2|3, persona }` — renders `<h1|h2|h3>`; pensioner = larger; pro = denser
- [ ] `Paragraph.tsx` — `{ text, persona }`
- [ ] `List.tsx` — `{ items: string[], ordered?: boolean, persona }`
- [ ] `Table.tsx` — `{ headers: string[], rows: string[][], persona }` — journalist gets copy-as-CSV affordance
- [ ] `Form.tsx` — `{ id?, action?, fields: FormFieldDescriptor[], persona }` — **READ-ONLY rendering** in v0.1; no form submission, no `onSubmit` handler. Just render labels + inputs in a disabled or visual-only state (per invariant #2). Document this in the file's only-allowed leading comment.
- [ ] `Link.tsx` — `{ text, href, persona }` — **MUST sanitize href**: only `http(s):`, `mailto:`, `tel:` schemes pass through; `javascript:`, `data:` are rendered as plain text
- [ ] `Card.tsx` — `{ title?, children, persona }` — composable container
- [ ] `Button.tsx` — `{ label, onClick, persona, variant?: 'primary' | 'secondary' }` — for popup-triggered actions only (e.g. "show original")

Define `FormFieldDescriptor` and any other supporting types in `packages/ui/src/components/types.ts` (do not duplicate types that exist in `@onegov/core`).

### 4 persona variants in `packages/ui/src/personas/`

Each is a layout component that takes a `SemanticTree` and renders it using the atomic components. Different personas compose them differently.

- [ ] `pensioner.tsx` — single column, ≥18px type, max one prominent action per screen, inline help affordances
- [ ] `standard.tsx` — clean default, identitate.gov.ro tokens
- [ ] `pro.tsx` — dense, multi-column, keyboard hints visible
- [ ] `journalist.tsx` — wide tables, anomaly highlighting hooks, copy-as-CSV affordance on Table

### Theme tokens (`packages/ui/src/theme.css`)

Plain CSS with custom properties. Defines the four persona token sets via `:host([data-persona="<name>"])` selectors. Tokens at minimum:

- [ ] `--onegov-color-primary` (PANTONE 280C blue per identitate.gov.ro)
- [ ] `--onegov-color-bg`
- [ ] `--onegov-color-text`
- [ ] `--onegov-color-muted`
- [ ] `--onegov-color-link`
- [ ] `--onegov-color-link-hover`
- [ ] `--onegov-font-base` (Arial, Calibri, Verdana, Tahoma, Trebuchet, Ubuntu fallback)
- [ ] `--onegov-font-size-base` (default 16px; pensioner 20px; pro 14px)
- [ ] `--onegov-font-size-h1`, `--onegov-font-size-h2`, `--onegov-font-size-h3`
- [ ] `--onegov-spacing` (default 8px; pensioner 16px; pro 4px)
- [ ] `--onegov-radius`
- [ ] `--onegov-shadow`
- [ ] Focus-ring tokens (`--onegov-focus-ring`)

Also define a CSS reset scoped to the shadow root (resets `:host` defaults to a known baseline).

### Renderer (`packages/ui/src/renderer.tsx`)

- [ ] Replaces the Track 1 stub at `packages/ui/src/renderer.ts` (delete the `.ts`, ship `.tsx`)
- [ ] Signature: `render(tree: SemanticTree, persona: Persona, target: ShadowRoot): void`
- [ ] **Idempotent**: re-rendering the same tree to the same shadow root is a no-op (uses Preact's reconciler)
- [ ] **Theme injection idempotent**: if a `<style data-onegov-theme="1">` element already exists, do not append a second one
- [ ] Sets `data-persona` attribute on the host element so theme tokens cascade
- [ ] Picks the persona variant from `personas/` and passes the tree to it

### Public surface

- [ ] `packages/ui/src/index.ts` re-exports `render` and any types other packages need
- [ ] No `default` exports from the barrel
- [ ] No `chrome.*` / `browser.*` / direct `document.*` / `window.*` access
- [ ] `bun run check` passes (strict mode, no `any`)
- [ ] `bun run build` continues to succeed (popup.js bundle should grow modestly)

---

## Required tests (in `packages/ui/src/components/__tests__/` and `packages/ui/tests/`)

Use `bun:test` with `happy-dom` (`bun add -d happy-dom @types/happy-dom`) for shadow-DOM rendering tests. If happy-dom doesn't support `attachShadow({ mode: 'closed' })` cleanly, fall back to JSDOM and document the choice.

Tests at minimum:

### Atomic components (one test file per component)

For each of the 8 components:
- [ ] Renders with valid props (no crash)
- [ ] Tolerates missing optional fields
- [ ] Persona prop changes the rendered class names or attributes (snapshot per persona)
- [ ] **`Link.tsx`** has a dedicated security test: `javascript:alert(1)` href is NOT rendered as a clickable link
- [ ] **`Form.tsx`** has a test asserting NO `onSubmit` handler is attached (read-only invariant)

### Renderer

- [ ] Renders the four persona variants without error given a small fixture tree
- [ ] Re-rendering with same tree is a no-op visually (DOM doesn't churn)
- [ ] Theme injection idempotent: count `<style data-onegov-theme="1">` after 5 renders → 1
- [ ] `data-persona` attribute set on host

### Visual harness (`packages/ui/test-harness.html`)

A standalone HTML page that imports the built bundle and renders the same hand-coded `SemanticTree` in all four personas side-by-side. Must:

- [ ] Open in any Chromium browser without extension context
- [ ] Show the same tree rendered four ways
- [ ] Have zero console errors
- [ ] Be small enough that a reviewer can eyeball persona differences quickly

This is your visual smoke test artifact. Commit a short `docs/ui-harness.md` explaining how to open it (`bun run build && open packages/ui/test-harness.html`).

---

## Hard constraints

- **No `chrome.*` / `browser.*` / direct `document.*` / `window.*` access.** Operate only on the `ShadowRoot` you're given.
- **Closed shadow root only** at the call site (`mode: 'closed'`). Your code doesn't open the shadow root, but assume the caller did and don't escape it.
- **Sanitize all rule-pack-derived data.** Any text from `SemanticNode.data` is rendered as text via JSX. No `dangerouslySetInnerHTML`, ever.
- **`Link.tsx` href validation is a security boundary.** Treat it like input validation in a server.
- **No `innerHTML`** with anything that's not a literal string constant.
- **Bundle size budget**: after this task, `dist/extension/popup.js.gz` ≤ 60KB (we have 80KB total budget; reserve 20KB for the extension shell). If you blow this, optimize before reporting done.
- **No new runtime dependencies** beyond `preact` (already there). Dev deps OK: `happy-dom` (or `jsdom`), `@types/happy-dom`.
- **No `node-forge`** in the dep tree. Verify with `bun pm ls 2>&1 | grep -ci node-forge` before reporting done.
- **No Tailwind, no CSS-in-JS, no UI library.** Hand-write CSS with custom properties.
- **No state management library** (no Redux, no Zustand, no MobX). Local state only.
- **MAX 500 lines per file.**
- **Adopt identitate.gov.ro tokens** as ground truth. Don't invent a competing visual identity.
- **Respect `prefers-reduced-motion`** in any animation you add.
- **English in code; Romanian only in user-facing strings** (component default labels, persona names — none should hardcode UI copy in v0.1; the rule packs supply text).
- **No `Co-Authored-By` trailers ever.**

---

## What you will report back

After completion, write `jobs/v0.1-foundation/DONE-03-ui-components.md` per `CLAUDE.md §Step 4`.

In the summary:
1. Branch + commit hashes
2. Tail of `bun run check`, `bun test`, `bun run build`
3. Bundle size: `du -sh dist/extension/popup.js dist/extension/popup.js.gz` (compute gz on the fly: `gzip -c dist/extension/popup.js | wc -c`)
4. `bun pm ls 2>&1 | grep -ci node-forge` (must be 0)
5. Test count
6. Path to test-harness.html and a screenshot if you can produce one
7. Deviations + justification
8. Follow-up tasks
9. Files changed count

Be terse.

---

## Out of scope

- Wiring the renderer into the content script (Track 4)
- Background service worker logic, popup business logic (Track 4)
- Real rule packs (Track 5)
- E2E tests (later)
- Custom invariant ESLint rules (separate follow-up)
- Real branded icon set (separate follow-up)
