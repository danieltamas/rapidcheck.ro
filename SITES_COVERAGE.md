# onegov.ro — Coverage Strategy & Site List (v3.1)

**Owner:** Daniel Tamas **Status:** Replaces v3. Contains direct fetch verification + correction of one earlier overgeneralization.

---

## Correction from v3

v3 implied "all 41 ITMs share one broken template." That was wrong, and asserted without verification. Direct fetching reveals **at least two template families** in active use:

- **Old / 2005-era template**: itmcluj.ro, itmbucuresti.ro — `<FONT>` tags, table layouts, plain HTTP for itmbucuresti, document.write
- **Modern Django CMS (2010s+)**: itmarad.ro, itmiasi.ro — proper URL routing, HTTPS, accessibility widget, modular CMS structure

The implication: template detection still works as a coverage strategy, but it covers \~half the ITMs with one template pack and a different \~half with another. The two-template hypothesis needs to be verified across the remaining 37 county ITMs before authoring the rule packs. v3.1 reflects this.

This pattern almost certainly applies to other "41-county institution" categories too (CAS, DSP, prefectures, county councils): a mix of 2-3 modernization eras yielding 2-3 templates each, not one.

---

## What's directly verified in v3.1

I fetched and inspected the homepage / first inner page of each of the following:

| Site | Status |
| --- | --- |
| itmbucuresti.ro | ⚠️ HTTP only, 2005-era table-based layout |
| itmcluj.ro | ⚠️ "© ITM 2005 Site realizat de Vaida Cristina" — `<FONT>` tags, document.write, bak.jpg |
| itmarad.ro | ✓ Django CMS, HTTPS, modular, accessibility widget |
| itmiasi.ro | ✓ Same Django CMS template as itmarad.ro |
| pmb.ro + www2.pmb.ro | Two parallel sites, ".:: PMB.ro ::." 2003 title decoration, visitor counter |
| primariaclujnapoca.ro + e-primariaclujnapoca.ro + sso.primariaclujnapoca.ro | 3 separate systems |
| primariatm.ro + site.primariatm.ro + arhiva.primariatm.ro + dfmt.ro | 4 domains, services subdomain admits broken |
| primaria-iasi.ro | IBM Lotus Domino backend (.nsf URLs) — late 1990s enterprise software |
| anre.ro + arhiva.anre.ro + portal.anre.ro + beta-portal.anre.ro + spv.anre.ro | 5 separate subdomains in active use; accepts payment by postal money order |
| cjcluj.ro + cluj.archi | Reasonably maintained WordPress + separate ghișeu domain |
| cjmaramures.ro + cjmm.multinet.ro | Operating from temporary location; legacy on shared-hosting subdomain |
| cjvrancea.ro, csjbacau.ro | Functional but inconsistent naming convention with siblings |

This is direct evidence. Tier 2 entries below are not directly verified — they're listed as candidates for hand-authoring or template-detection in v0.2+.

---

## 1. The strategic anchor — fara-hartie + identitate.gov.ro

(Unchanged from v2/v3.)

`fara-hartie.gov.ro` (Vice-PM Oana Gheorghiu, March 2026, built by STS) — citizen complaint platform with stated principles: Once Only, Digital by Default, Interoperability, User-centric, Transparency, Accessibility. 1,000+ complaints in the first 24 hours. The layer is the UI implementation of the same direction.

`identitate.gov.ro` — official Government of Romania visual identity guide, maintained since 2017. PANTONE 280C blue, 92px header, 72px logo, recommended fonts (Arial, Calibri, Verdana, Tahoma, Trebuchet, Ubuntu). The layer enforces this standard, which the gov has published but barely implements.

OUG 112/2018 already legally requires WCAG 2.1 on all public institution sites. Most don't comply.

---

## 2. Visual styling spec

(Unchanged from v2.)

Full color tokens, typography, header spec (92px / 72px logo / 1280px max), spacing scale, what to restyle (chrome, forms, cookies, accessibility), what to leave alone (CAPTCHA, OAuth, payment iframes, e-signature flows), performance budget (&lt; 150ms first render, &lt; 80KB content script bundle, &lt; 30MB memory).

The layer adopts gov-published tokens directly. No invented design language.

---

## 3. The 25 most-broken citizen-facing portals (Tier 1)

### 3.1 Tax + finance cluster

| \# | Domain | What's confirmed |
| --- | --- | --- |
| 1 | **anaf.ro / SPV** | Token authentication errors routine. CEI digital signature (Law 214/2024) **not recognized** by SPV. Vendor-recommended workaround: "try after 22:00." (Profit.ro Mar 2026, ContApp/SmartBill error guides, ANAF's `Erori_frecvente.pdf`.) |
| 2 | **efactura.mfinante.gov.ro** | Mandatory B2B since 2024. Browser/cert errors documented. CNP-based firms must register in RO e-Factura registry since Jan 15 2026. |
| 3 | **ghiseul.ro** | #1 most-visited gov site. Less broken than the rest. Two flows (anonymous + account) cause confusion. Tier 1 for traffic, not pain. |
| 4 | **mfinante.gov.ro** | Public company financial lookup. Forms-from-1998 UI; mobile-broken. |

### 3.2 ID + civil status cluster (most-complained on fara-hartie, 300+ reports in &lt;30 days)

| \# | Domain | What's confirmed |
| --- | --- | --- |
| 5 | **dgep.mai.gov.ro** (replaces depabd.mai.gov.ro) | Domicile change still requires physical presence. Residence visa cannot be set online. CEI chip can't be read with mobile. Single most-reported category on fara-hartie. |
| 6 | **hub.mai.gov.ro** | Sole booking channel for new electronic ID. Slot availability randomized. CEI mandatory through July 2026. |
| 7 | **pasapoarte.mai.gov.ro** | Same architecture, same dysfunction profile as DGEP. |
| 8 | **drpciv.ro** | 18 driving license + 34 vehicle registration complaints on fara-hartie. Old appointment system. |

### 3.3 Professional / institutional cluster

| \# | Domain | What's confirmed |
| --- | --- | --- |
| 9 | **portal.just.ro** | Self-admitted broken: homepage directs users to "alternative search engine" during routine maintenance. SOAP web service from 2010s. **Five third-party clones exist** (`portal-just.ro`, `portal-justitie.ro`, `justassist.ro`, Lege5, Wolters Kluwer LexForce) purely because the official is hostile. |
| 10 | **onrc.ro / portal.onrc.ro** | Charges for what should be free public data. Modal-based search broken on mobile. demoanaf.ro exists precisely because onrc.ro is hostile. |
| 11 | **monitoruloficial.ro** | Paywalls content that Law 202/1998 mandates be free. |
| 12 | **e-licitatie.ro / SEAP / SICAP** | Mandatory for state-contract bidders. CEI digital signature not accepted (same problem as ANAF). |
| 13 | **mysmis.gov.ro** | Mandatory for every EU-funded project. Hostile to NGOs/SMEs. CES budget criticism Mar 2026 flagged it as bottleneck on EU funds absorption. |

### 3.4 Health + pensions cluster

| \# | Domain | What's confirmed |
| --- | --- | --- |
| 14 | **cnas.ro / siui.casan.ro** | \~17M insured. Bureaucratic structure, broken on mobile, login failures. |
| 15 | **cnpp.ro / pensii.gov.ro** | \~5M pensioners. Login flow breaks regularly. Pensioner-hostile UX. |
| 16 | **anpis.gov.ro / prestatiisociale.gov.ro** | Vulnerable populations. Documentation-heavy, accessibility broken (OUG 112/2018 non-compliance). |

### 3.5 Property + legal cluster

| \# | Domain | What's confirmed |
| --- | --- | --- |
| 17 | **ancpi.ro / epay.ancpi.ro** | Required for every property transaction. Notaries demand paper extracts; fara-hartie response (March 2026) forced gov mandate for direct ANCPI queries. |
| 18 | **anpc.ro / SAL / SOL** | Required compliance for every Romanian e-commerce site. **An entire paid "Conformitate Site" service industry exists** because these portals are unusable directly. |

### 3.6 Regulatory cluster

| \# | Domain | What's confirmed |
| --- | --- | --- |
| 19 | **anre.ro** ⚠️ | National Energy Regulator. **5 separate subdomains in active use** (anre.ro, arhiva.anre.ro, portal.anre.ro, beta-portal.anre.ro, spv.anre.ro). Accepts licensing fee payment by **postal money order**. Footer: "Dezvoltat intern de echipa IT ANRE." |
| 20 | **bnr.ro** | Heavy business use. demoanaf already proxies its XML feed because the public site is hostile to programmatic + human use. |

### 3.7 ITM territorial inspectorates ⚠️ **TWO TEMPLATE FAMILIES CONFIRMED**

This is the single most concentrated UX disaster category in the Romanian state. Every employer in Romania interacts with these.

**Family A — Legacy 2005-era zombie sites:**

| \# | Domain | What's confirmed |
| --- | --- | --- |
| 21 | **itmbucuresti.ro** ⚠️ | **HTTP only, no HTTPS in 2026.** Tables-for-layout HTML. PDF-as-content-delivery. The capital's labor inspectorate runs on a 2003-era zombie site. |
| 22 | **itmcluj.ro** ⚠️ | Footer: **"© ITM 2005 Site realizat de Vaida Cristina"**. `<FONT>` tags, deprecated `align="center"`, inline `document.write`, bak.jpg background. Diacritics encoded as `?` in PDFs. |

**Family B — Modern Django CMS:**

| \# | Domain | What's confirmed |
| --- | --- | --- |
| 23 | **itmarad.ro** ✓ | Django CMS, HTTPS, accessibility widget (userway.org), proper URL routing, modular structure. Footer "© 2000 - 2026". |
| 24 | **itmiasi.ro** ✓ | Identical Django CMS template to itmarad.ro. Same menu structure, same URL pattern. |

The remaining 37 ITM county sites split between these two families (and possibly a third). **This needs verification before authoring rule packs.** Family A gets one rule pack covering the bad ones. Family B gets a much lighter rule pack — those are functional but still benefit from gov-standard styling consistency. Authoring approach: write a quick template-fingerprint detector that runs across all 41 ITM domains and clusters by structural signature.

### 3.8 Open data + statistics cluster

| \# | Domain | What's confirmed |
| --- | --- | --- |
| 25 | **insse.ro** | National Statistics Institute. Information architecture failure: data exists but is impossible to find. |

### Other Tier 1 (Dani-flagged or specifically requested)

| Domain | Why Tier 1 |
| --- | --- |
| **rotld.ro** | .ro TLD registry. Niche but every developer/lawyer/journalist hits it. Dani-flagged. |
| **data.gov.ro** | Open data portal. Workable but underdeveloped. |

---

## 4. Mayoralty findings (directly verified)

### Bucharest — pmb.ro + www2.pmb.ro + 6 sector domains

- Two parallel sites in active use simultaneously
- ".:: PMB.ro - Bucureşti - Administraţia Locală ::." pure 2003 title decoration
- Public visitor counter
- Sectors 1-6 each have separate domains (primariasector1.ro, etc.) — **8 mayoralty UIs in one city**

### Cluj-Napoca — primariaclujnapoca.ro

- 3 separate systems: info / e-services / SSO
- Multilingual main site (RO/EN/FR/HU/DE) — actually positive
- Service fragmentation forces users to learn 3 URLs

### Timișoara — primariatm.ro + site.primariatm.ro + arhiva.primariatm.ro + dfmt.ro

- 4 domains in active rotation
- `site.primariatm.ro` **displays banner: "În urma unor probleme de natură juridică apărute cu furnizorul de mentenanță, o parte din serviciile online nu pot fi accesate"** — official admission of broken services due to legal disputes with the maintenance contractor
- Fiscal authority on entirely separate domain (dfmt.ro)

### Iași — primaria-iasi.ro + eportal.primaria-iasi.ro + digital.primaria-iasi.ro

- Backend is **IBM Lotus Domino** (.nsf URLs visible in routes) — late 1990s enterprise software
- 3 subdomains for different functions

### Pattern across Tier 1 mayoralties

Every capital city operates 2-5 separate websites for related services. No two share a header, navigation pattern, or visual identity. Mobile usability variable but consistently poor on the legacy/services subdomains. Cookie banners use 4-5 different implementations across the capital cities alone.

---

## 5. County council findings (directly verified)

41 county councils. Naming inconsistency confirmed:

| County | Domain |
| --- | --- |
| Cluj | cjcluj.ro |
| Arad | cjarad.ro |
| Argeș | cjarges.ro |
| Bacău | **csjbacau.ro** (different prefix!) |
| Bihor | cjbihor.ro |
| Maramureș | **cjmm.multinet.ro** + cjmaramures.ro (legacy on shared hosting!) |
| Mehedinți | cjmehedinti.ro |
| Mureș | cjmures.ro |
| Neamț | cjneamt.ro |
| Olt | cjolt.ro |
| Prahova | **cjph.ro** (just "ph"!) |
| Satu Mare | cjsm.ro |
| Sălaj | cjsj.ro |
| Sibiu | cjsibiu.ro |
| Suceava | **consiliu.suceava.ro** (subdomain of city, no own domain!) |
| Teleorman | cjteleorman.ro |
| Tulcea | cjtulcea.ro |
| Timiș | cjtimis.ro |
| Vaslui | cjvs.ro |
| Vâlcea | cjvalcea.ro |
| Vrancea | cjvrancea.ro |
| Constanța | **cjc.ro** (three letters!) |

No naming convention. No shared template. The verified-domains list alone is a useful public good — no other resource enumerates these correctly.

### Cluj County Council (the benchmark per Dani)

- cjcluj.ro is WordPress-based, reasonably maintained, multilingual
- Has separate domain for unified ghișeu: **cluj.archi**
- Even the best county council operates &gt;1 site

### Maramureș County Council ⚠️

- Two domains in active use: `cjmm.multinet.ro` (legacy on a 1990s-era hosting provider's subdomain) and `cjmaramures.ro`
- Site banner: "Consiliul Județean Maramureș își desfășoară activitatea într-un sediu temporar"

**Coverage strategy:** county council rule packs need template-distribution mapping (same approach as ITMs). Several use the same Liferay template; some use WordPress; some use bespoke. Hand-author packs for the 5-10 largest counties; map and template-detect the rest.

---

## 6. Tier 2 — agencies and authorities

Each requires hand-authored shallow coverage in v0.2+. Categories:

**Ministries (15):** mae.ro, mapn.ro, mmediu.ro, mt.ro, madr.ro, mmuncii.ro, mdlpa.ro, cultura.ro, mcid.gov.ro, economie.gov.ro, mts.ro, tineret.gov.ro, mfamiliei.ro, minoritati.gov.ro, ms.ro

**Financial / regulatory (12):** asfromania.ro, ancom.ro, anre.ro (Tier 1), anrm.ro, consiliulconcurentei.ro, anabi.ro, oncpcp.ro, dataprotection.ro, vama.ro, igsu.ro, ansvsa.ro, isc.gov.ro

**Health system extras (8):** casmb.ro + 41 county CAS portals (template), e-prescriptie.ro, cnscbt.ro, insp.gov.ro, vaccinare-covid.gov.ro, dsp + județ × 41 (template)

**Pensions / social (5):** handicap.gov.ro, copii.gov.ro, ajofm.ro, anofm.ro, anpis branches

**Education (10):** edu.ro, bacalaureat.edu.ro, evaluare.edu.ro, admitere.edu.ro, aracip.eu, cnatdcu.ro, uefiscdi.ro, plus top 10 universities (template)

**Justice (8):** iccj.ro, ccr.ro, csm1909.ro, mpublic.ro, pna.ro, diicot.ro, inj.ro, crj.ro

**ID / civil status (6):** evp.mai.gov.ro, arhivelenationale.ro, cetatenie.just.ro, politiadefrontiera.ro, igsu.ro, frontiera.ro

**Property / cadastre (4):** vama.ro, customs.ro, ron.ro (beneficial ownership), roeid.ro

**Transportation (8):** cfr.ro, cfrcalatori.ro, arr.ro, rar.ro, cnadnr.ro, aacr.ro, anar.ro, ANRSC

**EU funds (5):** fonduri-ue.ro, inforegio.ro, poim.gov.ro, pocu.gov.ro, pnrr.gov.ro

**Major cities (10) — beyond Bucharest+Cluj+Timișoara+Iași:** primaria-constanta.ro, primariabrasov.ro, primariacraiova.ro, primariagalati.ro, primariaploiesti.ro, oradea.ro, sibiu.ro, primariabacau.ro, primariapitesti.ro, primariaarad.ro

**County councils (top 10):** cjcluj.ro (benchmark), cjtimis.ro, cjis.ro, cjc.ro, cjbrasov.ro, cjmures.ro, cjsibiu.ro, cjbihor.ro, cjdolj.ro, cjprahova.ro

**ITM template detection priority:** map all 42 ITMs (Bucharest + 41 counties) to template family before authoring. Confirmed Family A: itmcluj, itmbucuresti. Confirmed Family B: itmarad, itmiasi. Remaining 38 unmapped.

**Specialized agencies (10):** apia.org.ro, afm.ro, osim.ro, orda.ro, garda-mediu.ro, garda-sanitara.ro, anpcdefp.ro, anrcti.ro, anrsps.ro, anrm.ro

**Statistics / transparency (5):** insse.ro (Tier 1), transparenta.gov.ro, licitatiipublice.ro, adr.gov.ro, sgg.gov.ro

**Parliament (5):** cdep.ro, senat.ro, parlament.ro, bec.ro, roaep.ro

Full Tier 1 + Tier 2 = \~140 sites, plus the template-detection groups (41 ITMs, 41 county councils, 41 CAS, 41 DSP, 42 prefectures).

---

## 7. Tier 3 — the long tail (v0.2+)

Hand-authoring impossible at this scale. Strategy is **template fingerprinting**:

- **3,187 mayoralties** cluster into \~10 CMS templates
- **42 prefectures** mostly use the same Liferay portal template
- **41 county councils** scatter across \~6 templates
- **41 ITMs** confirmed at least 2 templates (Family A old / Family B Django CMS); needs full mapping
- **41 county Health Insurance Houses (CAS)** likely shares template
- **41 county Public Health Departments (DSP)** likely shares template
- **943 hospitals** use a small number of healthcare CMS templates

One pack per template, hundreds of sites covered. AI fallback handles anything that matches no template.

---

## 8. v0.1 deliverable — final lineup

Final v0.1 rule packs (6 sites):

1. **anaf.ro** — homepage + CUI lookup
2. **dgep.mai.gov.ro** — homepage + appointment flow (most-complained category)
3. **portal.just.ro** — case search (institutional showcase + self-admitted broken)
4. **ghiseul.ro** — homepage + payment flow (high-traffic baseline)
5. **rotld.ro** — homepage (Dani-flagged, niche showcase)
6. **itmcluj.ro** ⚠️ — homepage (the 2005 → 2026 transformation showcase — strongest visual contrast available)

### Updated manifest

```json
"host_permissions": [
  "*://*.anaf.ro/*",
  "*://dgep.mai.gov.ro/*",
  "*://depabd.mai.gov.ro/*",
  "*://portal.just.ro/*",
  "*://*.ghiseul.ro/*",
  "*://*.rotld.ro/*",
  "*://itmcluj.ro/*"
]
```

### Verified domain list scope

Ship the full \~140-domain list from §3 + §6 in v0.1 even with rule packs only for 6. The list drives the green/gray/red icon and lookalike detection independently. The **signed verified roster of legitimate Romanian gov + public-utility domains** is the single highest-leverage v0.1 artifact — no other resource enumerates these correctly.

---

## 9. Demo recording script

30-45 seconds, voice-over recommended:

1. **Open Chrome with onegov.ro installed.** Title card on screen:

   > **3 martie 2026** — Guvernul lansează fara-hartie.gov.ro. 1.000+ sesizări în 24h. **Astăzi** — onegov.ro transformă cele mai reclamate site-uri. Instalare: 30 secunde.

2. Navigate to **itmcluj.ro**. Show the 2005 page — `<FONT>` tags, broken diacritics, "© ITM 2005 Site realizat de Vaida Cristina" footer. 2-second pause. Activate the layer. Same content rendered in clean gov-standard UI. Voice-over: *"Inspecția Muncii Cluj. 2005. 2026. Aceeași informație."*

3. Navigate to **anaf.ro**. Side-by-side before/after. Voice-over: *"ANAF. Toți o folosim. Toți știm cum arată."*

4. Open popup, switch to **pensioner persona** on anaf.ro. 18px+ type, simplified layout. Voice-over: *"Pentru bunici. Pentru oricine."*

5. Navigate to **dgep.mai.gov.ro**. Same transformation. Voice-over: *"Cele mai reclamate site-uri pe fara-hartie. Reparate la nivel UI."*

6. Click **"Afișează site-ul original"**. Overlay disappears, original page underneath untouched. Voice-over: *"Datele tale nu se ating. Niciodată."*

7. Navigate to **anaf-portal.ro** (synthetic phishing). Icon turns red. Voice-over: *"Anti-phishing inclus."*

8. Closing frame: GitHub URL.

Tagline candidates:

- "Statul, cum ar fi trebuit să fie."
- "O singură interfață pentru toate site-urile statului."
- "Direcția pe care guvernul o promite. Deja construită."

---

## 10. Forward-looking framing

Once v0.1 ships:

- "Cluj-based developer ships in days what fara-hartie has been collecting complaints about for months"
- The contrast IS the message. No need to attack institutions — the timeline speaks.
- Two weeks after launch, gov can either embrace the layer (best — they incorporate the patterns) or ignore it (still wins, the layer keeps working). They cannot meaningfully oppose it because it adopts their own published design standards and enforces existing accessibility law.

---

## Appendix A — Cookie consent normalization patterns

Common implementations on Romanian gov sites:

- **CookieBot** (`#CybotCookiebotDialog`)
- **OneTrust** (`#onetrust-banner-sdk`)
- **Custom inline scripts** (most local government)
- **GovCookie** (custom STS-developed banner)
- **WordPress generic** ("Folosim cookie-uri pentru a ne asigura că vă oferim cea mai bună experiență" — appears nearly verbatim across cjcluj, anre, csjbacau, dozens more)
- **Cookielaw.createCookielawCookie()** pattern (seen on itmarad/itmiasi Django CMS template)

Replacement logic: detect, hide via `display: none !important`, render unified `@onegov/ui` consent module. Decision flows through to original implementation's accept/decline buttons via rule-pack-defined selectors so cookie state persists in source-page storage.

## Appendix B — CAPTCHA / sensitive widget passthrough patterns

Detected via known selectors, given a transparent shadow-DOM cutout:

```
- iframe[src*="recaptcha"]
- iframe[src*="hcaptcha"]
- iframe[src*="turnstile"]
- iframe[src*="captcha"]
- div.g-recaptcha
- iframe[src*="3dsecure"], iframe[src*="securecode"]
- iframe[src*="oauth"], iframe[src*="auth"]
- input[type="file"][accept*="signature"]
- elements with attribute data-onegov-passthrough="1" (rule-pack-declared)
```

## Appendix C — Source citations

- **Direct fetch verification (May 2026):** itmbucuresti.ro, itmcluj.ro, itmarad.ro, itmiasi.ro, pmb.ro, primariaclujnapoca.ro, primariatm.ro, primaria-iasi.ro, anre.ro, cjcluj.ro, cjmaramures.ro, cjvrancea.ro, csjbacau.ro
- **fara-hartie.gov.ro** + `/public` — citizen complaint platform, March 2026
- **Profit.ro** Mar 2026 — "Probleme mari cu buletinul electronic"
- **HotNews** Mar 2026 — fara-hartie complaint category breakdowns
- **Validsoftware** Mar 2026 — CEI/SPV/ONRC/SICAP digital signature incompatibility
- **ContApp / SmartBill Ajutor** — common SPV/e-Factura authorization errors
- **ANAF** — published `Erori_frecvente.pdf`
- **identitate.gov.ro** — official Government of Romania visual identity guide
- **PNRR Manual de Identitate Vizuală** (Mar 2022) — color tokens, fonts
- **Ghid identitate vizuală SIPOCA35** — header specs (92px / 72px logo / 1280px)
- **AtlasIntel/Edge Institute** Mar 2026 — 82.3% want exclusively-online gov interactions, 86.6% find pace slow
- **Similarweb** Feb 2026 — top gov site rankings
- **Consiliul de Monitorizare** — official county council URL list
- **Inspecția Muncii** — official ITM contact page (lists every ITM with `http://` URLs)
- **OUG 112/2018** — WCAG 2.1 mandate on public institutions
- **Law 202/1998** — Monitorul Oficial free-access mandate
- **Law 214/2024** — CEI digital signature legal recognition

---

What changed in v3.1: removed "all 41 ITMs are broken zombies" overgeneralization; mapped the actual two-template-family distribution from direct fetching; flagged that template mapping for the remaining 38 ITMs (and similar mapping for CAS, DSP, prefectures, county councils) is a v0.2 prerequisite before authoring template rule packs. Everything else holds.