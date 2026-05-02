# UI test harness

`packages/ui/test-harness.html` is the visual smoke test for the renderer and
the eight atomic components. It renders the same hand-coded `SemanticTree`
across all four personas side by side, so a reviewer can eyeball persona
differences in seconds without launching the full extension.

## How to open

```bash
# 1. Build the standalone harness bundle (once per change to packages/ui/src/)
bun run --cwd packages/ui build:harness

# 2. Open the harness in a Chromium browser
open packages/ui/test-harness.html         # macOS
xdg-open packages/ui/test-harness.html     # Linux
```

The harness is a static HTML file; no dev server, no extension context, no
Chrome flags. It loads `dist/harness/renderer.bundle.js` (built by step 1)
which contains the renderer + components + Preact runtime in a single ESM
chunk.

## What you should see

Four panels in a responsive grid:

1. **standard** — clean default. Identitate.gov.ro PANTONE 280C blue
   primary, recommended fonts.
2. **pensioner** — large type (≥20px), single column, generous spacing,
   primary action lifted into a card.
3. **pro** — dense (14px), multi-column grid where space permits, keyboard
   hints (`↵`) next to links.
4. **journalist** — tables get a `Copiază ca CSV` toggle that reveals a
   read-only textarea with the table contents in CSV form.

Every panel includes a Form (read-only — no `onSubmit`), a Table, a List,
several headings, and a deliberately-malformed `javascript:` link to confirm
the security boundary in `Link.tsx` renders it as plain text instead of an
anchor.

## When to rebuild

After any change to:

- `packages/ui/src/components/**`
- `packages/ui/src/personas/**`
- `packages/ui/src/renderer.tsx`
- `packages/ui/src/theme.ts` or `theme.css`

The harness uses the bundled `dist/harness/renderer.bundle.js` — TypeScript
sources are not loaded directly.

## Console expectations

Open DevTools. The console should be **empty**. Any error means the
renderer broke during mount; any warning means a persona variant is missing
a token or attribute the test fixture exercises.
