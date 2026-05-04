# RapidCheck.ro

RapidCheck.ro is an open-source Chrome extension that helps people in Romania avoid phishing and risky forms.

It checks the domain you are visiting against a bundled directory of verified public institutions, banks, utilities, telecom operators, delivery companies, and other services. If a page looks suspicious, RapidCheck warns you before you trust it or send sensitive data.

## What it does

- Shows whether the current website is verified, unknown, or a lookalike of a trusted domain.
- Warns before sensitive data such as CNP, CUI, IBAN, card details, email, or phone numbers are submitted on risky pages.
- Highlights official search results where supported.
- Uses bundled verification data for domain checks. No accounts, analytics, telemetry, cookies, or remote logging.
- Ships with a transparent, auditable directory and rule packs.

## How verification works

RapidCheck does not ask a server whether the current page is safe. The extension ships with a local verified-entity directory in `packages/directory/data/entities.json` and a compatibility domain roster in `rule-packs/_verified-domains.json`.

At runtime:

1. The background worker builds an in-memory roster from the bundled directory and rule-pack data.
2. The current hostname is normalized to its registrable domain.
3. Exact matches and subdomains of verified domains are marked verified.
4. Lookalikes are detected locally with homograph normalization, TLD-swap checks, and Levenshtein-distance checks.
5. The content script warns before sensitive data is submitted from unknown or suspicious pages.

The directory has a build-time Merkle root in `packages/core/src/merkle-root.ts`. `scripts/compute-merkleroot.ts` hashes each verified entity, pair-hashes the list into a single SHA-256 root, embeds that root into the extension build, and publishes `_merkleroot.json` for the public directory.

The extension can also update its data without a Chrome Web Store release. On background status requests, it may fetch:

- `https://raw.githubusercontent.com/danieltamas/rapidcheck.ro/main/_merkleroot.json`
- `https://raw.githubusercontent.com/danieltamas/rapidcheck.ro/main/packages/directory/data/entities.json`

It validates the downloaded directory against the downloaded Merkle root, caches the verified directory in `chrome.storage.local`, and uses it for domain checks. If the remote fetch fails or the root does not match, RapidCheck falls back to the bundled directory.

Important: the embedded root is not what updates users. It is the fallback build fingerprint. New URLs reach users through the verified remote directory cache. The bundled fallback still changes only when the extension is rebuilt and updated by the browser.

## Install for development

```bash
git clone https://github.com/danieltamas/rapidcheck.ro.git
cd rapidcheck.ro
bun install
bun run build
```

Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `dist/extension`.

## Scripts

```bash
bun run check
bun run test
bun run build
bun run validate-packs
bun run gen-icons
```

## Repository layout

```text
.
├── index.html          # public landing page
├── packages/core       # domain checks, lookalike detection, risk scoring
├── packages/directory  # verified entity directory and schema
├── packages/extension  # Chrome Manifest V3 extension
├── rule-packs          # bundled verification data
└── scripts             # build, icon, pack validation, Merkle root tools
```

## Privacy

RapidCheck is designed as a local-first browser tool. Domain checks and sensitive-data checks run inside the extension. Remote directory updates request only the public root file and public directory file from the project repository; those requests do not include the page URL, form fields, browsing history, warnings, or search text.

## Security

Please report security issues privately to Daniel Tamas at `hello@danieltamas.com`.

## Author

Built by [Daniel Tamas](https://danieltamas.com/).

## License

MIT. See [LICENSE](./LICENSE).
