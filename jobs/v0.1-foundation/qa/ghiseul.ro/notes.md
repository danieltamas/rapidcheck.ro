# QA notes — ghiseul.ro

**Fetched:** 2026-05-02 via Playwright (Chrome MCP) — `https://www.ghiseul.ro/ghiseul/public/` and `/ghiseul/public/taxe`
**Encoding:** UTF-8
**Transport:** HTTPS only
**Backend:** Bootstrap 5 + bespoke ASP-style server-side. Behind Cloudflare's "managed challenge" (anti-bot) — direct curl returns the JS challenge HTML, not the real page. Live verification REQUIRED Playwright to render the JS challenge and reach the actual content.

## Live anomalies vs SITES_COVERAGE.md

- Cloudflare challenge confirmed. The extension's content script runs in the user's browser AFTER the challenge is solved, so this is not an extension blocker — but it IS a constraint for any v0.2 fetch-based pre-flight (deferred).
- Two flows confirmed (anonymous CTAs vs login form) per SITES_COVERAGE.md sec 3.1.
- All input fields on the payment-flow page have stable, developer-authored ids (NOT framework-generated GUIDs). Best-in-class for rule-pack authoring among the v0.1 ship list.
- Cookie banner uses bespoke `#divCookie` div with class `g-consent`. Per SITES_COVERAGE.md Appendix A this falls under "custom inline scripts (most local government)" pattern.

## Selector verification — homepage `/ghiseul/public/`

| extract.id               | Selector                | Live element                                                                                                                   | Hits? |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----- |
| `hero-title`             | `#title_auth h1`        | `<h1>Plătește online impozite şi taxe</h1>` inside `#title_auth.hero`                                                          | YES   |
| `primary-nav`            | `nav.navbar #navbar a`  | 5 anchors (Acasă, Instituții înrolate, Legislație, Întrebări frecvente, Contact)                                               | YES   |
| `login-form`             | `#login`                | `<form id="login">` with stable id                                                                                             | YES   |
| `login-username`         | `#username`             | `<input id="username" class="form-control input-lg">`                                                                          | YES   |
| `login-pin`              | `#passwordT`            | `<input id="passwordT" class="form-control input-lg">`                                                                         | YES   |
| `login-password`         | `#passwordP`            | `<input id="passwordP" class="form-control input-lg">`                                                                         | YES   |
| `anonymous-cta-cards`    | `#home-main a.btn-link` | 12+ anchors (Solicită date de acces, Plătește amenzi, fără autentificare, taxă judiciară, contravaloare pașaport, etc.)        | YES   |
| `service-section-titles` | `#home-main h3`         | 8 h3s (către instituţiile publice înrolate, Solicitare date, Plată amenzi, Plată fără autentificare, Rovinieta, Titluri, etc.) | YES   |
| `user-counter`           | `#nrUsers`              | `<div id="nrUsers" class="col-12 col-md-5 col-lg-5">`                                                                          | YES   |
| `cookie-banner`          | `#divCookie`            | `<div id="divCookie" class="g-consent">`                                                                                       | YES   |

## Selector verification — payment flow `/ghiseul/public/taxe`

| extract.id             | Selector               | Live element                                                                          | Hits? |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------------- | ----- |
| `page-title`           | `h1.page-title`        | `<h1 class="page-title">Plată fără autentificare</h1>`                                | YES   |
| `payment-form`         | `#formTaxe`            | `<form id="formTaxe" class="form-horizontal" action="/.../plata-taxe" method="post">` | YES   |
| `field-judet`          | `#judet`               | `<select id="judet" name="judet" class="form-control">` (county dropdown)             | YES   |
| `field-tip-institutie` | `#tip_institutie`      | `<select id="tip_institutie" name="tip_institutie" class="form-control">`             | YES   |
| `field-institutie`     | `#institutie`          | `<select id="institutie" name="institutie" class="form-control">`                     | YES   |
| `field-tip-pers`       | `#tipPers`             | `<select id="tipPers" name="tipPers" class="form-control">` (PF / PJ)                 | YES   |
| `field-alege-taxa`     | `#alege-taxa`          | `<a id="alege-taxa">` (modal trigger to pick the tax type)                            | YES   |
| `field-pv-serie`       | `#pv_serie`            | `<input id="pv_serie" name="pv_serie" type="text" class="form-control">`              | YES   |
| `field-pv-nr`          | `#pv_nr`               | `<input id="pv_nr" name="pv_nr" type="text" class="form-control">`                    | YES   |
| `primary-nav`          | `nav.navbar #navbar a` | Same as homepage                                                                      | YES   |

## Fragile selectors and why

None on this site. Every field has a developer-authored stable id. Best-in-class.

## CAPTCHA / anti-bot

**Cloudflare managed challenge** on the eTLD+1. Per SITES_COVERAGE.md Appendix B, CAPTCHAs are passed through transparently. The challenge runs BEFORE our content script ever sees the real page. After it clears, the user is on the real ghiseul.ro and our overlay renders normally.

The Cloudflare challenge iframe has `src*="challenges.cloudflare.com"` — flagged for the global passthrough list (already covered by Appendix B).

## Cookie / consent

Bespoke `#divCookie` with class `g-consent`. The buttons inside are `.btn-outline-secondary` (`Accepta`, `Ok`). The replacement pattern (per CLAUDE.md "What the layer restyles") proxies decisions to those buttons.

## Persona override summary

- **Homepage**
  - **pensioner** — anonymous flow only. Hides primary-nav, login form, counter. Emphasizes hero title, anonymous CTA cards, section titles.
  - **standard** — both flows visible.
  - **pro** — login form first; dense; anonymous flow secondary.
  - **journalist** — counter, service titles, cards. Login hidden.
- **Payment flow**
  - **pensioner** — strip nav, hide fine-detail fields, single-column form.
  - **standard** — clean default form.
  - **pro** — dense, all fields visible including fine details.
  - **journalist** — title, institution selector, tax-picker.
