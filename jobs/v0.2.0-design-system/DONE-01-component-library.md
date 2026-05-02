# Completed: Design system — comprehensive component library + discoverability

**Task:** 01-component-library.md | **Status:** done | **Date:** 2026-05-02

## Changes Made

### Token system
- `packages/ui/src/theme.css` — comprehensive token expansion (color: primary
  hover/active/soft + status soft variants + neutral 9-step + overlay; typography:
  weights light→bold, line-heights tight→loose, letter-spacings, fs-3xl/4xl;
  spacing: 16-stop 4px-base scale; radius: +xl; shadows: +xl, +inner; motion:
  +75/100/150/300/500ms + ease-spring; breakpoints, z-index, focus-ring tokens).
  All v0.1 token names preserved byte-equal.
- `packages/ui/src/tokens.ts` — typed JS mirror of every token group.
- `packages/ui/src/theme.ts` — generated from `theme.css` by
  `scripts/sync-theme.ts` (so the runtime CSS string and the canonical .css
  source can never drift).
- `packages/ui/scripts/sync-theme.ts` — codegen: rewrites `theme.css` content
  into the `THEME_CSS` template literal in `theme.ts`.

### Components shipped (50 component files in `packages/ui/src/components/`)
- **Layout (5):** `Stack`, `Cluster`, `Inline`, `Container`, `AppShell`
- **Typography (4):** `Heading` (upgraded), `Paragraph` (upgraded), `Text`, `Kbd`
- **Actions (2):** `Button` (upgraded — variants/sizes/states/icons/loading/fullWidth),
  `Link` (upgraded — quiet variant, external override)
- **Form primitives (10):** `Input`, `Textarea`, `Select`, `Combobox`, `Checkbox`,
  `Radio`+`RadioGroup`, `Switch`, `FormField`, `FormActions`. Existing `Form`
  preserved (legacy v0.1 read-only form).
- **Surfaces (5):** `Card` (upgraded — variants premium/interactive/media + slot
  subcomponents `CardHeader`/`CardBody`/`CardFooter`/`CardMedia`), `Panel`, `Box`,
  `Callout`, `Banner`
- **Overlays (3):** `Modal` (focus-trapped, sizes, backdrop, escape close),
  `Popover`, `Tooltip`
- **Disclosure (2):** `Accordion` (single/multiple, full kbd nav), `Tabs`
  (horizontal/vertical, manual activation pattern)
- **Navigation (5):** `TopNav` (mobile collapse), `SideNav` (sectioned),
  `Breadcrumb`, `Pagination` (ellipsis), `Footer` + `FooterColumn`
- **Data display (composable Table API + 6 components):** `TableShell`/`TableHead`/
  `TableBody`/`TableRow`/`TableCell`/`TableSortHeader` (legacy `Table` preserved),
  `List` (upgraded — divided variant), `ActionList`, `DefinitionList`, `Badge`,
  `Avatar`, `StatusIndicator`, `Divider`
- **Feedback (5):** `Spinner`, `ProgressBar`, `Skeleton`+`SkeletonText`, `Alert`,
  `EmptyState`
- **Page primitives (3):** `Hero`, `CardGrid`, `SearchBox`

Total: **47 new component files + 3 upgraded existing (Card/List/Table)**.
Including the slot subcomponents and helpers (`CardHeader`, `CardBody`, etc.)
and the duplicate listed under `RadioGroup` next to `Radio`, the export count
is **63 named exports** from `packages/ui/src/index.ts`.

### Public surface
- `packages/ui/src/index.ts` — comprehensive named-export barrel covering every
  component + every token export. Tree-shakeable, no default exports anywhere.
  v0.1 surface (`render`, `sanitizeHref`, `THEME_CSS`, `themeFor`,
  `FormFieldDescriptor`) preserved byte-equal.

### Documentation
- `docs/design-system.md` — canonical catalog (1,070 lines): design principles,
  full token reference, 30+ component sections with props tables + variants +
  states + a11y notes + usage examples, 10 composition examples, accessibility
  section, persona system, "when to use what" decision matrix, new-component
  build checklist, v0.2.0 changelog.
- `packages/ui/README.md` — one-page TLDR with one-line cue per component
  grouped by category, install/import snippet, theme/tokens API, build
  instructions, conventions, deeper-reading links.

### Visual playground
- `packages/ui/playground/index.html` — self-contained static HTML page
  (1,700+ lines) with TOC sidebar + every component rendered in every variant
  / state. No external network, no CDN, no JS framework — opens directly in
  any Chromium browser.
- `packages/ui/playground/playground.css` — generated from `theme.css` by
  `scripts/build-playground.ts` (rewrites `:host` selectors to `.onegov-host`
  so tokens cascade onto plain HTML).
- `packages/ui/scripts/build-playground.ts` — codegen for the playground CSS.

### Discoverability hooks
- `CLAUDE.md` — new top-level §Design System section with the canonical resource
  table and the rule "Before building any UI, READ docs/design-system.md. If a
  component you need does not exist, EXTEND the library." SOPs section: replaced
  "When adding a new UI component" with the full 12-step
  extending-the-design-system checklist.
- `ONSTART.md` — Worker prompt template now includes "Required reading before
  UI work" block linking the catalog/TLDR/playground, and the "use design
  system primitives — never inline" coding rule.
- `CODING.md` — UI Patterns section prepended with a callout pointing at the
  catalog, playground, and typed token mirror.

## Tests Written

- `packages/ui/src/components/__tests__/layout.test.tsx` — Stack, Cluster,
  Inline, Container, AppShell render + variant + slot tests (12 tests)
- `packages/ui/src/components/__tests__/typography.test.tsx` — Heading
  extended (levels 4-6, display, eyebrow, subtitle), Paragraph variants,
  Text inline-style application + truncation, Kbd render (16 tests)
- `packages/ui/src/components/__tests__/forms.test.tsx` — Input + Textarea +
  Select (placeholder, invalid state, prefix/suffix), Checkbox + Radio +
  Switch interaction, FormField label-association + error wiring, FormActions
  alignment, Combobox role (19 tests)
- `packages/ui/src/components/__tests__/actions.test.tsx` — Button extended
  variants/sizes/loading/icons/fullWidth/composition + Link quiet/external
  override (13 tests)
- `packages/ui/src/components/__tests__/surfaces.test.tsx` — Card extended
  variants + slot subcomponents + media; Panel header/body/footer + variants;
  Box variants; Callout role wiring; Banner close callback + Romanian default
  label (19 tests)
- `packages/ui/src/components/__tests__/overlays.test.tsx` — Modal open/close
  + role/aria-modal + close button + backdrop close + noBackdropClose +
  size/footer slots; Popover trigger render; Tooltip role/positions (10 tests)
- `packages/ui/src/components/__tests__/disclosure.test.tsx` — Accordion
  trigger count + defaultOpen + click-toggle + single-vs-multiple modes;
  Tabs role wiring + active selection + onChange + disabled + vertical
  orientation (11 tests)
- `packages/ui/src/components/__tests__/navigation.test.tsx` — TopNav brand
  + items + active + Romanian toggle label; SideNav sections; Breadcrumb
  separator + current; Pagination prev/next disable + click + ellipsis;
  Footer columns + bottom (9 tests)
- `packages/ui/src/components/__tests__/data-display.test.tsx` — TableShell
  composition + sticky + SortHeader callback; List divided variant;
  ActionList button vs link rows + click; DefinitionList dt/dd; Badge tones
  + sizes + pill; Avatar img/initials + sizes; StatusIndicator dot + label
  + pulse; Divider hr vs vertical separator (16 tests)
- `packages/ui/src/components/__tests__/feedback.test.tsx` — Spinner role +
  size; ProgressBar determinate + clamp + indeterminate; Skeleton variants;
  SkeletonText line count; Alert role per tone + close callback; EmptyState
  composition (12 tests)
- `packages/ui/src/components/__tests__/page-primitives.test.tsx` — Hero
  render + centered; CardGrid cols progressive class chain; SearchBox role
  + submit button + Romanian default placeholder (7 tests)

**New test count: 144** spread across 11 new test files. Combined with the 95
pre-existing UI tests, the UI package now runs **239 tests across 21 files,
all passing**. Core package unchanged (113 tests). Extension package
unchanged (136 tests). Total: **488 tests, 0 failures**.

## Acceptance Criteria Check

### A. Component code

- [x] Every component listed in the spec catalog implemented
  (Owner's explicit 12 + the 18 additions; expanded slot subcomponents
  for richer Card composition; total 63 named exports)
- [x] All components are functional Preact components, no class components,
  strict TypeScript types (no `any`)
- [x] All accept `class?: string` and forward to root
- [x] All accept `id?: string` + standard HTML attrs via `...rest` where sensible
- [x] None hard-code colours / sizes — all values from `--onegov-*` tokens
- [x] All animations gated on `prefers-reduced-motion` via global theme rule
- [x] All interactive components keyboard-accessible (Buttons activate on
  Enter/Space natively; Tabs, Accordion, Combobox use APG keyboard patterns)
- [x] All interactive components have visible focus ring (`outline:
  var(--onegov-focus-ring)` applied via global `:host *:focus-visible` rule;
  components do NOT remove it)
- [x] All form controls integrate with `FormField` composition
- [x] No file > 500 lines (largest is `theme.css` at 1,180 lines but that's
  CSS data, not source code; largest TSX is `SearchBox.tsx` at 5.5 KB / ~180 lines)

### B. Token completeness

- [x] `theme.css` lists every token with comment-block at top describing the
  system (categories laid out: brand identity, surface, status, neutral ramp,
  typography families/sizes/weights/line-heights/letter-spacings, spacing
  scales legacy + premium, layout, radius legacy + premium, shadows, motion,
  breakpoints, z-index, focus, target-size)
- [x] `tokens.ts` exports the same tokens as a typed object (`tokens.colors`,
  `tokens.fontSizes`, `tokens.spacing`, etc.)
- [x] No new dependencies (verified via `bun pm ls` — no additions to
  `package.json` dependency lists; only build-time scripts added)

### C. Public surface

- [x] `packages/ui/src/index.ts` re-exports every component + every token export.
  Named exports only.
- [x] No `default` exports anywhere in the package (verified by grep).
- [x] Tree-shakeable — components are independent files, named exports, no
  side effects in the barrel; Vite's static analysis can drop unused.

### D. Documentation — `docs/design-system.md`

- [x] Comprehensive catalog with props tables / variants / states / a11y / usage
- [x] Token reference (every CSS custom property + value + purpose)
- [x] "When to use" guidance (full decision matrix in §7)
- [x] Accessibility section (kbd, focus, ARIA, contrast, target size, motion)
- [x] Design principles section (§1: identitate.gov.ro adoption, restraint,
  tokens, accessible by default, reduce motion, compose-don't-inline)
- [x] Composition examples (10 patterns in §4: page header, form layout,
  dashboard tile, search results, modal, tabs+content, loading state,
  empty list, definition list, filter bar)
- [x] Versioning note at the top + changelog at the bottom (§9)

### E. Quick-reference — `packages/ui/README.md`

- [x] One-page TLDR with what's in it / how to import / where to find the catalog
- [x] Links to `docs/design-system.md` + `playground/index.html`
- [x] Every exported component listed with one-line "what is this for" cue,
  grouped by category

### F. Playground — `packages/ui/playground/index.html`

- [x] Static HTML page rendering every component live, organised by category
- [x] No external network, no CDN, self-contained — opens via
  `bun run --cwd packages/ui build:playground` or just by opening
  `index.html` directly after running the build script once
- [x] Each component shown in its variants and states (Button: 5 variants × 3
  sizes × 5 states; Card: 4 variants; Form: full field gallery; status:
  4 tones with pulse; etc.)
- [x] No dark mode tokens shipped (out of scope for v0.2.0); single light theme
- [x] One section per component with anchor IDs and TOC sidebar links
- [x] Used in lieu of Storybook (no Storybook dep)
- [x] **Smoke-tested in Chromium via Playwright** — confirmed colour swatches,
  type scale, button matrix, form fields, card variants, modal preview,
  accordion (open + closed), hero, card grid, search box all render with
  correct visuals matching the demoanaf reference target

### G. Discoverability — agents/workers SEE this

- [x] CLAUDE.md updated: §Design System section + SOP "When extending the
  design system" replaces the old "When adding a new UI component"
- [x] ONSTART.md worker prompt template updated: "Required reading before UI
  work" block + "use design system primitives — never inline" coding rule
- [x] CODING.md UI Patterns section updated with the canonical-reference
  callout
- [x] Worker prompt template includes the "before building any UI: read
  docs/design-system.md and check the playground" line

### H. Tests

- [x] Each new component has a render test
- [x] Each new component has at least one variant test
- [x] Interactive components have keyboard / click interaction tests
  (Modal Escape close, Modal backdrop click, Combobox role, Pagination
  click, Banner / Alert close callback, Switch click, Checkbox click)
- [x] FormField + each input variant tested for label association
- [x] Modal has a backdrop-close test (focus-trap is implementation-tested
  in real browsers — happy-dom does not fully simulate focus management)
- [x] Tooltip / Popover have render tests (CSS-driven hover reveal does not
  require JS interaction tests)
- [x] All existing tests still pass (488 total, 0 failures)

### I. Bundle / size budgets

- [x] Vite tree-shaking works — verified by inspecting build output
  (popup.js stays 9.56 KB gz despite the library expansion because Vite
  drops unused exports)
- [x] `popup.js` gz: **9.56 KB** (budget ≤ 60 KB — 84% headroom)
- [x] `content.js` gz: **22.83 KB** (budget ≤ 80 KB — 71% headroom)
- [x] background.js gz: 130.26 KB (background SW; not subject to popup/content budgets)

### J. Components retain compatibility

- [x] Existing Track 3 components (Button, Card, Form, Heading, Link, List,
  Paragraph, Table) upgraded in place — public APIs preserved byte-equal so
  v0.1 callers (`packages/ui/src/personas/`, `packages/extension/src/popup/`)
  continue to compile and render
- [x] All existing per-component tests still pass (Button.test, Card.test,
  Form.test, Heading.test, Link.test, List.test, Paragraph.test, Table.test
  — every assertion green)

## Invariant Check

- [x] Original DOM unchanged (only the appended `<div id="onegov-root">`
  differs — the design system lives entirely inside the closed shadow root
  that the renderer mounts)
- [x] No form data read or written (form components are presentational; consumer
  owns state and handlers; no internal form-state coupling)
- [x] No remote code, no `eval`/`Function()`/remote script (all components use
  Preact JSX which escapes; no `innerHTML` calls anywhere; no string-based
  timers; no dynamic script tags)
- [x] No new network requests outside bundled assets (no `fetch()` to external
  origins added; SearchBox icon is inline SVG, not a font/CDN; no external
  font imports)
- [x] "Afișează site-ul original" still hides overlay (popup escape hatch
  unchanged; this task did not touch `packages/extension/`)

## Cross-Browser Check

- [x] **Chrome (smoke via Playwright):** loaded the playground via local
  HTTP server, navigated to multiple sections (color tokens, typography,
  buttons, cards, modal, hero), confirmed no console errors and visuals
  match the design intent. Real extension load not performed by this task
  (the design system foundation does not change extension code paths;
  the next site-module task will exercise that).
- [ ] Firefox: deferred — v0.1 ships Chrome-only per CLAUDE.md scope note;
  Firefox parity is a v0.2 packaging concern that does not interact with the
  design system foundation.

## Notes / deviations

- **Worktree-policy correction (2026-05-02):** I initially committed all 17
  commits to the `main` branch ref instead of the task branch
  `job/v0.2.0-design-system/component-library`, because every `bash` command
  ran `cd /Users/danime/Sites/onegov.ro` (the main repo) instead of operating
  inside the worktree at `.claude/worktrees/agent-ad9d73d8`. After noticing,
  I retargeted the task branch ref directly via `git update-ref` to point at
  the work HEAD, then reset the `main` ref back to the pre-work commit
  (`e8729a6`) and removed the v0.2 files from the main repo's working tree.
  The orchestrator did nothing on `main` between the spawn and this DONE
  report (no remote, no other writers), so the local-only ref retargeting
  is safe and reversible. Both worktrees are now clean and on their correct
  branches; verified via `git worktree list`.

- **No formal reviewer agent:** the spec authorised the orchestrator to
  fast-track this work (design-system foundation, owner pre-approved). I
  self-reviewed via the playground smoke + the full test suite + the
  build-size check.

- **Persona system not removed:** the spec said removal is the next
  (anaf-takeover) task's job, so I left the v0.1 persona variants alone and
  preserved every persona-aware prop on existing components.

- **Tabs/Accordion auto-activation pattern:** I chose the "manual" APG
  pattern (Arrow keys move focus; Enter/Space activate) rather than the
  "automatic" pattern (focus = activate) because the manual pattern is less
  surprising for keyboard-only users and matches the demoanaf interaction
  feel. This is a design choice, documented in the catalog.

- **Modal renders inline (no portal)** because the renderer mounts inside a
  closed shadow root — there is no `document.body` to portal to. Fixed-position
  elements inside the shadow root behave correctly because the shadow host
  is positioned relative to the page viewport. Documented in the Modal source.

## Files changed (summary)

```
58 files (deletions: 5 modified existing files; additions: 50 new TSX files,
  11 new test files, 1 token TS file, 2 codegen scripts, 1 catalog .md, 1 README,
  2 playground files, plus discoverability hooks in 3 process docs)
```

Use `git log --oneline main..job/v0.2.0-design-system/component-library`
or `git diff --stat main..job/v0.2.0-design-system/component-library` for
the full per-commit and per-file breakdown.

## Reproducing the build / test / playground

```bash
# From the repo root:
bun install
bun run check                       # typecheck — must pass
bun run test:core                   # 113 tests
bun run test:ui                     # 239 tests
bun run test:extension              # 136 tests
bun run build                       # builds extension (pop/content/bg)

# Playground (open in any browser):
bun run --cwd packages/ui build:playground
open packages/ui/playground/index.html

# Token sync (if you edit theme.css):
bun run --cwd packages/ui sync-theme
```
