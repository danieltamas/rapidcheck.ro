# Security Policy & Reviewer Playbook

This file is two things:

1. The **public security policy** for the open-source onegov.ro project — how to report a vulnerability.
2. The **internal reviewer playbook** — what every code reviewer must check before approving a PR.

---

## Reporting a Vulnerability

If you believe you have found a security vulnerability in onegov.ro (the WebExtension, the rule packs, or the verified-domain roster), please report it **privately and responsibly**:

- **Email:** `security@onegov.ro` (preferred) or `hello@danieltamas.ro`
- **Subject:** `[security] <short description>`
- **PGP:** key fingerprint published in `docs/security-pgp.txt` (when available)
- **Do not file a public GitHub issue** for vulnerabilities until a fix has shipped and you have been given the go-ahead.

We will acknowledge within 72 hours and aim to ship a fix or mitigation within 14 days for critical issues.

### What we consider in scope

- Bypasses of the five invariants (DOM mutation, form-data exfiltration, remote code execution, network exfiltration, escape-hatch failure)
- Phishing-detection failures (false negatives that would let `lookalike` domains slip through as `verified`)
- Rule-pack content that could be used to defame, mislead, or manipulate users
- Permission scope creep that would let the extension act outside its declared `host_permissions`
- Supply-chain risks in the build pipeline or dependencies
- Verified-domain-roster poisoning (PRs adding non-government or malicious domains)

### What we consider out of scope

- Issues in third-party Romanian government sites themselves (report those to the operating institution; we may flag them in `SITES_COVERAGE.md`)
- Theoretical issues without a working proof-of-concept against a current build
- Self-XSS or attacks requiring the user to install a malicious extension alongside onegov.ro
- DoS attacks against gov sites by misuse of the extension

---

# Reviewer Playbook (Internal)

**Read this before approving any PR.**

onegov.ro is a browser-extension UX layer with a privacy-first, supply-chain-cautious, no-remote-code design. The five invariants from `CLAUDE.md` define the security posture; everything below is how to verify they still hold.

---

## Threat Model Summary

| Asset | Threat | Mitigation |
| --- | --- | --- |
| User browsing data on gov sites | Extension exfiltrating it | Invariant #4 (no network) + `host_permissions` minimisation + reviewer check on every PR |
| Original page DOM (forms, sessions) | Extension mutating it | Invariant #1 (closed shadow root, sibling mount) + DOM-integrity E2E test |
| Form submissions | Extension intercepting/altering | Invariant #2 (read-only in v0.1) + lint rule blocking `form.*` write access |
| Extension itself | RCE via rule packs or remote code | Invariant #3 (declarative JSON only, no `eval`/`Function`/`innerHTML` with rule data) + lint rules |
| Lookalike-domain users | Phishing slipping past as `verified` | Lookalike algorithm (Levenshtein + IDNA + TLD swap) + ≥20 test cases + `_verified-domains.json` curation discipline |
| Verified-domain roster | Malicious PR adding bad domain | All additions reviewed by maintainer, must include sourced URL evidence |
| Build pipeline | Supply-chain compromise | Lockfile committed, `bun audit` in CI, no `postinstall` scripts, dependency adds require approval |
| User trust | Extension silently changing behaviour | Open source, reproducible builds, signed releases (v0.2+) |

---

## Hard Checks (any failure = REJECT)

### 1. The Five Invariants

- [ ] **Original DOM untouched.** The DOM-integrity E2E test (`e2e/dom-integrity.spec.ts`) passes. The diff between `documentElement.outerHTML` before and after activation contains only `<div id="onegov-root">…`. No mutation observers writing back. No removed nodes. No attribute edits.
- [ ] **No form data read or written.** Grep the diff for `HTMLFormElement`, `FormData`, `form.submit`, `input.value`, `.elements`, `requestSubmit`. Any access to form internals must be justified in the PR description and limited to read-only event observation if absolutely required.
- [ ] **No remote code execution.** Grep for `eval`, `new Function`, `setTimeout('`, `setInterval('`, `innerHTML =`, `outerHTML =`, `document.write`, `<script` insertion, `import(` with non-literal arguments. None of these may operate on rule-pack-derived data.
- [ ] **No external network requests.** Grep for `fetch(`, `XMLHttpRequest`, `navigator.sendBeacon`, `WebSocket(`, `EventSource(`. The only allowed `fetch` is against `chrome.runtime.getURL(...)` for bundled assets. The network-audit E2E test passes.
- [ ] **Escape hatch works.** "Afișează site-ul original" toggle hides the shadow host; original page is untouched and interactive. Manual verification on at least one verified domain.

### 2. Permission & Scope Discipline

- [ ] **No new `host_permissions`** without explicit orchestrator approval and justification in the PR description. Each entry is an attack-surface expansion and a Web-Store review trigger.
- [ ] **No new `permissions`** in the manifest. The v0.1 set is `storage`, `scripting`, `activeTab`, `webNavigation`. Adding any others (especially `<all_urls>`, `cookies`, `webRequest`, `tabs`, `history`) requires a written threat-model update.
- [ ] **`web_accessible_resources` stays narrow.** Only `rule-packs/*.json` is exposed. Never expose JavaScript, never expose binary assets, never expose `manifest.json`.
- [ ] **`content_scripts.matches` matches `host_permissions`.** No content script may run on a domain not in the verified roster.

### 3. Cross-Package Boundary

- [ ] **No `chrome.*` / `browser.*` outside `packages/extension`.** Lint rule enforces this; CI fails if violated.
- [ ] **No `document.*`, `window.*` direct access outside the extension content script.** UI components operate on a `ShadowRoot` they're given.
- [ ] **`@onegov/core` remains DOM-free.** Importing it must work in a Node environment with no globals.

### 4. Rule-Pack Safety

- [ ] All packs validate against `rule-packs/schema.json` (Zod).
- [ ] Selectors do not use `:has(script)` or other selectors that could trigger unexpected page-side computation.
- [ ] Persona overrides reference `extract.id`s that exist in the same route.
- [ ] Pack `domain` field matches the file name's eTLD+1.
- [ ] Pack does not include keys not in the schema (Zod `.strict()` enforced).

### 5. Verified-Domain Roster Hygiene

- [ ] Every new entry has a `source` URL pointing to public evidence the domain is operated by a Romanian public institution or is a sanctioned public-interest service.
- [ ] No commercial vendor sites added (e.g. notary marketplaces, accounting SaaS).
- [ ] No domains the maintainer has not personally verified.
- [ ] `version` field bumped on every change.
- [ ] Lookalike test suite re-run; no false positives introduced against existing entries.

---

## Quality Checks (warnings, not blockers)

### Input handling

- [ ] Hostnames are normalised (lowercased, trimmed, IDN-decoded) before verification
- [ ] Pathname matching uses `RegExp` with explicit anchors; no untrusted `pattern` evaluated against attacker-controlled URLs without source review
- [ ] Storage reads handle missing keys gracefully (default to `'standard'` persona)

### Frontend XSS prevention

- [ ] Preact's default JSX escaping is used everywhere
- [ ] No `dangerouslySetInnerHTML`
- [ ] Text content from extracted page nodes is treated as untrusted (rendered as text, never as HTML)
- [ ] URL attributes (`href`) are validated to be `http(s):`, `mailto:`, or `tel:` schemes only — never `javascript:`

### Logging & telemetry

- [ ] No `console.log` statements that include user-identifiable data, page URLs, or extracted content in a release build
- [ ] No analytics SDK
- [ ] No error reporter that phones home (no Sentry, no Bugsnag, no Rollbar, no DSN)
- [ ] No remote feature flags

### Supply chain

- [ ] No new runtime dependencies added without orchestrator approval (and a one-paragraph justification + license check in the PR)
- [ ] `bun.lockb` is committed and consistent
- [ ] `bun audit` shows no high or critical issues
- [ ] No `postinstall`, `preinstall`, or `prepare` scripts in any new dependency without inspection
- [ ] No copy-pasted code from unverified sources

### CSP / Manifest

- [ ] `content_security_policy` (if specified) does not include `'unsafe-eval'` or `'unsafe-inline'` (beyond what MV3 mandates)
- [ ] No `externally_connectable` unless explicitly required
- [ ] `browser_specific_settings.gecko.id` matches the published Firefox extension ID (no impersonation)

---

## How to Scan a PR

```bash
# Network exfil patterns
grep -rn -E "fetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource" packages/ --include='*.ts' --include='*.tsx' \
  | grep -v "chrome.runtime.getURL"

# RCE patterns
grep -rn -E "\beval\b|new Function|innerHTML\s*=|outerHTML\s*=|document\.write" packages/ --include='*.ts' --include='*.tsx'

# String-based timers
grep -rn -E "setTimeout\(['\"]" packages/ --include='*.ts' --include='*.tsx'
grep -rn -E "setInterval\(['\"]" packages/ --include='*.ts' --include='*.tsx'

# Form-data access
grep -rn -E "FormData|HTMLFormElement|\.requestSubmit\(|form\.submit\(|\.elements\b" packages/ --include='*.ts' --include='*.tsx'

# chrome.* outside packages/extension
grep -rn -E "\bchrome\.|\bbrowser\.(runtime|storage|tabs|action|webNavigation)" packages/core/ packages/ui/ --include='*.ts' --include='*.tsx'

# dangerouslySetInnerHTML
grep -rn dangerouslySetInnerHTML packages/ --include='*.tsx'

# Manifest diff sanity
git diff main -- packages/extension/src/manifest.json

# Verified-domain roster diff
git diff main -- rule-packs/_verified-domains.json
```

---

## Audit Log

| Date | Scope | Reviewer | Findings |
|------|-------|----------|----------|
| (none yet) | | | |

Append every formal security review here, even if no issues were found.
