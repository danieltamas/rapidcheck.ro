# QA notes — itmcluj.ro

**Fetched:** 2026-05-02 via `curl -L -A "Mozilla/5.0 ..." http://www.itmcluj.ro/`
**Encoding:** windows-1250 (no `<meta charset>` in HTML, no `Content-Type` charset hint)
**Transport:** HTTP only (no HTTPS) — confirms SITES_COVERAGE.md sec 3.7 finding
**Page weight:** 28.2KB raw HTML
**Live anomalies confirmed against SITES_COVERAGE.md:**

- `<FONT size=...>` tags throughout
- `<MARQUEE BEHAVIOUR="Alternate" LOOP=7>` inside the only `<H1>`
- `bak.jpg` body background set via `document.write`
- `meniu.js` and `mensus.js` are external `<SCRIPT>` files that build the sidebar / counter via `document.write`
- "© ITM 2005 Site realizat de Vaida Cristina" not visible in raw HTML — likely written by mensus.js or sits in an unfetched include; treat as visual marker that may render later
- One unexpected element: the institution profile (Denumire / Adresa / Conducerea / Telefon) is locked inside `<TEXTAREA id="txtSource">` and reflected into a child iframe by an inline script. This means a naive `document.querySelector` from the content script will NOT see that content — it lives in a synthetic iframe. v0.1 rule pack does not attempt to extract it; v0.2 may need a frame-walker for this site.

## Selector verification

| extract.id           | Selector                            | Live element check                                                                                                                                                                           | Hits?   |
| -------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `page-title`         | `h1`                                | Line 17 of fetched HTML: `<H1><PRE><font size=5 ...><MARQUEE ...><B><I> Inspectoratul Teritorial de Munca Cluj</B></I></MARQUEE></font></PRE></H1>` — the only `<H1>` on the page            | YES     |
| `announcement-links` | `p[align="center"] a[href$=".pdf"]` | ~50 announcement blocks. Sample line 47: `<p align="center"><font ...><B><IMG ...><A HREF="COMUNICAT_REGES_ONLINE_26.09.2025.pdf" target="_new"><font size=4> <B>...</A>`. PDF anchors only. | YES     |
| `sidebar-nav`        | `td[bgcolor="#C0C0C0"] a`           | Sidebar built by `meniu.js`: every nav row is `<TR><TD bgcolor="#C0C0C0" align="center"><FONT...><A href="...">...</A>`. Verified against fetched `meniu.js`.                                | YES     |
| `phone-numbers`      | `ul[type="square"]`                 | Inside the `<TEXTAREA>` content (line 322+). NOTE: this selector will NOT hit the live DOM because the UL is inside the textarea-reflected iframe. Flagged below.                            | PARTIAL |
| `heritage-marker`    | `img[src="siglaITM.JPG"]`           | Written by meniu.js: `document.write("<IMG src=\"siglaITM.JPG\" allign=\"top\">");` — appears at top of sidebar. Note unusual `allign` (not `align`) typo preserved.                         | YES     |

## Fragile selectors and why

- **`ul[type="square"]`** — the live DOM only contains this element inside the synthetic iframe built from `<TEXTAREA id="txtSource">`. v0.1 will silently extract zero nodes for `phone-numbers`. Acceptable: the renderer must handle empty `multiple: true` extractions gracefully (per renderer contract). v0.2 fix: walk same-origin iframes.
- **`td[bgcolor="#C0C0C0"] a`** — depends on meniu.js running. Content script runs at `document_idle` per CODING.md so meniu.js's `document.write` calls have already executed. Confirmed safe.
- **`p[align="center"] a[href$=".pdf"]`** — relies on the page-author convention of always wrapping announcements in `<p align="center">`. If the page is ever re-templated this would miss, but the page hasn't materially changed since 2005, so this is the most stable signal we can get.

## CAPTCHA / anti-bot

None observed on initial fetch. Plain HTTP, plain HTML, no JS challenge.

## Cookie / consent

None — pre-GDPR design.

## Accessibility widget

`<script src="https://accesibilitate.zebrabyte.ro/dist/zbt.min.js" defer>` is present. Out of scope for v0.1 — the layer's own theme tokens cover what this widget tries to do.

## Persona override summary

- **pensioner** — hides heritage-marker, sidebar-nav, phone-numbers; emphasizes page-title and announcement-links. Result: a single-column feed of clearly-titled PDF announcements.
- **standard** — keeps everything; emphasizes page-title and announcement-links.
- **pro** — emphasizes sidebar-nav, announcement-links, phone-numbers (dense info layout).
- **journalist** — emphasizes heritage-marker (the bak.jpg / siglaITM.JPG / 2005 timestamp IS the story), phone-numbers, announcement-links.

All four personas produce visibly different output.
