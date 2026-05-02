# onegov.ro — brand

Short, deliberate guidance for the v0.1 brand mark and state shields. The
goal is recognition without impersonation: users should learn the mark in
two glances, and never confuse the extension with an official Romanian
government seal.

## Mark

The mark is a stylised lowercase **g** in a soft-cornered square, drawn from
scratch as SVG paths. It stands for the project name **onegov** — one + g(ov).
The single-glyph silhouette stays legible down to 16 px.

| Asset | Path |
|------|------|
| Canonical SVG source | `packages/extension/icons-src/brand-mark.svg` |
| Canonical Web Store icon | `packages/extension/icons/green-128.png` |

## State system

The browser-action icon reflects per-tab `DomainStatus` from
`packages/core/src/domain-verifier.ts`. Three states, each one of the
generated PNGs.

| State | Meaning | When | Colour token |
|------|---------|------|--------------|
| `green` | Verified Romanian gov domain | hostname's eTLD+1 matches `_verified-domains.json` | `#0F8A4F` |
| `gray`  | Off-list, extension dormant   | unknown hostname; no overlay rendered | `#6B7280` |
| `red`   | Lookalike — likely phishing   | Levenshtein ≤ 2 / Cyrillic homograph / TLD swap of a verified domain | `#C62828` |

All three colours pass WCAG-AA non-text contrast (≥ 3:1) against both white
and the brand background `#003B73`.

## Colour tokens

| Token | Hex | Use |
|-------|-----|-----|
| `--onegov-brand-primary` | `#003B73` | PANTONE 280C — brand background, identity baseline (matches `identitate.gov.ro`) |
| `--onegov-brand-on-primary` | `#FFFFFF` | mark fill on brand ground |
| `--onegov-state-verified` | `#0F8A4F` | green shield + 16 px verified ground |
| `--onegov-state-unknown`  | `#6B7280` | gray shield + 16 px unknown ground |
| `--onegov-state-lookalike`| `#C62828` | red shield + 16 px lookalike ground |

Source of truth: the SVG files in `packages/extension/icons-src/` and the
constants in `scripts/gen-icons.ts`. Keep them in sync — there is no other
copy.

## Size policy (Approach B)

| Size | Composition | Rationale |
|------|-------------|-----------|
| 16 px | mark only, brand ground swapped to state colour | corner shield would be < 6 px tall and blob into noise; state colour carries the meaning at toolbar size |
| 32 / 48 / 128 px | mark on brand ground + corner shield in bottom-right (~40 % of icon) | full identity at every size where the shield can render legibly |

The 128 px file is also the canonical Chrome Web Store icon; the manifest
top-level `icons` field uses the green variant as the brand reference.

## Anti-impersonation rules

- The mark must **never** be paired with the Romanian flag colours (yellow /
  red on blue) or with anything resembling a national emblem, ministry
  seal, or coat of arms. The extension is a third-party UX layer; visual
  distinctiveness from official seals is a security feature.
- Do not place the mark on government documents, on official-looking blue
  banners that mimic government chrome, or in any context that implies
  endorsement by ANAF, the Government of Romania, or any of the agencies
  listed in `SITES_COVERAGE.md`.
- Do not modify the mark colours, geometry, or proportions. Use the
  generated PNGs (or re-run `bun run gen-icons` from the SVG sources).
- The shield colours are functional, not decorative. Do not invent a fourth
  state or repurpose them for non-state UI.

## Regeneration

The PNGs are committed (so contributors don't need the toolchain), but they
are deterministic artifacts of the SVG sources. To regenerate after editing
any SVG:

```bash
bun run gen-icons
```

Output: 12 PNGs in `packages/extension/icons/`. The script exits non-zero
on any failure.

The renderer is `@resvg/resvg-js` (wasm, no native deps). It must not pull
`node-forge` into the dep tree — `bun pm ls 2>&1 | grep -ci node-forge` must
return `0`.
