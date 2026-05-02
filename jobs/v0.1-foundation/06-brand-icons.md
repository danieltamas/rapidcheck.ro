# Task: Brand mark + state-shield icon set (Track 6 / parallel polish)

**Job:** v0.1-foundation
**Group:** brand
**Branch:** `job/v0.1-foundation/brand-icons`
**Mode:** Worker (single-task, design + tooling)
**Touches only:** `packages/extension/icons/**`, `packages/extension/icons-src/**` (new), `scripts/gen-icons.ts` (new), `packages/extension/src/manifest.json` (icons section only)
**Parallel-safe with:** Track 4b (different files within the extension package)

> **v0.1 = Chrome desktop ONLY.** No Firefox-specific icon variants.

---

## Mission

Replace Track 1's placeholder PNGs (just colored squares, 77 bytes each) with a real branded icon set: an **`onegov.ro` brand mark** combined with a **state shield overlay** (green / gray / red). Source as SVG, generate PNGs at 16/32/48/128 sizes via a `scripts/gen-icons.ts` script that any contributor can re-run.

The owner's direction: brand = `onegov` (the project name); state = small shield badge in green / gray / red. Brand mark dominates at large sizes; shield carries the meaning at small sizes.

---

## Design constraints

### Brand mark (`onegov`)

- **Tone:** modern, geometric, government-trustworthy, accessible. Inspired by `identitate.gov.ro` but distinct (we're a third-party UX layer, not the gov itself).
- **Primary color:** PANTONE 280C blue (`#003B73`) — same as the rest of the project's design tokens
- **Forms to consider** (pick one, justify in DONE report):
  1. **Circular monogram** — `1G` or `OG` letterforms inside a circle, white-on-blue
  2. **Wordmark abbreviation** — stylized `1g` or `og` lockup
  3. **Stylized "O"** — the letter O drawn as a soft-cornered ring or shield-adjacent silhouette, becomes the mark by itself at small sizes
  4. **Abstract geometric** — e.g. a stacked-blocks motif suggesting "layered services"
- **Typography (if used):** the project uses Arial / Calibri / Verdana / Tahoma / Trebuchet / Ubuntu fallback per `identitate.gov.ro`. Wordmarks should pick from this stack OR be hand-drawn (preferred for crisper rendering at 16px).
- **Avoid:** Romanian flag colors (blue/yellow/red would clash with the state shield colors). Avoid recognisable government seals (impersonation risk). Avoid emoji-style cuteness (this is a privacy/trust tool).

### State shield overlay

Three variants, each a small shield shape (height ≈ 8px at the 16px icon size, ≈ 14px at 32px, ≈ 20px at 48px), positioned **bottom-right corner** of the brand mark.

| State | Shield fill | Inner glyph | Meaning |
|---|---|---|---|
| **green** | `#0F8A4F` (or similar accessible green) | `✓` (check) | Verified Romanian gov domain |
| **gray** | `#6B7280` (neutral mid-gray) | `·` (small dot) or empty | Off-list, extension dormant |
| **red** | `#C62828` (or similar accessible red) | `!` (exclamation) | Lookalike domain — likely phishing |

WCAG-AA contrast against the brand mark background. Test at 16px in Chrome's actual toolbar — if you can't tell green from gray at 16px, it doesn't ship.

### Sizes required

- **16, 32, 48** — every state. Used in toolbar (`chrome.action.setIcon`) and `chrome.management`.
- **128** — for the eventual Chrome Web Store listing. One file per state OR one neutral "default" mark (your call; document choice).
- **Source SVG** — committed under `packages/extension/icons-src/`. PNGs are generated artifacts.

### Small-size strategy (CRITICAL — get this right)

At 16px, the brand mark + shield together would be muddy. Two options:

**A) Reduced mark + corner shield even at 16px** — ambitious but works if the brand mark is a strong silhouette.

**B) State-coloured monogram at 16px, full mark + corner shield at 32 and 48px.** Cleaner, easier to design. Probably the right call.

Pick one, justify in DONE report. Test by opening your generated PNGs in Chrome's actual toolbar and making the call from real-world legibility, not from the design file.

---

## Acceptance criteria

### SVG sources (in `packages/extension/icons-src/`)

- [ ] `brand-mark.svg` — the `onegov` brand mark, no state colour, transparent background. Square viewBox.
- [ ] `state-green.svg` — green state shield with check
- [ ] `state-gray.svg` — gray state shield with dot or empty
- [ ] `state-red.svg` — red state shield with exclamation
- [ ] Each SVG has `viewBox` + no embedded raster, no external font references (use SVG paths for any letterforms)
- [ ] All paths are flat (no filters, no gradients beyond simple linear if absolutely necessary — reduces PNG generation surprises)
- [ ] Total combined SVG source ≤ 8 KB

### Icon generator (`scripts/gen-icons.ts`)

- [ ] Replaces `scripts/gen-placeholder-icons.ts` (delete the placeholder script)
- [ ] Reads SVG sources, composes brand + state, exports PNGs at 16/32/48/128 for each state
- [ ] Uses a pure-Bun-friendly library — `sharp` (most popular, but pulls native deps; check `bun pm ls 2>&1 | grep -ci node-forge` after install) OR `resvg-js` OR a hand-rolled wasm-based renderer
- [ ] **STRONGLY PREFER `resvg-js`** (`@resvg/resvg-js`) — it's wasm-based, no native deps, lightweight, no `node-forge`. If that doesn't work for any reason, fall back to `sharp` but verify zero `node-forge`.
- [ ] Idempotent: running twice produces byte-identical PNGs (or at least visually identical — PNG metadata may vary)
- [ ] Exits 0 on success, non-zero on any error
- [ ] Run via `bun run gen-icons` (add to root `package.json` scripts)

### Generated PNGs (in `packages/extension/icons/`)

- [ ] `green-{16,32,48}.png` — 9 files total replaced (was Track 1 placeholders)
- [ ] `gray-{16,32,48}.png`
- [ ] `red-{16,32,48}.png`
- [ ] Plus three `*-128.png` for store listings
- [ ] All PNGs are committed (idempotent generation makes this safe and avoids requiring contributors to regenerate)
- [ ] Each PNG file size < 5 KB
- [ ] Visual inspection: distinguishable colors at 16px in Chrome's actual toolbar

### Manifest update

- [ ] `packages/extension/src/manifest.json` already references `icons/{green,gray,red}-{16,32,48}.png` — these paths stay. Add `"icons"` top-level field for the store: `{ "16": "icons/green-16.png", "48": "icons/green-48.png", "128": "icons/green-128.png" }` (using green as the canonical brand reference).

### Documentation

- [ ] `docs/brand.md` — short brand guidelines: which file is canonical, color tokens, when to use which state, "do not use the brand mark to imply official Romanian government endorsement"
- [ ] `packages/extension/icons-src/README.md` — how to regenerate PNGs from SVG (`bun run gen-icons`)

---

## Hard rules

- **No new dependencies that pull `node-forge`.** Run `bun pm ls 2>&1 | grep -ci node-forge` after install — must be `0`. If `sharp` or your chosen lib pulls it, switch.
- **The brand must NOT mimic any official Romanian gov seal.** This is a third-party UX layer. Visual distinctiveness from gov seals is a security feature (helps users distinguish the layer from the page).
- **No emoji or unicode glyphs in the icons themselves** — render letterforms as SVG paths so they don't depend on the user's installed fonts.
- **Pre-merge gate:** `git status --porcelain` returns empty before reporting DONE.
- **Conventional Commits, no `Co-Authored-By`.**
- TypeScript strict on the gen-icons script. MAX 500 lines per file.

---

## What you will report back

After completion, write `jobs/v0.1-foundation/DONE-06-brand-icons.md` per `CLAUDE.md §Step 4`.

In the summary:
1. Branch + commit hashes
2. Output of `bun run gen-icons` (must succeed)
3. `bun pm ls 2>&1 | grep -ci node-forge` (must be 0)
4. List of files generated + sizes
5. Which design approach you picked (A vs B above) and why
6. Total combined PNG size
7. `git status --porcelain` (must be empty)
8. Bonus: a screenshot or `cat`-printed ASCII preview of the 48px versions
9. Deviations + justification
10. Files changed count

---

## Out of scope

- Animated icons (chrome.action only supports static)
- Theming (light/dark — Chrome doesn't honor extension icon theming)
- Localized icon variants
- Promotional artwork (banners, screenshots) — separate task when we approach store submission
- Real brand identity beyond the icon (full logo system, business cards, etc.) — out of scope
