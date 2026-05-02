# @onegov/ui

Preact components, design tokens, and theme rendering for the onegov.ro
extension and any future site modules. Composed entirely from
`--onegov-*` CSS custom properties; zero external UI dependencies; ships
inside a closed shadow root.

> **Before you build anything:** read [`docs/design-system.md`](../../docs/design-system.md).
> If a component you need does not exist, EXTEND the library here — never
> inline.

## Quick links

- **[`docs/design-system.md`](../../docs/design-system.md)** — canonical catalog (props, tokens, composition examples, a11y, "when to use")
- **[`playground/index.html`](./playground/index.html)** — live render of every component, every variant
- **[`src/theme.css`](./src/theme.css)** — design token source of truth
- **[`src/tokens.ts`](./src/tokens.ts)** — typed mirror of the same tokens

## Install

Workspace package — already linked from the root via Bun workspaces. Import
from any package that depends on `@onegov/ui`:

```ts
import { Button, Card, Stack, Heading } from '@onegov/ui';
```

## Components (one-line cues)

### Layout
- `Stack` — vertical flow with gap + alignment
- `Cluster` — horizontal flow that wraps + justify
- `Inline` — non-wrapping inline-flex
- `Container` — max-width centred wrapper at `sm | md | lg | xl | 2xl`
- `AppShell` — page chrome (header / aside / main / footer); sticky-header opt-in

### Typography
- `Heading` — h1–h6 with `display`, `eyebrow`, `subtitle`
- `Paragraph` — body copy with `lead | small | mono` variants
- `Text` — inline span with size / weight / tone / mono / truncate
- `Kbd` — keyboard-key affordance

### Actions
- `Button` — variants `primary | secondary | ghost | danger | link`; sizes
  `sm | md | lg`; states default / hover / focus / active (scale 0.97) /
  disabled / loading
- `Link` — sanitised hrefs, scheme allowlist, `quiet` variant, external
  rel-hardening

### Forms (presentational; pair with FormField)
- `Input` — text/email/url/search/tel/password/number/date with prefix+suffix
- `Textarea` — multi-line with rows
- `Select` — native select with placeholder
- `Combobox` — typeahead with keyboard nav
- `Checkbox` — boolean with optional indeterminate
- `Radio` + `RadioGroup` — single-choice (use group for proper semantics)
- `Switch` — on/off toggle (role=switch)
- `FormField` — label + control + hint + error composition with full ARIA
- `FormActions` — right-aligned button row terminator

### Surfaces
- `Card` — variants `default | premium | interactive | media`; with
  `CardHeader`, `CardBody`, `CardFooter`, `CardMedia` slot subcomponents
- `Panel` — section wrapper with header / footer slots; variants `default |
  bordered | elevated | flat`
- `Box` — generic surface primitive; variants `default | surface | sunken | flat`
- `Callout` — inline contextual notice; tones `info | success | warning |
  danger | neutral`
- `Banner` — full-width announcement strip; tones + close button

### Overlays
- `Modal` — focus-trapped dialog with backdrop, sizes `sm | md | lg | full`,
  Escape + backdrop close, optional footer
- `Popover` — click-triggered floating panel (outside-click + Escape close)
- `Tooltip` — hover/focus reveal; positions `top | bottom | left | right`

### Disclosure
- `Accordion` — vertical expandable list; `multiple` mode for independent panels
- `Tabs` — horizontal or vertical tabbed switcher; manual activation pattern

### Navigation
- `TopNav` — main nav with mobile hamburger collapse; brand + items + trailing slot
- `SideNav` — vertical nav grouped by sections
- `Breadcrumb` — truncating crumb trail
- `Pagination` — prev / numbers (with ellipsis) / next; configurable sibling count
- `Footer` + `FooterColumn` — page footer with column slots + bottom row

### Data display
- `Table` (legacy) + composition API: `TableShell`, `TableHead`, `TableBody`,
  `TableRow`, `TableCell`, `TableSortHeader`
- `List` — bullet / numbered / divided
- `ActionList` — interactive rows (icon + label + description + trailing)
- `DefinitionList` — dt/dd pairs in a 2-column grid
- `Badge` — small inline label; tones, sizes, pill
- `Avatar` — circular image or initials; sizes `sm | md | lg | xl`
- `StatusIndicator` — coloured dot + label; optional pulse
- `Divider` — `<hr>` or vertical separator

### Feedback
- `Spinner` — accessible loader (aria-live=polite); sizes
- `ProgressBar` — determinate (0–100) or indeterminate
- `Skeleton` + `SkeletonText` — shape placeholders for async content
- `Alert` — inline contextual message; tones; optional close
- `EmptyState` — placeholder for no-data zones; illustration + title +
  description + action

### Page primitives
- `Hero` — eyebrow + title + description + actions
- `CardGrid` — responsive grid (1 | 2 | 3 | 4 columns)
- `SearchBox` — prominent search input with optional suggestions

## Theme & tokens

```ts
import { tokens, colors, fontSizes, spacing } from '@onegov/ui';

console.log(colors.primary);     // '#003b73'
console.log(spacing['4']);       // '16px'
console.log(fontSizes.lg);       // '20px'
```

Token CSS is injected into the closed shadow root by `render(tree, persona,
shadowRoot)`. Components consume them via plain `var(--onegov-*)` declarations.

## Renderer (legacy v0.1 entry)

```ts
import { render } from '@onegov/ui';
render(tree, persona, shadowRoot);
```

`render()` wires the theme stylesheet, attaches the persona-aware layout
(StandardLayout / PensionerLayout / ProLayout / JournalistLayout), and
mounts the Preact tree. Idempotent.

## Build the visual playground

```bash
bun run --cwd packages/ui build:playground
open packages/ui/playground/dist/index.html
```

(Or simply open `packages/ui/playground/index.html` in any Chromium browser
— it's a self-contained static HTML file.)

## Tests

```bash
bun run test:ui
```

Every component has render + variant + interaction tests under
`src/components/__tests__/`. Forms tests cover keyboard interaction;
overlays tests cover focus / dismiss; navigation tests cover ARIA wiring.

## Conventions

- Named exports only; no default exports.
- Forward `class?: string` (and standard HTML attributes when sensible) to
  the root element.
- Hand-rolled CSS using `--onegov-*` tokens. No Tailwind. No CSS-in-JS. No
  external UI library.
- Animations gated on `@media (prefers-reduced-motion: reduce)`.
- Romanian default labels for visible UI text; English in code (props,
  comments, types).

## Deeper reading

- [`docs/design-system.md`](../../docs/design-system.md) — canonical catalog
- [`docs/brand.md`](../../docs/brand.md) — brand mark + state shields
- [`CLAUDE.md`](../../CLAUDE.md) — project workflow, invariants
- [`CODING.md`](../../CODING.md) — engineering patterns
