# Contributing to onegov.ro

Thank you for considering a contribution. onegov.ro is open source because the Romanian state's public services should be open and improvable by the public who depend on them. The two highest-leverage contributions are **rule packs** (one site at a time) and **verified-domain roster entries** (one phishing trap closed at a time). Code contributions are also welcome.

This file is the practical how. For the *why* and the architectural rules, read [`README.md`](./README.md) and [`CLAUDE.md`](./CLAUDE.md). For engineering patterns and test conventions, read [`CODING.md`](./CODING.md) and [`TESTING.md`](./TESTING.md).

---

## Code of Conduct

Be civil. Don't dox. Don't post personal data, CNPs, or anything that could identify a specific citizen in issues or PRs. Romanian gov sites occasionally leak data — if you find such a leak, **do not report it publicly**; email `security@onegov.ro` (see [`SECURITY.md`](./SECURITY.md)).

---

## What you cannot change

The five invariants in [`CLAUDE.md`](./CLAUDE.md) are non-negotiable. Any PR that weakens any of them will be rejected on sight, no matter how clever the implementation:

1. Original DOM is never mutated.
2. No form data is touched (read-only in v0.1).
3. No remote code execution.
4. No external network requests in v0.1 beyond bundled assets.
5. The user can always escape the overlay.

If you have a use case that you think *requires* relaxing one of these, open a discussion (not a PR) first.

---

## Authoring a rule pack

A rule pack tells the extension how to extract semantic content from a specific gov site so the persona-adapted UI can render it. Packs are pure JSON — no code.

### 1. Pick a site

Check [`SITES_COVERAGE.md`](./SITES_COVERAGE.md) for the priority list. Tier 1 is most-broken, highest-impact citizen-facing portals. Tier 2 is the agency long tail. If your site isn't listed, it's a candidate for v0.2+ work — open an issue first to discuss.

### 2. Add the domain to the verified roster (if absent)

Edit `rule-packs/_verified-domains.json` and add an entry:

```json
{
  "domain": "example.gov.ro",
  "category": "gov",
  "addedAt": "2026-05-02",
  "source": "https://example.gov.ro/contact"
}
```

- `domain` is the eTLD+1 (no subdomain, no scheme, no path).
- `category` is `gov` for state institutions or `public-interest` for sanctioned public-interest services.
- `source` must point to public evidence the domain is genuinely operated by a Romanian public institution. Bumping `version` is required.

See ["Extending the verified-domain roster"](#extending-the-verified-domain-roster) below for the curation discipline.

### 3. Inspect the live site

Open the site in Chrome DevTools. Identify the semantic elements you want the layer to surface:

- Page title (`heading`)
- Main calls-to-action (`link` with `multiple: true`)
- Search forms (`form`)
- Key data tables (`table`)
- Critical paragraphs (`paragraph`)

For each, find a **stable selector**:

- ✅ `[data-section="header-actions"]`
- ✅ `nav.principal a`
- ✅ `#search-form`
- ⚠️ `.css-1k3v2x` (CSS-in-JS hash — will rot)
- ⚠️ `:nth-child(3)` (render-order dependent)

### 4. Write the pack

Create `rule-packs/<domain>.json` using the example skeleton in [`SPEC.md` Appendix B](./SPEC.md). At minimum:

```json
{
  "$schema": "https://onegov.ro/schemas/rule-pack-v1.json",
  "domain": "example.gov.ro",
  "version": "0.1.0",
  "routes": [
    {
      "match": { "pattern": "^/$" },
      "layout": "landing",
      "extract": [
        {
          "id": "page-title",
          "selector": "h1",
          "type": "heading",
          "attrs": { "text": "textContent" }
        }
      ],
      "personas": {
        "pensioner": {
          "layout": "landing-simplified",
          "emphasize": ["page-title"]
        }
      }
    }
  ]
}
```

At least one persona override must produce a visibly different result.

### 5. Validate

```bash
npm run validate-packs
```

Must pass. The Zod schema in `packages/core/src/rule-pack-loader.ts` is the source of truth.

### 6. Add the domain to `host_permissions`

Edit `packages/extension/src/manifest.json` and add the domain pattern (e.g. `"*://*.example.gov.ro/*"`) to both `host_permissions` and `content_scripts.matches`.

> **Note:** maintainer review is required for manifest changes. New `host_permissions` are an attack-surface expansion and a Web-Store review trigger — please justify in the PR description.

### 7. Manual QA in Chrome and Firefox

```bash
npm run build
```

Then load unpacked in both browsers and visit the target site. Take **before/after screenshots** for each persona (`pensioner`, `standard`, `pro`, `journalist`) — that's eight screenshots for one route. Commit them to `jobs/<job>/qa/<domain>/`.

### 8. Open a PR

PR title format: `feat(rule-packs): add <domain> rule pack`. Include in the description:

- Why this site (citizen complaints, traffic, brokenness)
- What rule-pack rules cover
- Which personas have overrides
- Screenshots in `jobs/<job>/qa/<domain>/`
- Confirmation that the five invariants still hold

---

## Extending the verified-domain roster

The verified-domain roster (`rule-packs/_verified-domains.json`) drives the green/gray/red icon and lookalike phishing detection independently of rule-pack coverage. It is **the single highest-leverage v0.1 artefact**: catching one more lookalike attack is a public good even if no UX layer renders.

### Curation discipline

- Every entry must point to public evidence (`source`) that the domain is operated by a Romanian public institution or is a sanctioned public-interest service.
- No commercial vendor sites (notary marketplaces, accounting SaaS, e-commerce platforms even if "gov-adjacent").
- No domains the maintainer has not personally verified.
- The maintainer is the final arbiter of category (`gov` vs `public-interest`).
- Bump `version` on every change.

### Lookalike test fallout

When you add a new entry, run `npm test -w @onegov/core` to confirm no false positives are introduced against existing entries (e.g. adding `cjcluj.ro` should not cause `cjcjuj.ro` to incorrectly resolve to a different lookalike). If a false positive appears, the right fix is usually to add the entry but also adjust the test fixtures — never to weaken the lookalike algorithm.

---

## Contributing code

### Setup

```bash
git clone https://github.com/danieltamas/onegov.ro.git
cd onegov.ro
npm install
npm run check       # lint + typecheck across workspaces
npm test            # unit tests
npm run validate-packs
npm run build
npm run e2e         # Playwright (Chromium + Firefox)
```

### Branching

Branch off `main`:

```bash
git checkout -b feature/<short-name>
# or, for multi-task work using the project's job convention:
git checkout -b job/<job>/<group>-<task>
```

### Commit messages

Conventional Commits, scope per package:

```
feat(core): add IDNA homograph normalisation
fix(extension): persona switch listener leaked across navigations
docs(spec): clarify shadow-root mode requirement
test(ui): add render snapshot for journalist persona
```

**No `Co-Authored-By` or co-author trailers.**

### Required for every PR

- [ ] Lint + typecheck pass (`npm run check`)
- [ ] All unit tests pass (`npm test`)
- [ ] All rule packs validate (`npm run validate-packs`)
- [ ] E2E passes in Chromium and Firefox (`npm run e2e`)
- [ ] Manual smoke load in Chrome AND Firefox (no console errors)
- [ ] Each of the five invariants still holds (PR description must confirm)
- [ ] No file exceeds 500 lines
- [ ] No new runtime dependencies without maintainer approval
- [ ] No new manifest permissions without maintainer approval
- [ ] No `chrome.*` / `browser.*` outside `packages/extension`
- [ ] No `eval`, `new Function`, `innerHTML` with rule-pack data, or `fetch()` to external origins

### What we'll review

`SECURITY.md` Reviewer Playbook is the canonical checklist; expect every PR to be evaluated against it. Most rejections come from one of:

- Invariant weakened (almost always inadvertent — read CLAUDE.md again)
- New host_permission / new dependency without justification
- Test coverage gap on error paths
- Bundle-size budget breached (≤80KB content.js gzipped)
- Cross-browser regression (works in Chrome, breaks in Firefox)

---

## Reporting bugs

Open a GitHub issue with:

1. **Browser + version** (Chrome 132 / Firefox 124 / etc.)
2. **OS**
3. **onegov.ro version** (from popup footer)
4. **The site you were on**
5. **What you expected**
6. **What happened** (screenshots help)
7. **Console output** from `chrome://extensions` or `about:debugging`

For security bugs, **do not open a public issue** — see [`SECURITY.md`](./SECURITY.md).

---

## Suggesting features

v0.2+ roadmap is sketched in `SPEC.md §10`. Feature suggestions outside that scope are welcome — open a GitHub Discussion first so we can talk through fit before you invest implementation time.

---

## Maintainer

Daniel Tamas — `hello@danieltamas.ro` — Cluj-Napoca, Romania.
