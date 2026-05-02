# Task: Premium UX overhaul — popup redesign, auto-persona, full overlay take-over

**Job:** v0.1.1-polish
**Group:** ux
**Branch:** `job/v0.1.1-polish/premium-ux`
**Mode:** Worker (single comprehensive task)
**Touches:** `packages/extension/src/popup/**`, `packages/extension/src/content/**`, `packages/ui/src/personas/**`, `packages/ui/src/theme.css`, `packages/ui/src/theme.ts`, possibly new `packages/ui/src/components/`

> **v0.1 = Chrome desktop ONLY.** No Firefox tooling, no `node-forge`.

---

## Why this task exists (owner feedback, 2026-05-02)

Three concrete problems with the v0.1 release-candidate state:

1. **"Persona switcher should be inferred not set by the user."** v0.1's manual 4-button picker is a bad first impression. Behavioral inference was deferred to v0.2 in `SPEC.md §10` but the owner wants it pulled forward.
2. **"Popup design is very basic, 0 premium feel."** Atomic components were built in Track 3 but the popup just stacks them with default spacing. No design language layered on top. Reads as amateur-extension, not as gov-grade UX.
3. **"I don't see any UI for anaf."** Rule pack matches the route and selectors hit live HTML, but the rendered shadow overlay is invisible on the page — it appends as a regular `<div>` with no positioning, z-index, or visual claim on the viewport. Even if extraction finds nothing, there should be a visible "we're enhancing this site" affordance.

Fix all three together so the headline demo — load extension, visit anaf.ro, see a premium unified UI — actually works.

---

## Mission

Deliver a **premium-feeling, self-adaptive UX** that makes the v0.1 demo land emotionally. After this task: open popup → looks designed and considered. Visit anaf.ro → overlay visibly takes over the viewport with the persona inferred from your behavior, and the original page is still there underneath the toggle.

---

## ⚠️ PROCESS RULES

- `git status --porcelain` MUST return empty before reporting DONE (CLAUDE.md §Branching & Merge Protocol rule 6).
- `bun pm ls 2>&1 | grep -ci node-forge` must return `0` after install.
- Five invariants stay LIVE — your overhaul cannot weaken them. The full-viewport overlay is rendered into the **closed shadow root** (no change there); the original DOM stays untouched (only the appended `<div id="onegov-root">` differs); the toggle still works as the escape hatch.

---

## Required reading

1. `CLAUDE.md` — five invariants, workflow, this task DOES NOT relax any invariant
2. `SPEC.md` §3 (invariants) and §10 (v0.2 roadmap — behavioral classifier was originally there)
3. `SITES_COVERAGE.md` §1 (identitate.gov.ro) and §2 (visual styling spec)
4. `CODING.md` — UI Patterns
5. `packages/ui/src/personas/*.tsx` — current persona variants (you'll rewrite these)
6. `packages/ui/src/theme.css` and `theme.ts` — current tokens (you'll extend, not replace, the token names other code depends on)
7. `packages/extension/src/popup/index.tsx` — current popup (you'll rewrite)
8. `packages/extension/src/content/index.ts` — current content script (you'll extend with full-viewport overlay logic)
9. `docs/brand.md` — Track 6 brand guidelines

---

## Acceptance criteria

### A. Premium popup redesign (`packages/extension/src/popup/`)

The popup currently shows status pill + 2×2 persona buttons + escape toggle + footer. Rewrite with this layout:

```
┌─────────────────────────────────────────┐
│  [g logo]  onegov                       │   ← branded header strip (32px)
│            UX layer pentru servicii .ro │   ← tagline (1 line, smaller)
├─────────────────────────────────────────┤
│                                         │
│   ●━━━━━━━━━━━━○                       │   ← BIG primary toggle, on/off
│   Aplică interfața onegov               │      "Aplică interfața onegov"
│                                         │
├─────────────────────────────────────────┤
│  👤 Vârstnic                            │   ← persona status (auto-inferred)
│  detectat automat — schimbă             │      with small "schimbă" link
├─────────────────────────────────────────┤
│  ✓ anaf.ro                              │   ← current-tab status
│  Site oficial verificat                 │      (or warning if lookalike)
│                                         │
├─────────────────────────────────────────┤
│  Despre · v0.1.1 · GitHub               │   ← footer (subtle)
└─────────────────────────────────────────┘
```

Key elements:

- [ ] **Branded header strip** — actual `g` logo from `packages/extension/icons/green-32.png` (or import the SVG and render inline) + "onegov" wordmark + one-line tagline
- [ ] **Primary toggle** — large, premium-feeling switch (CSS-only, no library). Default ON. State persists in `chrome.storage.local` as `extensionEnabled: boolean`. Replaces the previous "Afișează site-ul original" toggle which was framed backwards.
- [ ] **Auto-inferred persona display** — pill or card showing the current persona with an icon (👴 / 🧑 / 💼 / 📰), the label in Romanian ("Vârstnic" / "Standard" / "Profesionist" / "Jurnalist"), the inference reason in subtle small text ("detectat automat"), and a "schimbă" link that expands an inline override picker (only visible when clicked, not the default surface)
- [ ] **Current-tab status** — green/gray/red dot + the eTLD+1 of the current tab + one-line state description. Updates live as the user switches tabs.
- [ ] **Footer** — Despre / version / GitHub. Subtle, not the focal point.
- [ ] **Width:** ~340px. **Height:** auto, target ~400px. Avoid scrolling.
- [ ] **No persona-picker shown by default.** It only appears when the user clicks "schimbă". Auto-inference is the default UX surface.

### B. Premium typography + design tokens (`packages/ui/src/theme.css` + `theme.ts`)

The current theme is functional but flat. Add a layer of premium tokens (additive — do not break existing `--onegov-*` names other code uses):

- [ ] **Typography:** add `--onegov-font-display` (for headers, e.g. system-ui or Inter via CSS font-stack), keep `--onegov-font-base` for body
- [ ] **Type scale:** add `--onegov-fs-xs` (12px), `--onegov-fs-sm` (14px), `--onegov-fs-md` (16px), `--onegov-fs-lg` (20px), `--onegov-fs-xl` (28px), `--onegov-fs-2xl` (36px)
- [ ] **Spacing scale:** standardize on 4px base — `--onegov-sp-1` (4px) through `--onegov-sp-12` (48px)
- [ ] **Color refinement:** add neutral grays — `--onegov-color-neutral-50` (near-white) through `--onegov-color-neutral-900` (near-black), pick a 9-step ramp
- [ ] **Elevation:** add `--onegov-shadow-sm`, `--onegov-shadow-md`, `--onegov-shadow-lg` (subtle, not Material-design heavy)
- [ ] **Radius scale:** `--onegov-radius-sm` (4px), `--onegov-radius-md` (8px), `--onegov-radius-lg` (16px), `--onegov-radius-full` (9999px for pills)
- [ ] **Motion:** `--onegov-duration-fast` (120ms), `--onegov-duration-base` (200ms); cubic-bezier ease tokens
- [ ] **All animations gated on `prefers-reduced-motion`**

### C. Persona variants — premium rewrite (`packages/ui/src/personas/`)

Each persona currently renders the SemanticTree as a stacked column of atomic components. Rewrite each to feel designed:

- [ ] **`standard.tsx`** — the canonical look. Single-column max 720px wide, generous vertical rhythm, identitate.gov.ro tokens, header with brand mark + page title, content cards with subtle shadow and rounded corners, footer with persona/source attribution
- [ ] **`pensioner.tsx`** — same skeleton, type scaled up (≥20px body, larger headers), single dominant action per screen, inline help affordances ("Ce înseamnă?" buttons next to jargon)
- [ ] **`pro.tsx`** — denser layout, two-column where possible, keyboard hints visible (small kbd badges), batch action affordances at top
- [ ] **`journalist.tsx`** — wide layout (max 1200px), tables-bottom, copy-as-CSV affordance prominent, anomaly-highlight CSS classes hooked up
- [ ] **All personas:** when SemanticTree has fewer than 3 nodes (sparse extraction), render a fallback "Layer onegov activ pe **{domain}**" banner with a "Diagnostic" expandable section showing what was extracted. This addresses the "I don't see any UI" complaint — there's always SOMETHING visible when the extension is active.

### D. Full-viewport overlay take-over (`packages/extension/src/content/index.ts`)

Current behavior: shadow host appended to `<body>` end, no positioning. Rewrite mount logic:

- [ ] **Shadow host gets `position: fixed; inset: 0; z-index: 2147483647; isolation: isolate;`** — claims the entire viewport above the page
- [ ] **Background:** opaque (not transparent) so the page underneath is visually replaced. Use `--onegov-color-bg` from the active persona's theme.
- [ ] **The original page DOM is untouched** (invariant #1 holds) but visually hidden under the overlay. The escape toggle (popup primary switch) sets `host.style.display = 'none'` to reveal the original page.
- [ ] **Scroll handling:** the overlay's content area scrolls independently; page underneath does not scroll while overlay is shown (CSS `overflow: hidden` set on `documentElement` only WHILE the overlay is visible — restore on toggle off; document this clearly as the ONE acceptable mutation alongside the appended host)
- [ ] **Persona switching:** re-render is instant; no flash of unstyled content
- [ ] **Sparse-extraction guard:** if `tree.nodes.length === 0`, still render the "Layer onegov activ" fallback banner so the user sees something happened

### E. Auto-persona inference (new file: `packages/extension/src/background/persona-inference.ts`)

Lightweight rules-based classifier. Lives in background SW (per-session signals), runs after each `webNavigation.onCommitted`:

**Signals to track in `chrome.storage.session`:**
- [ ] Visit count to verified gov sites in last 7 days
- [ ] Average time on page (running mean)
- [ ] Average scroll velocity (last 5 sessions)
- [ ] Tab key usage rate (sent from content script via message: count of `keydown` Tab events / total keydowns)
- [ ] Click precision (sent from content script: did clicks land on the intended element first try? approximate via `event.target` distance from nearest interactive element)
- [ ] Time of day distribution (8am-5pm = work hours, evening = personal)
- [ ] Number of distinct gov sites visited in last 30 days

**Classification rules (start simple, refine):**
- [ ] **`pro`** if: ≥10 distinct gov sites in 30d, OR Tab usage > 30%, OR avg time per page < 30s
- [ ] **`pensioner`** if: avg time per page > 120s AND scroll velocity < 100px/s AND click precision < 70%
- [ ] **`journalist`** if: ≥5 distinct gov sites in 7d AND tab usage > 15% AND time-of-day evenly distributed
- [ ] **`standard`** otherwise (default)

The classification is **transparent**: the popup shows the inferred persona AND a one-line reason ("detectat automat — vizitezi des site-uri publice" / "tipar mare implicit — sesiuni lungi"). User can override with one click.

**State storage:** `chrome.storage.local` for the persona itself; `chrome.storage.session` for the rolling signal window.

**Privacy:** no signals leave the device. Never logged, never POSTed. Document in `docs/brand.md` (or a new `docs/privacy.md`).

### F. Tests

- [ ] Popup renders with each persona (snapshot per persona)
- [ ] Primary toggle writes correct `chrome.storage.local` key
- [ ] Persona override displays only when "schimbă" clicked
- [ ] Content script: when extensionEnabled === false, host has display none; when true, full-viewport
- [ ] Content script: when tree.nodes.length === 0, fallback banner renders
- [ ] Persona-inference: each rule fires correctly given synthetic signal fixtures
- [ ] Persona-inference: signal collection is bounded (rolling window doesn't grow unbounded)

---

## Hard rules

- **Five invariants are ABSOLUTE.** Your full-viewport overlay can use `position: fixed` and `z-index` but cannot mutate any non-`<div id="onegov-root">` node. The one acceptable mutation: toggling `documentElement.style.overflow` between `''` and `'hidden'` while overlay is shown — document this loudly in code comments as a deliberate, narrowly-scoped, restored-on-toggle-off exception.
- Closed shadow root (`mode: 'closed'`) — unchanged.
- No new dependencies. No new manifest permissions. No `node-forge`.
- Bundle budgets unchanged: `content.js` gz ≤ 80 KB, `popup.js` gz ≤ 60 KB. Premium design must NOT pull a UI library — hand-write the popup styling.
- TypeScript strict, no `any`. MAX 500 lines per file.
- English in code; Romanian in user-facing UI strings (popup labels, persona reasons, status text).
- Conventional Commits, no `Co-Authored-By`.
- Pre-merge worktree clean check before reporting DONE.

---

## What you will report back

After completion, write `jobs/v0.1.1-polish/DONE-01-premium-ux-overhaul.md` per `CLAUDE.md §Step 4`.

In the summary:
1. Branch + commit hashes
2. `git status --porcelain` (must be empty)
3. Tail of `bun run check`, `bun run test`, `bun run build`
4. Bundle sizes — content.js + popup.js gz must be under cap
5. node-forge count (must be 0)
6. Five-invariant grep results (especially #1 — list every DOM mutation site and confirm only the appended host + the documented overflow toggle)
7. Manual smoke result if you can drive Chrome (overlay renders on anaf.ro, premium popup looks designed, persona auto-displays with a reason)
8. Deviations + justification
9. Files changed count

Be terse.

---

## Out of scope

- New rule packs (existing 6 stay)
- Form bridging (v0.2)
- AI fallback (v0.2)
- Behavioral classifier ML (this is rules-based; v0.2 can upgrade to Bayesian)
- Animated transitions between personas (subtle CSS fades only)
- A/B testing the popup design (we ship one premium version)
