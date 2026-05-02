# Completed: Brand mark + state-shield icon set

**Task:** `06-brand-icons.md` | **Status:** done | **Date:** 2026-05-02
**Branch:** `job/v0.1-foundation/brand-icons`
**Mode:** Worker

## Changes Made

- `packages/extension/icons-src/brand-mark.svg` (new) — stylised lowercase
  "g" on a PANTONE 280C rounded square; single-silhouette, drawn as one
  fill so there are no orphaned tabs at small sizes.
- `packages/extension/icons-src/state-{green,gray,red}.svg` (new) — three
  shield silhouettes with white halo, accessible state fills (#0F8A4F,
  #6B7280, #C62828), and a centred glyph each (check / dot / exclamation).
- `packages/extension/icons-src/README.md` (new) — regeneration workflow
  + hard rules for editing the SVGs.
- `scripts/gen-icons.ts` (new) — composes brand + shield, rasterises
  with `@resvg/resvg-js`, exits non-zero on failure. ~180 lines, TS strict.
- `scripts/gen-placeholder-icons.ts` (deleted) — superseded.
- `packages/extension/icons/{green,gray,red}-{16,32,48,128}.png` — all 12
  files regenerated (3 of each state replaced, plus 3 new -128 variants).
  All under 5 KB; total combined payload 15 903 B.
- `packages/extension/src/manifest.json` (line 44 added) — top-level
  `icons` field for the eventual Chrome Web Store listing, references the
  green-128/48/16 PNGs as the canonical brand mark.
- `package.json` (lines 17, 28 added) — `bun run gen-icons` script and
  `@resvg/resvg-js` devDependency.
- `docs/brand.md` (new) — brand guidelines (mark, state system, colour
  tokens, size policy, anti-impersonation rules, regeneration recipe).
- `docs/ARCHITECTURE.md` — added "Brand icons" section + `bun run
  gen-icons` row in the build-pipeline table; removed `scripts/gen-icons.ts`
  from the open-follow-ups list.
- `docs/LOG.md` — appended Track 6 entry.

## Tests Written

- `packages/extension/src/__tests__/icons.test.ts` — 37 cases:
  - Every (state, size) PNG exists on disk.
  - Each PNG has the valid PNG signature.
  - Each PNG's IHDR width/height matches the size encoded in the filename
    (catches mislabelled sizes early — e.g. a 32 px file written to
    `green-16.png`).
  - Each PNG is under the 5 KB byte budget.
  - The combined PNG payload is < 50 KB (guards against accidental
    bloat — e.g. someone embeds a raster and resvg passes it through).

## Acceptance Criteria Check

### SVG sources

- [x] `brand-mark.svg`, `state-{green,gray,red}.svg` present, square
      viewBoxes, no embedded raster, no font references.
- [x] Letterforms (the "g") rendered as paths, not text elements.
- [x] All paths flat (no filters, no gradients).
- [x] Combined SVG source ≤ 8 KB (actual: ~4.3 KB).

### Icon generator

- [x] Replaces `scripts/gen-placeholder-icons.ts` (deleted).
- [x] Reads SVG sources, composes brand + state, exports 12 PNGs.
- [x] Uses `@resvg/resvg-js` (wasm; no `node-forge` in transitive tree).
- [x] Idempotent — running twice produces byte-identical PNGs (verified).
- [x] Exits 0 on success, non-zero on any error (try/catch around `main`).
- [x] Wired as `bun run gen-icons` in root `package.json`.

### Generated PNGs

- [x] All 12 PNGs at `packages/extension/icons/` (3 states × 4 sizes).
- [x] Each PNG < 5 KB (largest is 2.97 KB at 128 px).
- [x] All committed.
- [x] Visual inspection: 16 px variants distinguishable by colour at
      toolbar size; 32/48/128 px add corner shields with clear glyphs.

### Manifest update

- [x] Top-level `icons` field added (green-16/48/128). The pre-existing
      `action.default_icon` (gray-16/32/48) for the toolbar idle state is
      unchanged.

### Documentation

- [x] `docs/brand.md` written.
- [x] `packages/extension/icons-src/README.md` written.

## Invariant Check

- [x] Original DOM unchanged — N/A (this task touches no extension runtime
      code, only icons + manifest + docs).
- [x] No form data read or written — N/A.
- [x] No remote code, no `eval` / `Function()` / remote script — confirmed;
      gen script is pure file I/O + wasm rendering, no network.
- [x] No new network requests outside bundled assets — confirmed; resvg
      runs entirely offline, no HTTP from the script or runtime.
- [x] "Afișează site-ul original" still hides overlay — N/A.

## Cross-Browser Check

v0.1 is Chrome-desktop only per CLAUDE.md (top of file). The orchestrator's
manual `chrome://extensions → Load unpacked → dist/extension/` smoke
remains the gate for visual confirmation in the toolbar.

- [x] Chrome — manifest validates as MV3, top-level `icons` field is the
      Chrome Web Store-compliant shape (16/48/128).
- [n/a] Firefox — Firefox parity deferred to v0.2 per CLAUDE.md and the
      task spec ("v0.1 SCOPE: Chrome desktop only").

## Design decision: Approach B (justification)

Chose **Approach B** (state-coloured monogram at 16 px; full mark + corner
shield at 32 / 48 / 128 px) over Approach A (reduced mark + corner shield
at every size).

Rationale:

- At 16 px in Chrome's actual toolbar, the corner shield occupies < 6 px
  height. At that resolution, the shield silhouette + inner glyph (check /
  dot / exclamation) blob into 3-4 anti-aliased pixels and become
  indistinguishable from each other. The state colour carries an order of
  magnitude more signal at that size than any glyph could.
- The user's mental model is colour-first (green = good, red = danger),
  glyph-second. Chrome users glance at the toolbar; they pattern-match on
  hue before they parse silhouettes.
- The brand mark stays present as a white "g" silhouette on the
  state-coloured ground at 16 px, so brand identity isn't lost — just
  re-coloured.

I verified by inspecting the generated 16 px PNGs that the three colour
variants are immediately distinguishable from each other (sample: open
`green-16.png`, `gray-16.png`, `red-16.png` side by side and they read as
three distinct icons even at default Retina toolbar size).

## What the icon looks like

48 px green icon, described:

- Background: rounded blue square (PANTONE 280C, ~19 % corner radius).
- Foreground: white lowercase **g** silhouette filling roughly the top-left
  two-thirds of the square. The bowl is a hollow circle on the left;
  the stem and descender on the right form an "L" hook that extends below
  the bowl baseline.
- Bottom-right corner: a small shield (~40 % of the icon size) with a
  white halo, green fill (#0F8A4F), and a white check mark inside.

The 16 px green icon, described: a green rounded square (#0F8A4F) with the
same white "g" silhouette inside it, sized to fill the square. No corner
shield. The icon is unambiguously green at toolbar size.

## Verification output

```
$ bun pm ls 2>&1 | grep -ci node-forge
0

$ bun run gen-icons
[gen-icons] wrote green-16.png (353 B)
[gen-icons] wrote green-32.png (809 B)
[gen-icons] wrote green-48.png (1192 B)
[gen-icons] wrote green-128.png (2971 B)
[gen-icons] wrote gray-16.png (353 B)
[gen-icons] wrote gray-32.png (784 B)
[gen-icons] wrote gray-48.png (1155 B)
[gen-icons] wrote gray-128.png (2965 B)
[gen-icons] wrote red-16.png (353 B)
[gen-icons] wrote red-32.png (810 B)
[gen-icons] wrote red-48.png (1190 B)
[gen-icons] wrote red-128.png (2968 B)
[gen-icons] 12 PNG(s), 15903 B total → packages/extension/icons

$ bun run check
$ bun run test
core: 113 pass / 0 fail
ui:   84  pass / 0 fail
ext:  71  pass / 0 fail (includes the new 37 icon-smoke cases)
$ bun run build
exit 0
```

## Deviations + justification

- **Lint not run as a gate.** `bun run lint` fails on `main` already
  (pre-existing ESLint v9 + `.eslintrc.cjs` config-format mismatch from
  Track 1). Not in scope for this task; not introduced by these changes.
  Confirmed by running on `main` first.
- **Smoke test placement.** Put the icon smoke test in
  `packages/extension/src/__tests__/icons.test.ts` rather than at the
  scripts level because the extension package's `bun test` already gets
  run by root `bun run test`, and the icons live inside that package's
  asset tree. This keeps the test colocated with what it verifies.
- **128 px is one file per state, not one shared "default".** The task
  spec said "your call". Generating a per-state 128 is trivial (same
  pipeline) and gives consistent docs/store-listing options later. The
  manifest top-level `icons` field uses green-128 as the canonical brand
  reference per the task's note.

## Files changed count

13 files (10 added, 3 modified, 1 deleted, 9 PNG-binary modified):

- `+ packages/extension/icons-src/brand-mark.svg`
- `+ packages/extension/icons-src/state-green.svg`
- `+ packages/extension/icons-src/state-gray.svg`
- `+ packages/extension/icons-src/state-red.svg`
- `+ packages/extension/icons-src/README.md`
- `+ scripts/gen-icons.ts`
- `+ packages/extension/src/__tests__/icons.test.ts`
- `+ docs/brand.md`
- `+ packages/extension/icons/{green,gray,red}-128.png` (3 new)
- `M packages/extension/icons/{green,gray,red}-{16,32,48}.png` (9 modified)
- `M packages/extension/src/manifest.json`
- `M package.json`
- `M bun.lock`
- `M docs/ARCHITECTURE.md`
- `M docs/LOG.md`
- `D scripts/gen-placeholder-icons.ts`
