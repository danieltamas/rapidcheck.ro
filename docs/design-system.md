# onegov.ro Design System (v0.2.0)

The canonical catalog for `@onegov/ui`. Every component shipped by the
package is documented here with its props, variants, states, accessibility
notes, and usage examples. **Read this before building any UI in any task.**
If a component you need does not exist, EXTEND the library — never inline.

- Quick reference (one-pager): [`packages/ui/README.md`](../packages/ui/README.md)
- Visual playground (every component, every variant, live render):
  [`packages/ui/playground/index.html`](../packages/ui/playground/index.html)
- Source of truth for tokens: [`packages/ui/src/theme.css`](../packages/ui/src/theme.css)
  (typed mirror at [`packages/ui/src/tokens.ts`](../packages/ui/src/tokens.ts))

> **Versioning rule:** changes to components MUST update this catalog in the
> same commit. The playground HTML is the visual oracle — if you change a
> component's API or visual, render the new state in the playground.

---

## 1. Design principles

- **Identitate.gov.ro is the ground truth.** PANTONE 280C blue (`#003B73`)
  for primary surfaces, Arial / Calibri / Verdana / Tahoma / Trebuchet /
  Ubuntu for the body stack, system-ui for the display stack. We adopt the
  government-published identity that ministries themselves rarely implement.
- **Restraint over ornamentation.** Every animation, every gradient, every
  shadow earns its place. The feel target is *considered, not ornamented*
  (the canonical reference is the demoanaf homepage).
- **Tokens, not magic numbers.** Every value comes from `--onegov-*` CSS
  custom properties. Components never hard-code colours, spacing, type
  scales, radii, or motion durations.
- **Accessible by default.** Every interactive component is keyboard-navigable,
  has a visible focus ring, and meets WCAG 2.2 AA contrast (4.5:1 for text,
  3:1 for non-text). Romanian default labels for screen-readable text.
- **Reduce motion.** All animations are gated on
  `@media (prefers-reduced-motion: reduce)` — the global theme rule sets
  every motion token to 0ms and disables animations.
- **Compose, don't inline.** Site modules import primitives. If a primitive
  is missing, the library extends to provide it; site modules never re-roll.

---

## 2. Design tokens

All tokens are defined in `packages/ui/src/theme.css` as CSS custom
properties on `:host`, scoped to the closed shadow root. They are mirrored in
`packages/ui/src/tokens.ts` as a typed object for JS consumers.

### 2.1 Colour

#### Brand identity

| Token | Value | Use |
|---|---|---|
| `--onegov-color-primary` | `#003b73` | Primary brand surface (PANTONE 280C) |
| `--onegov-color-primary-hover` | `#1d4f9b` | Primary hover state |
| `--onegov-color-primary-active` | `#002a5a` | Primary pressed state |
| `--onegov-color-primary-soft` | `#e8eef6` | Primary tint (highlights, soft backgrounds) |
| `--onegov-color-primary-contrast` | `#ffffff` | Text/icon on primary |

#### Surface

| Token | Value | Use |
|---|---|---|
| `--onegov-color-bg` | `#ffffff` | Default page background |
| `--onegov-color-surface` | `#f7f9fc` | Subtle elevated surface |
| `--onegov-color-surface-elevated` | `#ffffff` | Modal / popover background |
| `--onegov-color-surface-sunken` | `#eef2f6` | Inset KPI / detail surface |
| `--onegov-color-text` | `#1a1a1a` | Body text |
| `--onegov-color-text-strong` | `#0b1320` | Strong text (titles inside cards) |
| `--onegov-color-muted` | `#5b6b7d` | Muted secondary text |
| `--onegov-color-subtle` | `#94a0ae` | Subtle decorative text |
| `--onegov-color-border` | `#d0d7de` | Default border |
| `--onegov-color-border-strong` | `#c0c8d2` | Strong border (hover) |
| `--onegov-color-overlay` | `rgba(15, 23, 42, 0.5)` | Modal backdrop |
| `--onegov-color-overlay-strong` | `rgba(15, 23, 42, 0.7)` | Forced-attention backdrop |

#### Status

Each status colour ships as `<name>` + `<name>-hover` + `<name>-soft`
(soft is a low-saturation tint for callout/badge/alert backgrounds).

| Token group | Default value |
|---|---|
| `--onegov-color-info` | `#1d4f9b` |
| `--onegov-color-success` | `#1f7a3a` |
| `--onegov-color-warning` | `#b06700` |
| `--onegov-color-danger` | `#b3261e` |

#### Neutral ramp

`--onegov-color-neutral-50` through `--onegov-color-neutral-900` (9 stops).
Use for text, borders, and surface variants when the semantic palette
doesn't fit.

### 2.2 Typography

| Token | Value | Use |
|---|---|---|
| `--onegov-font-base` | `Arial, Calibri, Verdana, Tahoma, "Trebuchet MS", Ubuntu, sans-serif` | Body text |
| `--onegov-font-display` | `system-ui, -apple-system, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif` | Headings |
| `--onegov-font-mono` | `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` | Code, identifiers |

Size scale (`--onegov-fs-*`): xs `12px` · sm `14px` · md `16px` · lg `20px`
· xl `24px` · 2xl `32px` · 3xl `40px` · 4xl `56px`.

Weight scale (`--onegov-fw-*`): light `300` · regular `400` · medium `500`
· semibold `600` · bold `700`.

Line-height scale (`--onegov-lh-*`): tight `1.15` · snug `1.3` ·
normal `1.55` · relaxed `1.7` · loose `1.9`.

Letter-spacing (`--onegov-ls-*`): tight `-0.02em` · snug `-0.01em` ·
normal `0` · wide `0.02em` · wider `0.06em`.

### 2.3 Spacing

4px base. Stops: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20.
Token name `--onegov-sp-N` maps to `N × 4px` for the first 12 stops, then
14 → 80, 16 → 96, 20 → 128.

### 2.4 Radius

| Token | Value |
|---|---|
| `--onegov-radius-sm` | `4px` |
| `--onegov-radius-md` | `8px` |
| `--onegov-radius-lg` | `16px` |
| `--onegov-radius-xl` | `24px` |
| `--onegov-radius-full` | `9999px` |

### 2.5 Shadows

| Token | Use |
|---|---|
| `--onegov-shadow-sm` | Subtle (default card resting state) |
| `--onegov-shadow-md` | Default (card hover) |
| `--onegov-shadow-lg` | Modal / dropdown / popover |
| `--onegov-shadow-xl` | Elevated dialog |
| `--onegov-shadow-inner` | Inset surface (sunken sections) |

### 2.6 Motion

Durations (`--onegov-duration-*`):
75ms · 100ms · 120ms (`fast`) · 150ms · 200ms (`base`) · 300ms · 320ms
(`slow`) · 500ms.

Easings (`--onegov-ease-*`):
- `standard` `cubic-bezier(0.2, 0, 0.2, 1)` — most transitions
- `emphasized` `cubic-bezier(0.2, 0, 0, 1)` — entry animations (modal open)
- `spring` `cubic-bezier(0.34, 1.56, 0.64, 1)` — playful overshoots

All motion is gated on `prefers-reduced-motion: reduce`.

### 2.7 Breakpoints

`--onegov-bp-sm` `640px` · `md` `768px` · `lg` `1024px` · `xl` `1280px` ·
`2xl` `1536px`. Mirrored in `tokens.breakpoints` as numbers.

### 2.8 Z-index

`base 0` · `raised 10` · `dropdown 100` · `sticky 200` · `overlay 900` ·
`modal 1000` · `popover 1100` · `tooltip 1200` · `toast 1300` · `max 9999`.

### 2.9 Focus ring

| Token | Default |
|---|---|
| `--onegov-focus-ring-color` | `#1d4f9b` |
| `--onegov-focus-ring-width` | `2px` |
| `--onegov-focus-offset` | `2px` |

Applied globally to `:host *:focus-visible` so every interactive element
receives a visible ring. Components must not remove it.

### 2.10 Touch targets

`--onegov-target-size: 44px` — every interactive element must respect this
minimum (WCAG 2.5.5).

---

## 3. Component catalog

Every component is exported from `@onegov/ui` as a named export. All
components forward `class?: string` to their root element so consumers can
extend styling. Where sensible, components also forward standard HTML
attributes via `...rest`. No default exports anywhere.

### 3.1 Layout primitives

| Component | Purpose | Source |
|---|---|---|
| `Stack` | Vertical flow with gap + alignment | `Stack.tsx` |
| `Cluster` | Wrapping horizontal flow + justify | `Cluster.tsx` |
| `Inline` | Non-wrapping inline-flex | `Inline.tsx` |
| `Container` | Max-width centred wrapper | `Container.tsx` |
| `AppShell` | Page chrome (header / aside / main / footer) | `AppShell.tsx` |

#### Stack

```tsx
<Stack gap="lg" align="start">
  <Heading level={2}>Title</Heading>
  <Paragraph>Pitch</Paragraph>
</Stack>
```

| Prop | Type | Default |
|---|---|---|
| `gap` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` |
| `align` | `'start' \| 'center' \| 'end' \| 'stretch'` | — |
| `class` | `string` | — |

#### Cluster

`gap`: `xs | sm | md | lg`. `justify`: `start | center | end | between`.
Wraps onto multiple lines; use for action buttons, filter pills, tag rows.

#### Inline

Non-wrapping inline-flex span. Use for icon+label pairs, badge groupings.

#### Container

`width`: `sm | md | lg | xl | 2xl`. Maps to the matching `--onegov-container-*`
token.

#### AppShell

```tsx
<AppShell
  header={<TopNav .../>}
  aside={<SideNav .../>}
  footer={<Footer .../>}
  stickyHeader
>
  {pageContent}
</AppShell>
```

| Prop | Type | Default |
|---|---|---|
| `header` | `ComponentChildren` | — |
| `aside` | `ComponentChildren` | — |
| `footer` | `ComponentChildren` | — |
| `stickyHeader` | `boolean` | `false` |
| `class` | `string` | — |

`aside` becomes a left column at `lg` and above; collapses on smaller
viewports.

### 3.2 Typography

| Component | Purpose | Source |
|---|---|---|
| `Heading` | h1–h6 with eyebrow + subtitle | `Heading.tsx` |
| `Paragraph` | Body copy with variants | `Paragraph.tsx` |
| `Text` | Inline span with size/weight/tone | `Text.tsx` |
| `Kbd` | Keyboard-key affordance | `Kbd.tsx` |

#### Heading

```tsx
<Heading level={1} display eyebrow="Categorie" subtitle="Subtitlu">
  Titlu mare
</Heading>
```

| Prop | Type | Default |
|---|---|---|
| `text` | `string` | — |
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `1` |
| `display` | `boolean` | `false` |
| `eyebrow` | `string` | — |
| `subtitle` | `string` | — |
| `persona` | `Persona` | `'standard'` |
| `children` | `ComponentChildren` | — (overrides `text`) |
| `class` | `string` | — |

#### Paragraph

`variant`: `lead | small | mono`. `muted`: bool.

```tsx
<Paragraph variant="lead">Big intro line</Paragraph>
```

#### Text

```tsx
<Text size="sm" weight="semibold" tone="muted" mono>
  CUI 14841555
</Text>
```

`size`: `xs | sm | md | lg | xl | 2xl`. `weight`: `regular | medium | semibold | bold`.
`tone`: `default | muted | subtle | primary | success | warning | danger`.
`mono`: bool. `truncate`: bool (single-line ellipsis).

#### Kbd

```tsx
<Kbd>⌘K</Kbd>
```

### 3.3 Actions

#### Button

```tsx
<Button variant="primary" size="md" leadingIcon={<Icon/>}>
  Trimite
</Button>
<Button variant="ghost" loading>Caută…</Button>
<Button variant="danger" fullWidth>Șterge</Button>
```

| Prop | Type | Default |
|---|---|---|
| `label` | `string` | — |
| `children` | `ComponentChildren` | — (overrides `label`) |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger' \| 'link'` | `'primary'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `loading` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `fullWidth` | `boolean` | `false` |
| `leadingIcon` | `ComponentChildren` | — |
| `trailingIcon` | `ComponentChildren` | — (suppressed in loading) |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` |
| `onClick` | `(e: MouseEvent) => void` | — |
| `class` | `string` | — |

States: default / hover / focus-visible / active (scale 0.97) / disabled
(opacity 0.5, no pointer) / loading (locked, aria-busy).

Active-press uses `transform: scale(0.97)` (matches the demoanaf canonical
button feel). Gated on reduced-motion.

#### Link

```tsx
<Link href="https://anaf.ro/">ANAF</Link>
<Link href="/local" variant="quiet">Despre</Link>
```

| Prop | Type | Default |
|---|---|---|
| `href` | `string` | required |
| `text` | `string` | — |
| `children` | `ComponentChildren` | — |
| `variant` | `'default' \| 'quiet'` | `'default'` |
| `external` | `boolean` | scheme-detected |
| `persona` | `Persona` | `'standard'` |
| `class` | `string` | — |

`href` is sanitised — only `http(s):`, `mailto:`, `tel:` and relative URLs
pass. Anything else (including `javascript:`, `data:`) renders as plain text
inside a span.

External links auto-receive `rel="noopener noreferrer"` + `target="_blank"`.
Override via `external` prop.

### 3.4 Form primitives

All form controls are presentational — they do not own state, do not submit.
Pair them with `FormField` for label / hint / error composition.

| Component | Purpose | Source |
|---|---|---|
| `Input` | text/email/url/search/tel/password/number/date | `Input.tsx` |
| `Textarea` | multi-line text | `Textarea.tsx` |
| `Select` | native select | `Select.tsx` |
| `Combobox` | typeahead select | `Combobox.tsx` |
| `Checkbox` | boolean (with optional indeterminate) | `Checkbox.tsx` |
| `Radio` + `RadioGroup` | single choice | `Radio.tsx` |
| `Switch` | on/off toggle (role=switch) | `Switch.tsx` |
| `FormField` | label + control + hint + error | `FormField.tsx` |
| `FormActions` | right-aligned button row | `FormActions.tsx` |
| `Form` | legacy READ-ONLY form (v0.1) | `Form.tsx` |

#### Input

`type`: `text | email | url | search | tel | password | number | date | time | datetime-local`.
`prefix` / `suffix`: optional affixes (e.g. `€`, `RON`).
`invalid`: bool — sets `aria-invalid` and the error border.

```tsx
<Input id="cui" placeholder="14841555" />
<Input id="amount" type="number" prefix="€" />
```

#### FormField (canonical wrapper)

```tsx
<FormField id="cui" label="CUI" hint="13 cifre" required>
  <Input id="cui" name="cui" />
</FormField>

<FormField id="email" label="Email" error="Nu este o adresă validă">
  <Input id="email" type="email" />
</FormField>
```

| Prop | Type | Notes |
|---|---|---|
| `id` | `string` | Must match the inner control's id |
| `label` | `string` | required |
| `hint` | `string` | renders `--onegov-color-muted` |
| `error` | `string` | adds `role="alert"` + error border |
| `required` | `boolean` | renders visible `*` + screen-reader 'obligatoriu' |
| `children` | `ComponentChildren` | the form control |

#### FormActions

```tsx
<FormActions>
  <Button variant="ghost">Anulează</Button>
  <Button>Trimite</Button>
</FormActions>
```

`align`: `start | center | end | between` (default `end`).
`noDivider`: `bool` — drop the top divider (for use inside Modal footer).

### 3.5 Surfaces

| Component | Purpose | Source |
|---|---|---|
| `Card` | Composable content tile | `Card.tsx` |
| `Panel` | Section wrapper with header/footer | `Panel.tsx` |
| `Box` | Generic surface primitive | `Box.tsx` |
| `Callout` | Inline contextual notice | `Callout.tsx` |
| `Banner` | Full-width announcement strip | `Banner.tsx` |

#### Card

```tsx
<Card variant="premium">
  <CardHeader><Heading level={3}>Titlu</Heading></CardHeader>
  <CardBody><Paragraph>Conținut</Paragraph></CardBody>
  <CardFooter><Button>Acțiune</Button></CardFooter>
</Card>

<Card variant="interactive" onClick={...}>...</Card>

<Card variant="media">
  <CardMedia src="/img.jpg" alt="..." />
  <CardBody>...</CardBody>
</Card>
```

| Variant | Behaviour |
|---|---|
| `default` | Flat card, legacy v0.1 look |
| `premium` | Modern card; subtle hover-shadow lift |
| `interactive` | Pressable; -2px lift on hover, scale(0.99) on active |
| `media` | Zero-padding container with media at top |

#### Panel

```tsx
<Panel variant="elevated" header="Setări" footer={<Button>Salvează</Button>}>
  <Switch label="Activ" />
</Panel>
```

`variant`: `default | bordered | elevated | flat`.

#### Box

`variant`: `default | surface | sunken | flat`. Lowest-level surface — use
when neither Card nor Panel fits.

#### Callout

```tsx
<Callout tone="warning" title="Atenție">
  Acest formular nu salvează datele.
</Callout>
```

`tone`: `info | success | warning | danger | neutral`.

#### Banner

```tsx
<Banner tone="info" onClose={() => {}}>
  Mentenanță programată: 22:00–02:00.
</Banner>
```

### 3.6 Overlays

| Component | Purpose | Source |
|---|---|---|
| `Modal` | Focus-trapped overlay dialog | `Modal.tsx` |
| `Popover` | Click-triggered floating panel | `Popover.tsx` |
| `Tooltip` | Hover/focus-revealed short text | `Tooltip.tsx` |

#### Modal

```tsx
<Modal open={open} onClose={() => setOpen(false)} title="Confirmare" size="md"
  footer={<>
    <Button variant="ghost" onClick={() => setOpen(false)}>Anulează</Button>
    <Button onClick={confirm}>Confirmă</Button>
  </>}>
  Sigur ștergi acest element?
</Modal>
```

| Prop | Type | Notes |
|---|---|---|
| `open` | `boolean` | required |
| `onClose` | `() => void` | required |
| `title` | `string` | sets aria-labelledby |
| `size` | `'sm' \| 'md' \| 'lg' \| 'full'` | `'md'` |
| `footer` | `ComponentChildren` | optional footer slot |
| `noBackdropClose` | `boolean` | `false` |
| `closeLabel` | `string` | `'Închide'` |

A11y: role=dialog, aria-modal=true, aria-labelledby points at title;
captures focus on open and restores on close; Tab cycles within; Escape
and backdrop click both close (suppressible). Renders inline (no portal —
content scripts mount inside a closed shadow root).

#### Popover

Click-triggered. Outside click + Escape close. Pass any content as
`children`.

```tsx
<Popover trigger={<Button>Optiuni</Button>}>
  <ActionList items={[...]} />
</Popover>
```

#### Tooltip

```tsx
<Tooltip text="Codul Unic de Înregistrare" position="top">
  <span>CUI</span>
</Tooltip>
```

`position`: `top | bottom | left | right`. Pure CSS reveal on hover/focus.

### 3.7 Disclosure

#### Accordion

```tsx
<Accordion
  items={[
    { id: 'a', title: 'Întrebare 1', content: <Paragraph>Răspuns</Paragraph> },
    { id: 'b', title: 'Întrebare 2', content: <Paragraph>...</Paragraph> },
  ]}
  multiple
  defaultOpen={['a']}
/>
```

| Prop | Type | Default |
|---|---|---|
| `items` | `AccordionItem[]` | required |
| `multiple` | `boolean` | `false` |
| `defaultOpen` | `ReadonlyArray<string>` | `[]` |

Keyboard: Enter/Space toggle, Arrow Up/Down focus, Home/End first/last.
A11y: aria-expanded + aria-controls on triggers; role=region + aria-labelledby
on panels.

#### Tabs

```tsx
<Tabs
  tabs={[
    { id: 'home', label: 'Acasă', content: <HomePanel /> },
    { id: 'about', label: 'Despre', content: <AboutPanel /> },
  ]}
  value={current}
  onChange={setCurrent}
  orientation="horizontal"
  ariaLabel="Secțiuni"
/>
```

| Prop | Type | Default |
|---|---|---|
| `tabs` | `TabDefinition[]` | required |
| `value` | `string` | required |
| `onChange` | `(id: string) => void` | required |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |

Keyboard: orientation-aware Arrow keys, Home/End jump, Enter/Space activate.
Manual activation pattern (focus moves, activation explicit). A11y:
role=tablist, role=tab + aria-selected, role=tabpanel + aria-labelledby.

### 3.8 Navigation

| Component | Purpose | Source |
|---|---|---|
| `TopNav` | Horizontal main nav with mobile toggle | `TopNav.tsx` |
| `SideNav` | Vertical nav grouped by section | `SideNav.tsx` |
| `Breadcrumb` | Crumb trail | `Breadcrumb.tsx` |
| `Pagination` | Page navigator with prev/next + numbers | `Pagination.tsx` |
| `Footer` + `FooterColumn` | Page footer with column slots | `Footer.tsx` |

#### TopNav

```tsx
<TopNav
  brand={<>onegov.ro</>}
  items={[
    { label: 'Acasă', href: '/', active: true },
    { label: 'Despre', href: '/about' },
  ]}
  trailing={<Avatar name="Daniel Tamas" size="sm" />}
/>
```

#### SideNav

```tsx
<SideNav
  sections={[
    { title: 'Cont', items: [
      { label: 'Profil', href: '/me', active: true },
      { label: 'Setări', href: '/settings' },
    ] },
  ]}
/>
```

#### Breadcrumb

```tsx
<Breadcrumb items={[
  { label: 'Acasă', href: '/' },
  { label: 'Servicii', href: '/services' },
  { label: 'Verificare CUI' },
]} />
```

Last item renders as current (no link, `aria-current="page"`).

#### Pagination

```tsx
<Pagination current={page} total={20} onChange={setPage} siblingCount={1} />
```

Algorithm: always show first + last; show `siblingCount` pages around
current; insert ellipsis when there's a gap.

#### Footer

```tsx
<Footer bottom={<span>v0.1.0 · MIT</span>}>
  <FooterColumn title="Despre">…</FooterColumn>
  <FooterColumn title="Resurse">…</FooterColumn>
</Footer>
```

### 3.9 Data display

| Component | Purpose |
|---|---|
| `Table` (legacy) | v0.1 string-array table with journalist CSV |
| `TableShell` + `TableHead` + `TableBody` + `TableRow` + `TableCell` + `TableSortHeader` | Composable table API |
| `List` | Bullet / numbered / divided list (string items) |
| `ActionList` | Interactive rows (button/link) with icon + label + description |
| `DefinitionList` | dt/dd pairs in a 2-column grid |
| `Badge` | Small inline label, tones + sizes + pill |
| `Avatar` | Circular image or initials |
| `StatusIndicator` | Coloured dot + optional label, pulse |
| `Divider` | `<hr>` or vertical separator |

#### Table (composable)

```tsx
<TableShell sticky>
  <TableHead>
    <TableRow>
      <TableSortHeader label="Anul" direction={dir} onSort={...} />
      <TableCell header align="right">Suma</TableCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {rows.map(r => (
      <TableRow>
        <TableCell>{r.year}</TableCell>
        <TableCell align="right">{r.sum}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</TableShell>
```

#### ActionList

```tsx
<ActionList items={[
  { id: 'cui', label: 'Verificare CUI', description: 'Caută o firmă',
    icon: <ShieldIcon/>, href: '/cui', trailing: <Badge tone="info">nou</Badge> },
]} />
```

#### Badge / Avatar / StatusIndicator / Divider

```tsx
<Badge tone="success" pill>activ</Badge>
<Avatar name="Daniel Tamas" size="lg" />
<StatusIndicator tone="success" label="Online" pulse />
<Divider inset />
```

### 3.10 Feedback

| Component | Purpose |
|---|---|
| `Spinner` | Accessible loader (sm | md | lg) |
| `ProgressBar` | Determinate / indeterminate progress |
| `Skeleton` + `SkeletonText` | Async content placeholder |
| `Alert` | Inline contextual message |
| `EmptyState` | Placeholder for no-data zones |

```tsx
<Spinner size="lg" label="Se încarcă datele..." />
<ProgressBar value={42} label="Încărcare" />
<Skeleton width="200px" height="32px" />
<SkeletonText lines={3} />
<Alert tone="warning" title="Atenție" onClose={...}>...</Alert>
<EmptyState
  title="Nu am găsit nimic"
  description="Încearcă alți termeni de căutare"
  action={<Button>Resetare</Button>}
/>
```

### 3.11 Page primitives

#### Hero

```tsx
<Hero
  eyebrow="Layer Romanian Government"
  title="Statul, cum ar fi trebuit să fie"
  description="O singură interfață peste site-urile statului."
  actions={<><Button>Începe</Button><Button variant="ghost">Despre</Button></>}
/>
```

#### CardGrid

```tsx
<CardGrid cols={3}>
  <Card variant="interactive">...</Card>
  <Card variant="interactive">...</Card>
  <Card variant="interactive">...</Card>
</CardGrid>
```

`cols`: `1 | 2 | 3 | 4`. Always 1 on mobile; expands progressively at sm/md/lg.

#### SearchBox

```tsx
<SearchBox
  value={query}
  onValueChange={setQuery}
  onSubmit={runSearch}
  suggestions={results}
  onSuggestionPicked={pick}
  placeholder="Caută o firmă, un CUI, o adresă..."
/>
```

Used for the homepage hero "search-as-CTA" pattern (the canonical demoanaf
homepage feel).

---

## 4. Composition examples

### 4.1 Page header

```tsx
<AppShell header={<TopNav .../>} footer={<Footer .../>}>
  <Container width="lg">
    <Breadcrumb items={...} />
    <Heading level={1} eyebrow="Verificare" subtitle="Caută o firmă">
      Verificare CUI
    </Heading>
    <Stack gap="lg">
      <SearchBox value={...} onValueChange={...} onSubmit={...} />
      <CardGrid cols={3}>...</CardGrid>
    </Stack>
  </Container>
</AppShell>
```

### 4.2 Form layout

```tsx
<Container width="md">
  <Stack gap="lg">
    <Heading level={2}>Programare</Heading>
    <FormField id="name" label="Nume" required>
      <Input id="name" name="name" />
    </FormField>
    <FormField id="email" label="Email" hint="Pentru confirmare">
      <Input id="email" type="email" />
    </FormField>
    <FormField id="reason" label="Motiv">
      <Select id="reason" options={...} placeholder="Alege..." />
    </FormField>
    <FormActions>
      <Button variant="ghost">Anulează</Button>
      <Button type="submit">Programează</Button>
    </FormActions>
  </Stack>
</Container>
```

### 4.3 Dashboard tile

```tsx
<Card variant="premium">
  <Cluster justify="between">
    <Stack gap="xs">
      <Text size="xs" weight="semibold" tone="muted">CUI ACTIVE</Text>
      <Text size="2xl" weight="bold" tone="primary">2,156,432</Text>
    </Stack>
    <StatusIndicator tone="success" label="actualizat" />
  </Cluster>
</Card>
```

### 4.4 Search results list

```tsx
<Stack gap="md">
  <Cluster justify="between">
    <Text tone="muted">{results.length} rezultate</Text>
    <Pagination current={page} total={total} onChange={setPage} />
  </Cluster>
  {results.length === 0 ? (
    <EmptyState
      title="Niciun rezultat"
      description="Încearcă alți termeni de căutare"
      action={<Button onClick={reset}>Resetare</Button>}
    />
  ) : (
    <ActionList items={results.map(r => ({
      id: r.id,
      label: r.name,
      description: `CUI ${r.cui}`,
      href: `/firma/${r.cui}`,
      trailing: <Badge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'activ' : 'inactiv'}</Badge>,
    }))} />
  )}
</Stack>
```

### 4.5 Confirmation modal

```tsx
<Modal
  open={isConfirming}
  onClose={cancel}
  title="Confirmare ștergere"
  size="sm"
  footer={
    <>
      <Button variant="ghost" onClick={cancel}>Anulează</Button>
      <Button variant="danger" onClick={confirm}>Șterge</Button>
    </>
  }
>
  <Paragraph>Sigur ștergi acest element? Acțiunea nu poate fi anulată.</Paragraph>
</Modal>
```

### 4.6 Tabs + content

```tsx
<Tabs
  tabs={[
    { id: 'detalii', label: 'Detalii', content: <DetailsPanel /> },
    { id: 'istoric', label: 'Istoric', content: <HistoryPanel /> },
    { id: 'documente', label: 'Documente', content: <DocsPanel /> },
  ]}
  value={current}
  onChange={setCurrent}
/>
```

### 4.7 Loading state

```tsx
{loading ? (
  <Stack gap="md">
    <Skeleton width="60%" height="32px" />
    <SkeletonText lines={4} />
    <Skeleton width="100%" height="200px" />
  </Stack>
) : (
  <ActualContent .../>
)}
```

### 4.8 Empty list with CTA

See §4.4 above.

### 4.9 Definition list (key/value)

```tsx
<DefinitionList items={[
  { term: 'CUI', description: '14841555' },
  { term: 'Stare', description: <StatusIndicator tone="success" label="Activ" /> },
  { term: 'Data înmatriculării', description: '2002-04-03' },
]} />
```

### 4.10 Filter bar

```tsx
<Cluster gap="sm">
  <Badge tone="info" pill>Toate</Badge>
  <Badge tone="neutral" pill>Active</Badge>
  <Badge tone="neutral" pill>Inactive</Badge>
  <Divider orientation="vertical" />
  <Switch label="Doar din ultima lună" />
</Cluster>
```

---

## 5. Accessibility

- **Keyboard navigation:** Every interactive element is keyboard-accessible.
  Buttons activate on Enter/Space; tabs/accordion follow APG-prescribed
  patterns (Arrow keys for siblings, Home/End for endpoints, Enter/Space
  for activation).
- **Focus management:** Modal traps focus inside the dialog and restores it
  to the previously focused element on close. Popover does not trap (it's
  meant to be dismissable via outside click). Every interactive element
  receives a visible focus ring (`outline: var(--onegov-focus-ring)`) and
  the global rule cannot be overridden by component CSS.
- **ARIA wiring:** FormField wires `htmlFor` and `aria-describedby`.
  Combobox uses role=combobox + aria-autocomplete=list. Tabs use role=tablist
  / role=tab / role=tabpanel with full aria-selected + aria-controls +
  aria-labelledby. Modal uses role=dialog + aria-modal=true. Tooltip uses
  role=tooltip. Live regions: Spinner + Alert (status/danger) +
  ProgressBar all expose appropriate roles for screen-reader announcement.
- **Contrast:** Every text/background combination passes WCAG 2.2 AA
  (4.5:1 for normal text, 3:1 for non-text). Status colors verified
  against both `--onegov-color-bg` and `--onegov-color-primary`.
- **Touch targets:** Every interactive element respects
  `--onegov-target-size` (44px) — enforced via min-height/min-width on
  buttons, inputs, switches.
- **Reduced motion:** All animations are gated on
  `@media (prefers-reduced-motion: reduce)` — durations zero out, animations
  drop to a single iteration.

---

## 6. Persona system

The library accepts a `persona?: Persona` prop on components that have
persona-specific visual variants (Heading, Paragraph, List, Card, Button,
Table, Form, Link). The renderer flips `data-persona` on the shadow host so
token cascades take effect.

| Persona | Visual signature |
|---|---|
| `standard` | Default identitate.gov.ro look |
| `pensioner` | ≥18px type, single column, larger touch targets |
| `pro` | Dense, smaller type, keyboard hint affordance |
| `journalist` | Wider tables, copy-as-CSV, anomaly highlights |

Personas are a v0.1 mechanism. v0.2 site modules (anaf takeover etc.)
de-emphasise persona variants in favour of explicit density / theme
preferences. Persona overrides remain in the design tokens but new
components are not required to react to them.

---

## 7. When to use what

- **Inline guidance / contextual notice:** Callout
- **Site-wide announcement at top:** Banner
- **Inline error / warning that doesn't block:** Alert
- **Forced confirmation / blocking interaction:** Modal
- **Click-triggered floating panel for richer content:** Popover
- **Hover-revealed short text:** Tooltip
- **Page chrome (header / nav / footer):** AppShell + TopNav + Footer
- **Vertical app-style nav:** SideNav (inside AppShell.aside)
- **Crumb trail:** Breadcrumb
- **Collection of similar items:** CardGrid + Card
- **Grouped section with title bar:** Panel
- **Generic content surface:** Box
- **Static text list:** List
- **Interactive list (clickable rows):** ActionList
- **Key/value pairs:** DefinitionList
- **Tabular data:** Table (legacy) or TableShell composition
- **Loading async data:** Skeleton + SkeletonText
- **Generic loading indicator:** Spinner
- **Determinate progress:** ProgressBar (omit `value` for indeterminate)
- **No-data placeholder:** EmptyState
- **Status indicator dot:** StatusIndicator
- **Inline label / tag:** Badge
- **User identity marker:** Avatar
- **Section separator:** Divider
- **Hero section:** Hero
- **Prominent search:** SearchBox

---

## 8. Building a new component

1. Read this catalog first — chances are a primitive already exists.
2. If you need a missing primitive, EXTEND the library inside
   `packages/ui/src/components/`.
3. Create the component as a named export, no default export.
4. Forward `class?: string` to the root element.
5. Use only `--onegov-*` tokens — never hard-code colours, sizes, motion
   values.
6. Gate every animation on `prefers-reduced-motion: reduce`.
7. Wire ARIA for any interactive behaviour.
8. Localise default labels in Romanian.
9. Write a render test + at least one variant test in
   `packages/ui/src/components/__tests__/`.
10. Add the component to `src/index.ts` (named export, no default).
11. Add the component to this catalog (props table + usage example).
12. Add the component to the playground (`packages/ui/playground/index.html`)
    showing every variant + state.

---

## 9. Changelog

### v0.2.0 (2026-05-02)

- Comprehensive token expansion: full color/typography/spacing/motion/z-index
  scales documented and exposed as both CSS custom props and typed JS exports.
- Layout primitives: Stack, Cluster, Inline, Container, AppShell.
- Typography upgrades: Heading (levels 4-6, display, eyebrow, subtitle),
  Paragraph (variants), Text, Kbd.
- Form primitives: Input, Textarea, Select, Combobox, Checkbox, Radio,
  RadioGroup, Switch, FormField, FormActions.
- Action upgrades: Button (variants ghost/danger/link, sizes sm/lg, loading,
  fullWidth, icons), Link (variant quiet, external override).
- Surfaces: Card variants (premium/interactive/media) + slot subcomponents,
  Panel, Box, Callout, Banner.
- Overlays: Modal (focus trap, sizes, slots), Popover, Tooltip.
- Disclosure: Accordion (single/multiple), Tabs (horizontal/vertical).
- Navigation: TopNav (mobile collapse), SideNav (sectioned), Breadcrumb,
  Pagination (ellipsis algorithm), Footer + FooterColumn.
- Data display: Table composition API (Shell/Head/Body/Row/Cell/SortHeader),
  ActionList, DefinitionList, Badge, Avatar, StatusIndicator, Divider.
- Feedback: Spinner, ProgressBar, Skeleton + SkeletonText, Alert, EmptyState.
- Page primitives: Hero, CardGrid, SearchBox.

All v0.1 component public APIs preserved byte-equal — existing callers in
`packages/ui/src/personas/` and `packages/extension/src/popup/` continue to
compile and render unchanged.
