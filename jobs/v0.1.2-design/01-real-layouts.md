# Task: Real layouts — kill the stacked-card-list look

**Job:** v0.1.2-design
**Group:** ux
**Branch:** `job/v0.1.2-design/real-layouts`
**Mode:** Worker (single design-focused task)
**Touches only:** `packages/ui/src/personas/**`, `packages/ui/src/components/**`, `packages/ui/src/theme.css`, `packages/ui/src/theme.ts`

> v0.1 = Chrome desktop ONLY. No Firefox tooling, no `node-forge`.

---

## Why this exists

Owner ran the v0.1.1 build on real anaf.ro and saw something laggy and amateur (screenshot evidence): every extracted link was wrapped in a tall thin-bordered card, image extraction rendered as plain text "[imagine: ...]", and three big unstyled `<h3>`s dumped at the bottom. **It looks like a 2010 web form, not a premium government UX layer.**

Three concrete problems:

1. **Default-card wrapping** — every node type gets wrapped in a generic Card by Track 3's components. Looks like a stacked list of empty boxes.
2. **No layout intelligence** — the persona variants iterate `tree.nodes` and render each one inline regardless of `type`. There's no composition of related nodes (10+ nav links should be ONE grid, not 10 cards).
3. **Image extraction is broken** — `Image` component (or whatever renders `type: 'image'`) outputs `[imagine: [ANAF]]` as text instead of an actual `<img src="...">`.

Plus the page didn't scroll (already fixed in commit `f25b115` — `overflow-y: auto` on host) and the popup `\u00B7` already fixed.

**This task ONLY addresses the rendered overlay layout.** Popup, content-script lifecycle, badges, persona inference — all unchanged.

---

## Mission

Rewrite the persona variants and supporting components so the overlay on `anaf.ro` (the demo headliner) looks like a real product. Two tests:

1. **Visual**: when an owner reloads and visits `anaf.ro`, the overlay is recognisably premium-feeling — not a list of bordered boxes. Reference quality: gov.uk's information design + Stripe's whitespace discipline + Linear's typographic refinement.
2. **Composition**: extracted nodes are composed by type into purposeful regions (hero, nav grid, content list), not iterated inline.

---

## Acceptance criteria

### A. Layout composition (the headline change)

The persona variants must STOP iterating `tree.nodes` linearly. Instead, **group nodes by type/id semantics** and render each group with the right component:

- **Hero region** — picks `brand-logo` (image) + the first `heading` (or domain name as fallback). One row, brand image left, page title + tagline right.
- **Primary nav** — picks the `main-nav` node group (always `multiple: true`, list of links). Renders as a **responsive grid** (2-4 columns depending on viewport width and persona), NOT as stacked cards.
- **Breadcrumb** — `breadcrumb-links` group (if present) — small horizontal trail, subtle, separator dots.
- **Content sections** — remaining `heading` + `paragraph` nodes — proper typographic hierarchy with h1/h2/h3 and prose flow, not card-wrapped.
- **Image rendering** — `type: 'image'` nodes render an actual `<img src="..." alt="...">` element. Source is `data.src` (the URL extracted from the `src` attribute). NEVER the literal text `[imagine: ...]`.
- **Sparse fallback** — when no recognisable groups land, the existing `diagnostic.tsx` still renders.

### B. Per-persona layout variation

Each persona uses the same compositional skeleton but with different proportions:

- **`standard.tsx`**: balanced — hero compact, nav 4-col grid, content max-width 720px, generous spacing. The reference look.
- **`pensioner.tsx`**: single column, hero stacked, nav 2-col grid with bigger touch targets, base font ≥20px, max one prominent CTA per content block.
- **`pro.tsx`**: dense — hero one-line, nav 4-col grid with smaller cells (more affordances visible), content multi-column (CSS columns) for paragraph runs, keyboard hint badges (`⌘K`) on nav items.
- **`journalist.tsx`**: wide — content max-width 1200px, tables prominent (will matter when packs surface tables), copy-as-CSV affordance hooks.

### C. Component restructure (additive — keep existing component public API)

- **`components/Image.tsx`** (NEW or fix existing): proper `<img src alt>` element with rounded corners, max-width, persona-adapted sizing. Falls back to a small placeholder square (NOT the literal text) when src is missing.
- **`components/NavGrid.tsx`** (NEW): takes a list of `{text, href}` from a multi-link extract and renders a CSS grid. Persona-aware columns. Each cell is a clean tile with title + subtle hover.
- **`components/Hero.tsx`** (NEW): takes `{title, subtitle?, image?}`, renders the hero region.
- **`components/Breadcrumb.tsx`** (NEW): horizontal trail, subtle, separator dots.
- **`components/Section.tsx`** (NEW): titled content section with optional eyebrow text.
- **Existing `components/Card.tsx`**: keep for genuine card use cases but **stop using it as the default wrapper for every link/heading/paragraph node**. Cards should be the exception, not the default.
- **Existing `components/Link.tsx`**: stays (it's the security boundary for href sanitisation). Keep `sanitizeHref`. Update its rendering: a real anchor with hover/focus states, not a card-wrapped box.

### D. Header (the blue strip in the screenshot) + brand assets

Currently a chunky blue bar with a small `g` mark + the literal text "onegov" + literal "landing" (the layout name leaking into UI). Replace with the owner-supplied full logos.

**Owner-supplied SVG assets** (added 2026-05-02 in `packages/extension/icons-src/`):

- `onegov.extension.svg` — single rounded-square `OG` mark in PANTONE 280C blue. Use for: extension icons (already wired in `gen-icons.ts`).
- `onegov.logo.blue.svg` — full lockup: rounded-square `OG` mark + "ONE GOV" wordmark in blue. Use for: popup header on white background, overlay header on white background.
- `onegov.logo.white.svg` — same lockup with white wordmark (mark stays blue per the source — the wordmark's the colour-swap target). Use for: any UI region that uses a coloured/dark background where blue text would clash. The popup currently uses a blue strip header — if you keep that, this is the right asset.
- `onegov.logo.black.svg` — black wordmark variant. Use for: dense / pro-persona UI where the brand should be subtler than full blue, or for documentation contexts.

**The new header (overlay):**

- Slim (~48px tall, not the current chunky ~64px)
- **Inline the `onegov.logo.blue.svg`** as an `<img>` (or import the SVG content into Preact and inline it; either is fine — `<img src>` is simplest and Vite handles the URL via `?url`/`?inline`). Width auto, height ~28px. Vertically centered.
- Single subtle dot separator after the logo
- Live domain in muted text: "pe **anaf.ro**" (Romanian "on" + bolded eTLD+1)
- Right side: minimal "exit" affordance (small × button — onClick toggles extensionEnabled to false, equivalent to popup primary toggle)
- **Drop the literal "landing" / layout-name text entirely.** Layout name is internal — don't render it.
- Subtle bottom border (`border-bottom: 1px solid var(--onegov-color-neutral-200)`), not a heavy block
- White background, not blue. The blue lives in the logo itself; the strip stays neutral.

**Popup header (separate from overlay):**

- Currently the popup has its own branded blue strip with a small `g` mark + text "onegov" + tagline. Replace the mark + text with `onegov.logo.white.svg` inlined at ~32px tall (the strip stays blue, white logo on it). Drop the separate text wordmark — the logo already contains it.
- Tagline "UX layer pentru servicii .ro" stays below the logo as muted text.

**Reference both `<img>` techniques fine for SVG:**
```tsx
import logoUrl from '../../icons-src/onegov.logo.blue.svg';
// ...
<img src={logoUrl} alt="onegov" height={28} />
```
Vite resolves SVG imports to URLs by default; this works inside content-script + popup bundles. The SVG is added to the build output automatically. If size matters, you can `?inline` to embed as base64 (smaller request count, larger bundle).

### E. Theme refinement

- Don't introduce new CSS frameworks. Hand-write CSS using the v0.1.1 token expansion (which is excellent and unused by the current persona variants).
- Use `--onegov-shadow-sm` for subtle elevation on hover, never default-shadowed cards (current variant has thin borders everywhere — drop the borders).
- Use `--onegov-radius-md` (8px) for cells, `--onegov-radius-lg` (16px) for hero, `--onegov-radius-full` for pills.
- Add subtle hover states: 100ms transition, background tint via `--onegov-color-neutral-50`.
- Respect `prefers-reduced-motion` (already in tokens).

### F. Performance

Owner explicitly asked for "instant page loads". The renderer should:

- Render synchronously on receipt of `SemanticTree` — no setTimeout, no requestAnimationFrame deferral, no async lazy imports
- Avoid layout-thrashing (don't read offset measurements, don't write inline styles per-node — use the persona class on the host root and let CSS cascade)
- Skeleton-free: the renderer either has a tree (renders) or doesn't (the `diagnostic.tsx` banner). No empty-state-then-content flash.
- No animations on initial mount. Animations only on user-driven changes (persona switch, hover).

### G. Tests

- Each new component has a render test (no crash with valid props, sensible output for empty/missing)
- `Image.tsx` test specifically asserts an `<img>` element renders with the expected `src` (NOT the literal text `[imagine: ...]`)
- `NavGrid.tsx` test asserts the grid container + N cells for N items
- Existing persona tests updated to assert the new compositional output (not just "renders without error")
- Bundle budget unchanged: `popup.js` gz ≤ 60 KB, `content.js` gz ≤ 80 KB

---

## Hard rules

- The five invariants stay LIVE. None of this work touches the content script's mount logic — only the components rendered inside the closed shadow root.
- No new dependencies. No new manifest permissions.
- TypeScript strict, no `any`. MAX 500 lines per file.
- English in code; Romanian in user-facing strings (the live domain name, fallback labels).
- Conventional Commits, no `Co-Authored-By` ever.
- `git status --porcelain` empty before reporting DONE (CLAUDE.md §Branching & Merge Protocol rule 6).
- `bun pm ls 2>&1 | grep -ci node-forge` → 0.

---

## What you will report back

After completion, write `jobs/v0.1.2-design/DONE-01-real-layouts.md` per `CLAUDE.md §Step 4`.

In the summary:
1. Branch + commit hashes
2. `git status --porcelain` (must be empty)
3. Tail of `bun run check`, `bun run test`, `bun run build`
4. content.js + popup.js gz sizes
5. node-forge count (must be 0)
6. **3-4 sentence description of the rendered overlay** for each of the four personas — what does it look like NOW? I'll relay to the owner.
7. Manual smoke if your environment can drive Chromium with the unpacked extension on anaf.ro
8. Deviations + justification
9. Files changed count

Be terse — visuals matter most; words about them less so.

---

## Out of scope

- Changing the rule pack or extraction logic
- Popup redesign (already done in v0.1.1)
- Content script lifecycle changes
- Persona inference (already done in v0.1.1)
- Badge / icon work (already done)
- New rule packs
- Any work in `packages/extension/` or `packages/core/` (touch only `packages/ui/`)
