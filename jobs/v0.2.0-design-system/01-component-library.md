# Task: Design system — comprehensive component library + discoverability

**Job:** v0.2.0-design-system
**Group:** ui
**Branch:** `job/v0.2.0-design-system/component-library`
**Mode:** Worker (single comprehensive task)
**Touches:** `packages/ui/src/**`, `packages/ui/playground/**`, `docs/design-system.md`, `packages/ui/README.md`, `CLAUDE.md`, `ONSTART.md`, `CODING.md`

> v0.1 ship-list scope: this task ships a complete v0.2 design system. Site modules (anaf.ro takeover, etc.) come AFTER this lands and consume from it. Goal: per-site work is "domain mapping + functionality + data" — never "I had to recreate a button".

---

## Why this exists (owner direction, 2026-05-02)

Owner observation: components keep getting hand-rolled inline per task because the existing library is too thin. The right structure is "every UI primitive exists once, all site modules compose from them, all of it discoverable to any future agent without re-discovery".

Direct quote: *"all the components should EXIST to be reused not recreated everytime [...] then it's just a matter of domain mapping, functionality and data [...] these should all be properly documented and exposed to any agent/subagent when working"*.

Owner's explicit list (12 categories) plus "whatever I am missing" — task spec expands to a comprehensive set.

---

## Mission

Ship a **complete, reusable, gov-grade component library** in `@onegov/ui`, fully discoverable so any future worker (human or agent) building a site module knows what's available and never reinvents.

## ⚠️ Design reference: `/Users/danime/Sites/demoanaf.ro/demoanaf.ro/frontend/`

Owner directive (2026-05-02): "look at /Users/danime/Sites/demoanaf.ro/demoanaf.ro and the nice micro animations and feel the elements have". This is the canonical visual reference. Open the project, browse `frontend/src/components/ui/` and `frontend/src/pages/home/HomePage.tsx`, run the dev server if you want to feel it live. **Match the feel, not the tooling.**

Demoanaf uses React + Tailwind 4 + framer-motion + lucide-react. We CANNOT use any of these (project rules: no Tailwind, no React, no new deps). We MATCH the feel with hand-rolled CSS using our `--onegov-*` tokens. Concrete micro-animation patterns to replicate:

| Pattern | Demoanaf | Our equivalent |
|---|---|---|
| Button press | `active:scale-[0.97]` | `:active { transform: scale(0.97) }` |
| Card hover lift | `hover:shadow-md hover:-translate-y-0.5` | `:hover { transform: translateY(-2px); box-shadow: var(--onegov-shadow-md) }` |
| Generic transitions | `transition-all duration-150` | `transition: all 150ms ease-out` |
| Page entry | `motion.div` fade+slide | `@keyframes onegov-page-in` + `animation: …` |
| Hero gradient | `bg-gradient-to-br from-primary-500 via-primary-600` | `linear-gradient(135deg, …)` |
| Card baseline | `rounded-xl border-neutral-200 shadow-sm` | tokens + hand-rolled |
| Loaders | `Loader2` + `animate-spin` | Inline SVG + `@keyframes onegov-spin` |
| Focus ring | `focus-visible:ring-2 ring-offset-2` | `:focus-visible { outline: 2px solid; outline-offset: 2px }` |

**All animations gated on `prefers-reduced-motion: reduce`** — use `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }` as a global guard inside the shadow root, then opt-in per component when motion is essential.

Demoanaf's most polished pages to study:
- `frontend/src/pages/home/HomePage.tsx` — hero + search-as-CTA + service grid (we'll mirror this on anaf.ro)
- `frontend/src/components/ui/Button.tsx` — variants + sizes + loading state
- `frontend/src/components/ui/Card.tsx` — hover lift + active depress
- `frontend/src/components/ui/Skeleton.tsx` — async placeholder pattern
- `frontend/src/index.css` — global transitions and motion-reduce handling

Don't copy code — copy proportions, easings, transition durations, and the ratio of restraint vs. delight. The feel is "considered" not "ornamented".

Three deliverables:
1. **The components themselves** — production code in `packages/ui/src/components/`, fully typed, accessible, hand-rolled CSS using `--onegov-*` tokens (no UI library deps, no Tailwind, no CSS-in-JS).
2. **Documentation** — `docs/design-system.md` is the canonical catalog; `packages/ui/README.md` is the quick reference; both are linked from `CLAUDE.md`/`ONSTART.md` as REQUIRED READING for any UI task.
3. **Playground** — `packages/ui/playground/index.html` is a static HTML page listing every component with live render samples so reviewers (and the owner) can see them all without running the extension.

---

## Component catalog (the build list)

### Owner's explicit 12

1. **Button** — variants: `primary` / `secondary` / `ghost` / `danger` / `link`. Sizes: `sm` / `md` / `lg`. States: default / hover / focus-visible / active / disabled / loading. Optional leading/trailing icon. Full keyboard accessibility.
2. **Modal** — overlay backdrop (subtle blur), centered card, header (title + close), body (slot), footer (action row). Open/close animations (200ms ease, gated on `prefers-reduced-motion`). Focus trap. Escape key closes. Click backdrop closes. Multiple sizes (`sm` / `md` / `lg` / `full`).
3. **List** — variants: `unordered` / `ordered` / `divided` / `action` (clickable rows) / `definition` (dt/dd pairs). Optional leading icon per row.
4. **Accordion** — single or multi-expand. Animated chevron. Header is a button (correct ARIA). Body is animated max-height (or hidden via display, with reduce-motion fallback).
5. **Panel** — section wrapper with optional header, body, footer. Variants: `bordered` / `elevated` / `flat`.
6. **Box** — generic content container with padding/radius/border tokens. Subtypes implemented as separate components: `Callout` (info/warning/error/success), `Banner` (full-width notice).
7. **Heading** — h1 → h6 with consistent type scale. `display` variant for hero titles. Optional `eyebrow` (small uppercase label above) and `subtitle`.
8. **Typography tokens** — font families, sizes, weights, line heights, colors. Already partially in `theme.css` from v0.1.1; this task ensures completeness + documents every token.
9. **AppShell** — layout component with `header` / `nav` / `main` / `aside` / `footer` slots. Sticky header option. Responsive collapse for nav.
10. **Hover states + accessibility** — every interactive component has visible focus ring (2px outline + offset, color from token), correct ARIA, keyboard navigation, color contrast ≥ WCAG AA.
11. **Nav** — `TopNav` (horizontal main nav with mobile hamburger collapse), `SideNav` (vertical with sections), `Breadcrumb` (truncating crumb trail), `Tabs` (horizontal + vertical), `Pagination`.
12. **Footer** — standard layout with three slots (left/center/right), version line, attribution.

### Additions (the "whatever I am missing")

13. **Inputs** — `TextInput` (text/email/url/search/tel/password), `NumberInput`, `Textarea`, `Select`, `Combobox` (typeahead select), `Checkbox`, `Radio` + `RadioGroup`, `Switch` (toggle), `DatePicker` (native first-pass), `FileInput`. All with label, hint, error states, prefix/suffix slots.
14. **Form** — `Form` (wrapper), `FormField` (label + control + hint + error composition), `FormActions` (right-aligned button row).
15. **Card** — variants: `default` / `interactive` (hover lift) / `media` (image header). Already partially exists; expand.
16. **Table** — `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`. Sortable column header variant. Sticky header. Optional row actions slot.
17. **Tooltip** — appears on hover/focus. Position: top/right/bottom/left. Auto-flip near edges. ARIA `role="tooltip"`.
18. **Popover** — like Tooltip but click-triggered, can hold any content (vs tooltips for short text).
19. **Badge / Pill** — small inline label. Variants: `neutral` / `info` / `success` / `warning` / `danger`. Sizes: `sm` / `md`.
20. **Alert** — full-width contextual message. Variants: `info` / `success` / `warning` / `danger`. Optional dismiss button.
21. **Loader** — `Spinner` (subtle, accessible), `ProgressBar` (determinate + indeterminate), `Skeleton` (shape placeholder for async content). All gated on `prefers-reduced-motion`.
22. **Empty state** — illustration slot + title + description + optional action button. Used when a list/table has no data.
23. **Status indicator** — colored dot (green/red/gray/amber) with optional label. Used in our toolbar badge contexts.
24. **Divider** — horizontal rule with optional inset/variant.
25. **Avatar** — circular image or initials. Sizes `sm` / `md` / `lg` / `xl`.
26. **Stack / Cluster / Inline** — layout primitives (vertical stack, horizontal cluster with wrap, inline group). One-line CSS-only utilities.
27. **Container** — max-width centered wrapper, padding-aware, multiple width variants.
28. **Hero** — large title + description + actions composition, used at the top of pages.
29. **Card grid** — responsive grid for cards (1/2/3/4 columns by viewport).
30. **Search box** — prominent search input with optional submit button + suggestion dropdown.

If you find another primitive needed during implementation, ADD IT and document it. Goal: the next worker building a site module shouldn't need to invent ANYTHING below the page-composition level.

### Design tokens (the foundation)

Already partially present from v0.1.1. Make sure complete and documented:

- **Colors**: primary (PANTONE 280C blue), neutral 50→900 ramp, semantic (success/warning/danger/info), inverse, surface variants
- **Typography**: font families (display + body, identitate.gov.ro fonts), font-size scale (xs → 4xl), font-weight scale, line-height scale, letter-spacing scale
- **Spacing**: 4px base, scale 0 → 32 (0/4/8/12/16/20/24/32/40/48/56/64/80/96/128 px)
- **Radius**: sm (4px), md (8px), lg (16px), xl (24px), full (9999px)
- **Shadows**: sm (subtle), md (default), lg (modal), xl (elevated), inner
- **Motion**: durations (75/100/150/200/300/500ms), easings (ease-out / ease-in-out / spring), `prefers-reduced-motion` fallbacks
- **Breakpoints**: sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536
- **Z-index**: scale (base/dropdown/sticky/modal/popover/tooltip/toast/max)
- **Focus ring**: dedicated tokens (color, width, offset)

All exposed as CSS custom properties (`--onegov-*`) AND mirrored in a TS export (`packages/ui/src/tokens.ts`) for typed consumption.

---

## Acceptance criteria

### A. Component code

- [ ] Every component above is implemented in `packages/ui/src/components/<Name>.tsx`
- [ ] All components are functional Preact components, no class components, strict TypeScript types
- [ ] All accept `class?: string` and forward to root element so consumers can extend styling
- [ ] All accept `id?: string` and other standard HTML attributes via spread on the root element where sensible
- [ ] None hard-code colours or sizes — all values come from `--onegov-*` tokens
- [ ] All animations gated on `prefers-reduced-motion`
- [ ] All interactive components are keyboard-accessible
- [ ] All interactive components have visible focus ring matching the focus-ring token
- [ ] All form controls integrate with `FormField` (label/hint/error composition)
- [ ] No file > 500 lines (split if necessary)

### B. Token completeness

- [ ] `packages/ui/src/theme.css` lists EVERY token in the catalog above with a comment block at the top describing the system
- [ ] `packages/ui/src/tokens.ts` exports the same tokens as a typed object (for Preact components that need values at JS level)
- [ ] No new dependencies. Hand-write CSS.

### C. Public surface

- [ ] `packages/ui/src/index.ts` re-exports every component + every token-related export. Named exports only, no default exports.
- [ ] No `default` exports anywhere in the package
- [ ] Tree-shakeable — site modules importing one component don't pay for the whole library

### D. Documentation — `docs/design-system.md`

- [ ] Comprehensive catalog: every component listed with its props table, variants, states, accessibility notes, and usage examples
- [ ] Token reference: every CSS custom property + its purpose + its current value
- [ ] "When to use" guidance for each component (e.g. "use Modal for blocking interactions; use Popover for non-blocking contextual content")
- [ ] Accessibility section: keyboard navigation, ARIA patterns, focus management, contrast targets
- [ ] Design principles section: identitate.gov.ro adoption, spacing rhythm, typographic hierarchy, restraint
- [ ] Composition examples: 5-10 common page patterns (page header, form layout, dashboard tile, search results list, etc.) showing which components compose them
- [ ] Versioning note: "This catalog is generated by hand AND verified against the playground; changes to components must update this doc in the same commit."

### E. Quick-reference — `packages/ui/README.md`

- [ ] One-page TLDR of the package: what's in it, how to import, where to find the full catalog
- [ ] Link to `docs/design-system.md` (canonical catalog) and `packages/ui/playground/index.html` (visual browser)
- [ ] List every exported component with a one-line "what is this for" cue

### F. Playground — `packages/ui/playground/index.html`

- [ ] Static HTML page (or a small Vite-built one) that renders every component live, organized by category
- [ ] No external network. No CDN. Self-contained — opens via `bun run --cwd packages/ui playground:build && open packages/ui/playground/dist/index.html`
- [ ] Each component shown in all its variants and states (e.g. Button: primary/secondary/ghost/danger × sm/md/lg × default/hover/focus/active/disabled/loading)
- [ ] Light / dark theme toggle if dark mode tokens exist; otherwise just light
- [ ] One component per section, headers + anchor links so reviewers can jump to any component
- [ ] Used in lieu of Storybook (no Storybook dependency — it's a 200KB library; we don't need it for static catalog browsing)

### G. Discoverability — agents/workers must SEE this

- [ ] Update `CLAUDE.md` to add a top-level §Design System section with: link to `docs/design-system.md`, link to `packages/ui/README.md`, link to `packages/ui/playground/`, and the rule: "Before building any UI in any task, READ `docs/design-system.md`. If a component you need doesn't exist, EXTEND the library — don't inline."
- [ ] Update `ONSTART.md` worker prompt template to include "Required reading before UI work: `docs/design-system.md`."
- [ ] Update `CODING.md` UI Patterns section to point at the design-system doc as the canonical source.
- [ ] When the orchestrator spawns a worker for any UI-touching task, the prompt must include a line: `"Before building any UI: read docs/design-system.md and check the playground at packages/ui/playground/. Do not reinvent components — extend the library if you need something missing."` Make this part of the worker prompt template in `ONSTART.md`.

### H. Tests

- [ ] Each component has a render test (mount with valid props, no crash)
- [ ] Each component has at least one variant snapshot
- [ ] Interactive components have keyboard-interaction tests (Enter/Space activate, Escape dismisses, Tab order correct)
- [ ] FormField + each input variant has a label-association test (clicking label focuses input)
- [ ] Modal has a focus-trap test
- [ ] Tooltip / Popover have a hover/focus reveal test
- [ ] All existing tests still pass (don't break anything currently green)

### I. Bundle / size budgets

- [ ] No site module ships the entire library — Vite tree-shaking must work; verify with a sample import: `import { Button } from '@onegov/ui'` produces a bundle <2KB gz for that one component
- [ ] The full library (all components + tokens) is what gets included in `popup.js` (which uses many) and ad-hoc per site module
- [ ] `popup.js` gz ≤ 60 KB (current 9.5 KB; expansion budget ample)
- [ ] `content.js` gz ≤ 80 KB (currently 14 KB; site modules will compose, plenty of room)

### J. Components retain compatibility

- [ ] Existing Track 3 components (Button, Card, Form, Heading, Link, List, Paragraph, Table) get UPGRADED in place, not replaced. Their existing public API stays compatible (or breaking changes are documented in the docs/design-system.md changelog section). Existing tests must keep passing.
- [ ] Existing usages in `packages/ui/src/personas/`, `packages/extension/src/popup/`, etc. continue to compile after the upgrade.

---

## Hard rules

- **`git status --porcelain` MUST return empty before reporting DONE.**
- **`bun pm ls 2>&1 | grep -ci node-forge` must return `0`.**
- TypeScript strict, no `any`. MAX 500 lines per file (split components into sub-files where needed; keep public surface clean via `index.ts` barrels).
- No new dependencies. Hand-write CSS using `--onegov-*` tokens.
- All animations gated on `prefers-reduced-motion`.
- All interactive components keyboard-accessible + WCAG-AA contrast minimum.
- English in code; Romanian in user-facing default labels (e.g. Modal close button `aria-label="Închide"`, FileInput placeholder, EmptyState default copy).
- Conventional Commits, no `Co-Authored-By` ever.

---

## What you will report back

After completion, write `jobs/v0.2.0-design-system/DONE-01-component-library.md` per `CLAUDE.md §Step 4`.

In the summary:
1. Branch + commit hashes
2. `git status --porcelain` (must be empty)
3. Tail of `bun run check`, `bun run test`, `bun run build`
4. Bundle sizes — popup.js + content.js gz (post-merge expectation, since this lands before site modules)
5. node-forge count (must be 0)
6. **Component count**: how many components shipped? How many tokens documented?
7. Path to playground HTML (so the orchestrator can open it)
8. Any deviations + justification
9. Files changed count

Be terse. The orchestrator will fast-track this (no formal reviewer agent — design-system foundation, owner pre-approved fast-track for design polish work).

---

## Out of scope

- Site modules (anaf.ro takeover comes after this — separate task)
- Form bridging implementation (comes with site modules)
- Loader component (comes with anaf takeover, though Spinner/ProgressBar/Skeleton primitives ARE in scope here)
- Density preference UI (comes with anaf takeover; design system supports it via token-driven scale, but doesn't ship the chip)
- Persona system removal (comes with anaf takeover task)
- Manifest changes
- Any work in `packages/extension/` or `packages/core/` BEYOND updating callers to keep compiling. The library lives in `packages/ui/`.
