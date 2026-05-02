# QA notes — portal.just.ro

**Fetched:** 2026-05-02 via `curl -L -A "Mozilla/5.0 ..." https://portal.just.ro/SitePages/acasa.aspx` and `http://portal.just.ro/SitePages/dosare.aspx`
**Encoding:** UTF-8
**Transport:** HTTPS available but the homepage links to the dosare.aspx via plain HTTP (no scheme upgrade)
**Backend:** Microsoft SharePoint 2010 (`<meta name="GENERATOR" content="Microsoft SharePoint">`, `class="v4master"`, `IE=8` X-UA-Compatible). `<meta name="progid" content="SharePoint.WebPartPage.Document">`. Lots of MSO\* hidden fields, `__VIEWSTATE`, `__EVENTVALIDATION`.
**Page weight:** Homepage 65.5KB, dosare 62.9KB

## Live anomalies vs SITES_COVERAGE.md

- Self-admitted-broken advisory CONFIRMED. The exact banner text on the live homepage:
  > "In aceasta perioada sunt prevăzute operațiuni de mentenanță pentru portalul instanțelor de judecată. Acestea pot conduce la imposibilitatea efectuării de căutari pentru dosarele aflate pe rolul instanțelor de judecată. In perioada afectată puteți utiliza motorul de căutare alternativă disponibil aici - [Cauta dosar]"
  > This is rendered with `<font color="red">` (HTML4 styling preserved verbatim).
- The "alternative search engine" the homepage links to IS hosted at the same domain — `/SitePages/dosare.aspx`. Both packs cover routes on portal.just.ro. The third-party clones mentioned in SITES_COVERAGE.md (portal-just.ro, portal-justitie.ro, justassist.ro) are different domains and out of scope for this pack.
- SharePoint webpart IDs are GUID-based (`g_cb864081_9441_4954_9753_180f2c31f962`) and unstable — confirmed not to be relied on. We anchor on `<b>Label</b>` text instead.

## Selector verification — homepage

| extract.id             | Selector                                            | Live element                                                                                                                                            | Hits? |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `main-nav`             | `div.header ul.main-nav a`                          | Lines 272-281: 4 nav links (Prima pagină, Acces programatic, Hartă site, Contact)                                                                       | YES   |
| `search-box`           | `#searchBoxOuter input[type="text"]`                | Line 291: `<input ... type="text" ... title="Căutare..." class="ms-sbplain" ...>`                                                                       | YES   |
| `search-examples-link` | `a.search_ex`                                       | Line 297: `<a href="http://portal.just.ro/SitePages/despre.aspx#cautare" class="search_ex">Exemple de căutare</a>`                                      | YES   |
| `advisory-banner`      | `#ctl00_MSO_ContentDiv font[color="red"]`           | Lines 496-497: the maintenance advisory `<font color="red">In aceasta perioada ...</font>`                                                              | YES   |
| `court-links`          | `div[data-rel] ul li a[href*="acasa_default.aspx"]` | Lines 511-548+: regional `<div data-rel="ploiesti" class="regions">` with nested `<ul><li><a href="../<id>/SitePages/acasa_default.aspx?id_inst=<id>">` | YES   |

## Selector verification — case search (/SitePages/dosare.aspx)

| extract.id             | Selector                                 | Live element                                                                                                                                                                                                  | Hits? |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `page-title`           | `#page-title`                            | Line 836-838: `<div id="page-title">Dosare</div>`                                                                                                                                                             | YES   |
| `breadcrumb`           | `.BreadCrumbWrap a`                      | Line 825-832: `<div class="BreadCrumbWrap s4-notdlg"><span><a ... class="breadcrumbCurrentNode" href="/SitePages/acasa.aspx">Portal</a></span> > <span class="ms-sitemapdirectional">Dosare</span></div>`     | YES   |
| `filter-labels`        | `table.s4-wpTopTable b`                  | Line 846, 862, 872, 882: `<b>Judet</b>`, `<b>Numar dosar</b>`, `<b>Cod Postal</b>`, `<b>Nume parte</b>`. (Cod Postal and Judet are inside HTML comments — Cod Postal is currently disabled in the live page.) | YES   |
| `filter-inputs`        | `table.s4-wpTopTable input[type="text"]` | The visible inputs for Numar dosar, Nume parte (lines 862, 882). The Judet picker uses input type=text but is inside a commented-out block in the live HTML.                                                  | YES   |
| `apply-filters-action` | `[class*="ms-applyfilters"]`             | Line 893: `<table ... id="...Image" class="ms-applyfiltersinactive" onclick="...">`                                                                                                                           | YES   |
| `reset-link`           | `a[href="dosare.aspx"]`                  | Line 903: `<a href="dosare.aspx">Reiniţializare căutare</a>`                                                                                                                                                  | YES   |
| `main-nav`             | `div.header ul.main-nav a`               | Same as homepage                                                                                                                                                                                              | YES   |

## Fragile selectors and why

- **`#ctl00_MSO_ContentDiv font[color="red"]`** — depends on the maintenance advisory always being a red `<font>` tag. If they ever convert it to a CSS class (`.alert-danger` or similar), the selector misses. Acceptable because (a) the page is SharePoint 2010, (b) the same banner has been there for years per SITES_COVERAGE.md, (c) over-matching is benign — it just exposes the warning.
- **`div[data-rel] ul li a[href*="acasa_default.aspx"]`** — `data-rel` IS a stable HTML5 dataset attribute, but its semantic role here is bespoke to this site's regional map widget. If they replace the Raphael-driven map with a different widget the selector misses. Court links would still exist somewhere — the journalist persona would just see fewer of them.
- **`table.s4-wpTopTable b`** — `<b>` is fragile in general but in SharePoint 2010 webpart slicers it's the canonical label wrapper. Accept the risk.
- The SharePoint **GUID-based IDs are NEVER selected**. We anchor on stable element types and labels.

## CAPTCHA / anti-bot

None on the public pages. SharePoint relies on `__VIEWSTATE` / `__EVENTVALIDATION` for postback integrity, not CAPTCHA.

## Cookie / consent

None. Pre-GDPR SharePoint design.

## Persona override summary

- **Homepage**
  - **pensioner** — hides search-box, court-links. Keeps advisory visible (they need it), nav, and search-examples-link.
  - **standard** — emphasizes advisory-banner, search-box, main-nav.
  - **pro** — HIDES advisory-banner (per task spec — pros know what to do). Emphasizes search-box, court-links, main-nav.
  - **journalist** — emphasizes advisory-banner (the broken-by-design admission IS the story), court-links, search-examples-link.
- **Case search**
  - **pensioner** — strips everything except the form. Title, labels, inputs, apply button.
  - **standard** — clean form layout.
  - **pro** — dense, all controls including reset and main-nav.
  - **journalist** — title, labels, inputs, breadcrumb. Investigative form view.
