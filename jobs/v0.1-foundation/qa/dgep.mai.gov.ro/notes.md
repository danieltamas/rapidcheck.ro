# QA notes — dgep.mai.gov.ro

**Fetched:** 2026-05-02 via `curl -L -A "Mozilla/5.0 ..." https://dgep.mai.gov.ro/`
**Encoding:** UTF-8
**Transport:** HTTPS
**Backend:** WordPress (`wp-includes/js/jquery/...`) with custom Bootstrap 4 theme `template cms`. Body has `class="home blog cms-custom-class"`.
**Page weight:** 73.6KB (homepage), 49.4KB (servicii landing)

## Live anomalies vs SITES_COVERAGE.md

- The site IS the most-complained category on fara-hartie per sec 3.2. No surprises in the markup itself; the appointment flow CTAs sit correctly under `section.main .card-body a.bg-warning`.
- The actual appointment booking happens off-site at `hub.mai.gov.ro/cei/programari/harta` — a DIFFERENT domain. The dgep.mai.gov.ro pack only covers DGEP's own pages (homepage + service category landing). The hub.mai.gov.ro CTA is included as a `hero-cta` link but not as its own route — that's a separate rule pack target.
- WordPress `<article id="post-NNNN">` markup is stable. `data-postid` attributes on subnav links are stable.

## Selector verification — homepage

| extract.id         | Selector                               | Live element                                                                                                                                                | Hits? |
| ------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `institution-name` | `header.header .text-depabd a`         | Line 77: `<span class="ml-3 text-depabd font-weight-bold" ...><a class="text-decoration-none" ...>DIRECȚIA GENERALĂ PENTRU EVIDENȚA PERSOANELOR</a></span>` | YES   |
| `search-form`      | `form.form-inline input.search-field`  | Line 80: `<input class="form-control form-control-sm text-black search-field" type="search" placeholder="Cauta..." ...>`                                    | YES   |
| `primary-nav`      | `ul#menu-primary-menu > li > a`        | Line 108+: `<ul id="menu-primary-menu" class="navbar-nav mr-auto main-menu"><li ...><a href="#">Despre noi</a> ...`                                         | YES   |
| `hero-cta`         | `section.main .card-body a.bg-warning` | Lines 271, 278, 286, 293: 4 orange CTA cards (Cartea Electronica de Identitate, Programare CEI, Servicii electronice MAI, Aplicatii CEI)                    | YES   |
| `latest-news`      | `article.article h5.card-title a`      | Lines 308-380: 3 articles (post-2348, post-2345, post-2310) each with `<h5 class="card-title font-weight-bold mb-0 py-2"><a href="...">title</a></h5>`      | YES   |
| `carousel-items`   | `#custom-carousel .carousel-item`      | 4 carousel items at lines 183, 194, 205, 216                                                                                                                | YES   |

## Selector verification — servicii category

| extract.id           | Selector                        | Live element                                                                                                            | Hits? |
| -------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----- |
| `service-title`      | `section.main header h3`        | Line 181-183: `<header class="pt-5 mb-4 border-bottom"><h3 class="font-weight-bold">Evidența Persoanelor</h3></header>` | YES   |
| `service-subnav`     | `#post-navigate a[data-postid]` | Lines 191, 198, 205, 212: 4 subnav links each with `data-postid` (1787, 363, 365, 367)                                  | YES   |
| `service-body`       | `.ajax-content`                 | Line 221+: `<div class="ajax-content"><!-- wp:paragraph ... --><p>...</p></div>`                                        | YES   |
| `primary-nav`        | `ul#menu-primary-menu > li > a` | Same as homepage                                                                                                        | YES   |
| `related-categories` | `footer a[href*="/category/"]`  | Line 297: 8 category links inside footer Categorii block                                                                | YES   |

## Fragile selectors and why

- **`.text-depabd`** — bespoke class name that exists only on this site. If the theme is rebuilt this will break. Acceptable; the site has been stable for years.
- **`section.main .card-body a.bg-warning`** — `.bg-warning` is a Bootstrap-default colour utility, but it's used here exclusively for the orange CTA cards. Could over-match if the site adds other warning-coloured links inside section.main. Constrained scope minimizes risk.
- **`form.form-inline input.search-field`** — the page actually has TWO copies of the search form (one for desktop hidden on mobile, one inside the navbar collapse for mobile). The selector matches both. This is harmless because they're functionally identical, but the renderer will receive two identical `form` nodes. Documented for v0.2 dedup work.

## CAPTCHA / anti-bot

None on the public pages we target. The actual appointment booking on hub.mai.gov.ro (off-domain) uses CAPTCHA — out of scope.

## Cookie / consent

None in the raw HTML fetch. The site relies on a passive privacy notice in the footer.

## Persona override summary

- **Homepage**
  - **pensioner** — hides carousel, primary-nav, search-form. Single-column tap-target list of the 4 hero CTA cards plus institution name.
  - **standard** — emphasizes institution-name, hero-cta, latest-news.
  - **pro** — emphasizes primary-nav, hero-cta, latest-news, search-form. Dense.
  - **journalist** — emphasizes latest-news, carousel-items, hero-cta. News-first.
- **Servicii / category page**
  - **pensioner** — hides primary-nav and related-categories. Service title, sub-nav, and description only.
  - **standard** — emphasizes service-title, service-subnav, service-body.
  - **pro** — emphasizes service-subnav, primary-nav, related-categories, service-body. All chrome.
  - **journalist** — emphasizes service-title, service-body, related-categories.
