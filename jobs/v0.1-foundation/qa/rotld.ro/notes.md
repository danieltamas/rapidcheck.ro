# QA notes — rotld.ro

**Fetched:** 2026-05-02 via Playwright (Chrome MCP) — `https://www.rotld.ro/`
**Encoding:** UTF-8
**Transport:** HTTPS (the bare `/` redirects to `/home/`)
**Backend:** Bootstrap 3 + Django (CSRF token + post action `/i18n/` for language switcher are Django conventions). Bespoke theme classes prefixed `.rt-*`.

## Live anomalies vs SITES_COVERAGE.md

- The homepage is reachable at `/home/` (canonical), `/` redirects there. Match pattern uses `^/(home/?)?$` to cover both.
- Three service cards on the homepage instead of the rich layout one might expect for a TLD registry — RoTLD is intentionally minimal. This makes the rule pack short.
- WHOIS form is the page's primary CTA, with stable `.rt-whois-input` class and `name="domain"`.

## Selector verification

| extract.id            | Selector                      | Live element                                                                                                       | Hits? |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----- |
| `page-title`          | `h1.highlight`                | `<h1 class="highlight">Registrul de Domenii RoTLD</h1>`                                                            | YES   |
| `welcome-subtitle`    | `h3.highlight`                | `<h3 class="highlight">Bun venit la registrul de domenii .ro</h3>`                                                 | YES   |
| `primary-nav`         | `ul.rt-nav > li > a`          | Top-level menu: Acasă, Știri, Adrese IP (link to lir.ro), WHOIS, Domenii .ro (dropdown), Servicii (dropdown), etc. | YES   |
| `brand-logo`          | `a.rt-navbar-brand`           | `<a class="navbar-brand rt-navbar-brand" href="/home">` (logo anchor)                                              | YES   |
| `whois-form`          | `form[action="/whois"]`       | `<form class="form-inline" action="/whois" method="GET">`                                                          | YES   |
| `whois-input`         | `input.rt-whois-input`        | `<input class="rt-whois-input" type="text" placeholder="Introduceți un nume de domeniu .ro" name="domain">`        | YES   |
| `service-card-titles` | `div.col-md-4.text-center h3` | 3 cards: "Administrare Domenii", "Formulare", "Adrese IP"                                                          | YES   |
| `service-card-links`  | `div.col-md-4.text-center a`  | "Mai multe" anchors inside each card                                                                               | YES   |
| `cookie-banner`       | `.cc-window`                  | `<div class="cc-window cc-banner cc-type-info ...">Acest site folosește cookies ...</div>`                         | YES   |

## Fragile selectors and why

- **`div.col-md-4.text-center h3`** — relies on the 3-card row using exactly `.col-md-4` and `.text-center`. If RoTLD adds more cards or changes the grid (col-md-3, col-md-6), the selector misses some. Acceptable: the page has been visually static for years.
- **`.rt-*` classes** — bespoke to RoTLD; if they ever rebrand or rebuild the theme this entire pack rots. There's no better anchor available.

## CAPTCHA / anti-bot

None observed on the homepage. The actual WHOIS lookup at `/whois` may impose rate limits but that's a server-side concern, not a rendering one.

## Cookie / consent

Uses the `cookieconsent` JS library (Insites). `<div class="cc-window cc-banner ...">` is the banner; `<a class="cc-btn cc-dismiss">Accept!</a>` is the accept button. The replacement consent module per CLAUDE.md proxies to `.cc-btn.cc-dismiss`.

## Persona override summary

- **pensioner** — strip primary-nav and cookie-banner; emphasize page-title, welcome-subtitle, whois-form, whois-input, service-card-titles. One-tap per row.
- **standard** — emphasize page-title, whois-form, whois-input, service-card-titles.
- **pro** — emphasize whois-form, whois-input, primary-nav (dense), service-card-links, brand-logo.
- **journalist** — emphasize whois-form, whois-input, service-card-titles, service-card-links. Source-verification first.
