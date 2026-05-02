# QA notes — anaf.ro

**Fetched:** 2026-05-02 via `curl -L -A "Mozilla/5.0 ..." https://www.anaf.ro/anaf/internet/ANAF/`
**Encoding:** UTF-8
**Transport:** HTTPS
**Backend:** IBM WebSphere Portal (Lotus). All `wptheme*` CSS classes are stable across IBM portal versions and across templates inside ANAF — they're not bespoke, they ship with the base portlet container CSS that ANAF cannot easily change without rewriting their entire portal.
**Page weight:** ~ 165KB raw HTML (3698 lines)

## Live anomalies vs SITES_COVERAGE.md

- SPEC.md Appendix A suggests inner page `/web/guest/persoane-juridice/cui-platitor-tva` — **that URL returns a WebSEAL Forbidden 403**. ANAF's Liferay-style URLs aren't actually exposed; everything goes through the WebSphere portal at `/anaf/internet/ANAF/`. We ship two routes: homepage `^/anaf/internet/ANAF/?$` and Servicii Online inner page `^/anaf/internet/ANAF/servicii_online/?`.
- The truly public CUI lookup is at `webservicesp.anaf.ro` (a SOAP/REST API, not a UI page). Nothing to overlay.
- The `/anaf/internet/ANAF/servicii_online/` page is actually labelled "Inregistrare utilizatori" in the breadcrumb / portlet title, with four flip-cards covering: SPV, Declaratii electronice, API registration, Non-residents.

## Selector verification

| extract.id            | Selector                                   | Live element                                                                                               | Hits? |
| --------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ----- |
| `brand-logo`          | `.wpthemeLogo img[alt="[ANAF]"]`           | Line 164: `<img alt="[ANAF]" src="https://static.anaf.ro/static/10/Anaf/primapagina/anaf_ro.png" ...>`     | YES   |
| `breadcrumb-links`    | `.wpthemeCrumbTrail a`                     | Line 273-278: `<div class="wpthemeCrumbTrail wpthemeLeft">  <a href="...">ANAF</a> </div>`                 | YES   |
| `main-nav`            | `ul.nav-menu > li > a`                     | Line 285+: `<ul class="nav-menu">  <li> <a href="?uri=...">Despre ANAF</a> ...`                            | YES   |
| `portlet-titles`      | `span.lm-dynamic-title`                    | Lines 1665, 1962, 2342, 2682, 3256: `<span class="lm-dynamic-title asa.portlet.title a11yRegionLabel">...` | YES   |
| `main-content-marker` | `div.wpthemeMainContent[role="main"]`      | Line 1578: `<div class="wpthemeMainContent" role="main">`                                                  | YES   |
| `footer-marker`       | `footer.wpthemeFooter[role="contentinfo"]` | Line 3452: `<footer class="wpthemeFooter" role="contentinfo">`                                             | YES   |

### Servicii Online inner route

| extract.id         | Selector                | Live element                                                                                                                                      | Hits? |
| ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `page-title`       | `span.lm-dynamic-title` | Line 1639: `<span class="lm-dynamic-title asa.portlet.title a11yRegionLabel"><span lang="ro" dir="ltr">Inregistrare utilizatori</span></span>`    | YES   |
| `breadcrumb-links` | `.wpthemeCrumbTrail a`  | Same wpthemeCrumbTrail as homepage                                                                                                                | YES   |
| `service-cards`    | `a.btn.brighten`        | 4 anchors inside .card-back, .card-back2, .card-back3, .card-back4 — each pointing to a service flow (SPV, Declaratii, API, Non-residents)        | YES   |
| `card-labels`      | `.container .content p` | 4 labels: "SPATIUL PRIVAT VIRTUAL", "DEPUNERE DECLARATII", "DEZVOLTATORI APLICATII", "NON-RESIDENTS" (Romanian diacritics encoded as &#354; etc.) | YES   |
| `main-nav`         | `ul.nav-menu > li > a`  | Same as homepage                                                                                                                                  | YES   |

## Fragile selectors and why

- **`span.lm-dynamic-title`** — the class is a stable WebSphere convention but ANAF reuses it on every portlet, so this returns 4-5 matches on the homepage. The renderer will receive multiple nodes; `multiple: true` set on the extract rule. Acceptable.
- **`a.btn.brighten`** — the `.btn .brighten` class pair is bespoke to the Servicii Online page (defined in inline `<style>` on that page). If ANAF redesigns this page the selector misses. Acceptable for v0.1; flagged for v0.2 to monitor.
- **`.container .content p`** — `.container` and `.content` are common class names; on this specific page they unambiguously identify card front-face labels because the inline CSS scopes them (`.container .content { position: absolute; ... }`). Could over-match on other ANAF pages. The route pattern `^/anaf/internet/ANAF/servicii_online/?` constrains scope.

## CAPTCHA / anti-bot

None on these public pages. ReCAPTCHA appears on internal SPV authentication flows — out of scope (those URLs are behind WebSEAL and the rule pack does not target them).

## Cookie / consent

No cookie banner observed in the raw HTML fetch; the WebSphere theme does not ship one. ANAF likely depends on user accepting via SPV authentication only.

## Persona override summary

- **Homepage**
  - **pensioner** — hides breadcrumb-links and footer-marker; emphasizes brand-logo, portlet-titles, main-nav. Single-column "what's on this site" view.
  - **standard** — emphasizes brand-logo, main-nav, portlet-titles. Default gov-clean layout.
  - **pro** — emphasizes main-nav, portlet-titles, breadcrumb-links. Dense, all chrome visible.
  - **journalist** — emphasizes portlet-titles and main-content-marker (raw content focus, less chrome).
- **Servicii Online**
  - **pensioner** — hides breadcrumb and main-nav; emphasizes page-title and the 4 service cards.
  - **standard** — emphasizes page-title and service-cards.
  - **pro** — emphasizes service-cards, main-nav, breadcrumb-links.
  - **journalist** — emphasizes service-cards, card-labels, page-title.
