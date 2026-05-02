# icons-src/

Canonical SVG sources for the onegov.ro extension brand mark and state
shields. The PNGs in `../icons/` are generated artifacts — edit the SVGs
here, then regenerate.

| File | Role |
|------|------|
| `brand-mark.svg` | the lowercase-g mark on the brand-blue ground; the constant identifier across every icon size |
| `state-green.svg` | green shield + check — verified Romanian gov domain |
| `state-gray.svg`  | gray shield + dot — off-list, extension dormant |
| `state-red.svg`   | red shield + exclamation — lookalike, likely phishing |

All four files use square viewBoxes (128 for the brand mark, 64 for each
shield), no embedded raster, no external font references. Letterforms are
drawn as paths so rendering is identical on every machine regardless of
installed fonts.

## Regenerate the PNGs

```bash
bun run gen-icons
```

This runs `scripts/gen-icons.ts`, which:

1. Reads the four SVGs from this directory.
2. For each `(state, size)` in `{green, gray, red} × {16, 32, 48, 128}`:
   - **16 px:** swap the brand-mark ground colour with the state colour
     and rasterize. The corner shield would be < 6 px tall here and blob
     into noise; the state colour carries the meaning at toolbar size.
   - **32 / 48 / 128 px:** compose the brand mark with the appropriate
     state shield in the bottom-right quadrant (~40 % of the icon),
     then rasterize.
3. Writes 12 PNGs into `../icons/` (committed; safe to commit because
   `@resvg/resvg-js` produces deterministic output).

The script exits non-zero on any error.

## Hard rules when editing the SVGs

- **No external fonts.** Letterforms must be paths. Rendering must not
  depend on what is installed on the contributor's machine.
- **No filters, no gradients, no embedded raster.** Resvg supports only a
  subset of SVG; flat shapes guarantee crisp PNG output and stable file
  sizes.
- **Combined source ≤ 8 KB.** This keeps the SVGs reviewable as code in
  pull requests.
- **Each generated PNG ≤ 5 KB.** If the brand mark grows, the gen budget
  blows; sanity-check by running `bun run gen-icons` and inspecting
  `ls -la ../icons/`.
- **No Romanian flag colour palette and no government-seal silhouettes.**
  The extension is a third-party UX layer, not an arm of the state.

See `docs/brand.md` for the full brand guidelines (state semantics, colour
tokens, anti-impersonation rules).
