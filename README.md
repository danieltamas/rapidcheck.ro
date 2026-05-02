# onegov.ro

> A universal UX layer over Romanian government portals.
> Manifest V3 WebExtension. Chrome + Firefox. Privacy-first. MIT.

onegov.ro transforms Romania's public-service websites into a unified, persona-adapted UI **without touching the underlying form data, sessions, or submissions**. The original page stays intact underneath; the extension renders a clean overlay in a closed shadow root and gets out of the way the moment you ask.

The idea: the Romanian government has already published its visual identity standard ([identitate.gov.ro](https://identitate.gov.ro)) and is legally required ([OUG 112/2018](https://lege5.ro/Gratuit/gmytinjvgyzq/ordonanta-de-urgenta-nr-112-2018-pentru-modificarea-si-completarea-ordonantei-guvernului-nr-27-2002-privind-reglementarea-activitatii-de-solutionare-a-petitiilor)) to make public-institution sites WCAG-2.1 accessible. Most don't comply. onegov.ro is the wedge that enforces the standard the state has already promised.

---

## Status

**v0.1 — pre-release.** See [`SPEC.md`](./SPEC.md) for the execution plan and [`SITES_COVERAGE.md`](./SITES_COVERAGE.md) for the verified site inventory.

Six rule packs ship in v0.1: `anaf.ro`, `dgep.mai.gov.ro`, `portal.just.ro`, `ghiseul.ro`, `rotld.ro`, `itmcluj.ro`. The verified-domain roster covers \~140 Romanian public-sector domains and powers green/gray/red phishing detection independently of rule-pack coverage.

---

## How it works (30 seconds)

1. You navigate to a Romanian gov site.
2. The extension checks the hostname against a curated roster of verified Romanian public-sector domains.
   - **Green** → site is verified, rule pack found → renders the unified overlay
   - **Gray** → off-list → does nothing
   - **Red** → lookalike (Levenshtein ≤ 2, Cyrillic homograph, or TLD swap) → warns you
3. The overlay mounts in a **closed shadow root**. Page CSS can't reach in; page JS can't enumerate it. The original DOM is untouched.
4. Pick a persona in the popup (`pensioner`, `standard`, `pro`, `journalist`) — the layout adapts.
5. Click "afișează site-ul original" any time and the overlay disappears. The actual page is still there, untouched, fully functional.

---

## Install (developer / pre-release)

```bash
git clone https://github.com/danieltamas/onegov.ro.git
cd onegov.ro
npm install
npm run build
```

**Chrome:** `chrome://extensions` → enable Developer mode → Load unpacked → select `dist/extension/`.

**Firefox:**

```bash
cd packages/extension
npx web-ext run --source-dir ../../dist/extension/
```

Or `about:debugging` → This Firefox → Load Temporary Add-on → pick `dist/extension/manifest.json`.

Once v0.1 is signed (v0.2 milestone) the extension will be available on the Chrome Web Store and Firefox Add-ons.

---

## What this is NOT

- **Not a scraper.** It does not mirror, copy, or republish gov-site content. Everything renders on top of the live page in your browser.
- **Not a proxy.** It does not route your traffic anywhere. There are zero outgoing network requests beyond loading bundled assets in v0.1.
- **Not a backend.** No accounts. No telemetry. No analytics. No cookies. No logging that leaves your machine.
- **Not a form filler.** v0.1 is read-only by design. v0.2 will introduce form bridging via the original DOM (so CSRF tokens, sessions, and anti-bot fingerprints flow untouched).
- **Not a replacement portal.** The official sites stay official. onegov.ro is a UX layer; the data, the auth, the legal trust all live with the institution.

---

## Repository layout

```
.
├── packages/
│   ├── core/         # DOM-free pure TypeScript (verifier, lookalike, extractor, schema)
│   ├── ui/           # Preact components + 4 persona variants + theme tokens
│   └── extension/    # MV3 shell: background, content script, popup, manifest
├── rule-packs/       # Declarative JSON rule packs + verified domain roster
├── e2e/              # Playwright cross-browser tests
├── jobs/             # Job specs, DONE/REVIEW reports (multi-agent dev workflow)
├── docs/             # ARCHITECTURE.md, LOG.md
├── scripts/          # build, package, gen-icons, validate-packs
├── SPEC.md           # v0.1 execution plan
├── SITES_COVERAGE.md # Verified Romanian gov site inventory + coverage strategy
├── CLAUDE.md         # Agent operating manual (multi-agent dev workflow)
├── ONSTART.md        # Agent boot procedure
├── CODING.md         # Engineering patterns
├── TESTING.md        # Test guide
├── SECURITY.md       # Security policy + reviewer playbook
├── CONTRIBUTING.md   # How to contribute (rule packs, code, verified domains)
└── LICENSE           # MIT
```

---

## Contributing

onegov.ro is community-extensible. The two highest-leverage contributions:

1. **Write a rule pack** for a Romanian gov site that's badly designed. See [`CONTRIBUTING.md`](./CONTRIBUTING.md#authoring-a-rule-pack).
2. **Add to the verified-domain roster.** Catching one more lookalike attack is a public good. See [`CONTRIBUTING.md`](./CONTRIBUTING.md#extending-the-verified-domain-roster).

Code contributions also welcome — read `CONTRIBUTING.md`, `CODING.md`, and `TESTING.md` first. The five invariants in `CLAUDE.md` are non-negotiable: any PR that weakens them will be rejected on sight, regardless of test results.

---

## Security

If you've found a vulnerability, please **report privately** — see [`SECURITY.md`](./SECURITY.md) for our responsible-disclosure policy. Do not file public issues for security bugs until a fix has shipped.

---

## License

MIT — see [`LICENSE`](./LICENSE).

---

## Author

Built by [Daniel Tamas](https://danieltamas.ro) in Cluj-Napoca, Romania.
