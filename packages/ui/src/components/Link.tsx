/**
 * Link — sanitises hrefs as a security boundary.
 *
 * Only `http:`, `https:`, `mailto:`, `tel:` schemes pass through. Everything
 * else (including `javascript:`, `data:`, `vbscript:`, `file:`, and any
 * unparseable input) is rendered as plain text. Treat this like input
 * validation in a server: scheme allowlist, no exceptions.
 *
 * Rule-pack-supplied text is rendered through JSX (escaped). The href that
 * survives validation is set via Preact prop, never via `innerHTML`.
 */

import type { Persona } from '@onegov/core';

const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Returns the href if its scheme is in the allowlist, else `null`.
 *
 * Strategy: parse with `URL` for `http(s):` (catches malformed authority,
 * Punycode normalisation). For `mailto:` / `tel:` accept anything after the
 * scheme — they're flat strings without authority.
 */
export function sanitizeHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return null;

  // Scheme-relative URLs (//example.com) inherit the page scheme. We treat
  // them as http(s) — but since we have no document context here, reject so
  // the caller is forced to spell out the scheme.
  if (trimmed.startsWith('//')) return null;

  // Match the scheme prefix (lowercase). Anything that doesn't look like
  // `<scheme>:` falls through to the absolute-vs-relative branch.
  const schemeMatch = /^([a-z][a-z0-9+\-.]*):/i.exec(trimmed);
  if (schemeMatch) {
    const scheme = `${schemeMatch[1]?.toLowerCase() ?? ''}:`;
    if (!ALLOWED_SCHEMES.has(scheme)) return null;

    if (scheme === 'http:' || scheme === 'https:') {
      try {
        const parsed = new URL(trimmed);
        return parsed.toString();
      } catch {
        return null;
      }
    }
    // mailto: / tel: — accept the rest verbatim after a basic shape check.
    return trimmed;
  }

  // Relative URL (no scheme). Allow site-relative paths only — no protocol-
  // relative ones (handled above) and no obviously dangerous prefixes.
  if (trimmed.startsWith('/') || trimmed.startsWith('?') || trimmed.startsWith('#')) {
    return trimmed;
  }

  // Bare path/word (e.g. "page.html") — accept; it resolves against base.
  // Reject anything with a colon that wasn't matched as a scheme above.
  if (trimmed.includes(':')) return null;
  return trimmed;
}

interface Props {
  text: string;
  href: string;
  persona: Persona;
}

export function Link({ text, href, persona }: Props) {
  const safeHref = sanitizeHref(href);

  if (safeHref === null) {
    // Render as plain text — never as an anchor — to neutralise the unsafe
    // scheme. Mark with a class so the visual harness can show the difference.
    return (
      <span class="onegov-link onegov-link--blocked" data-persona={persona}>
        {text}
      </span>
    );
  }

  // External links (anything starting with http(s)) get rel hardening.
  const isExternal = safeHref.startsWith('http://') || safeHref.startsWith('https://');
  return (
    <a
      class="onegov-link"
      href={safeHref}
      data-persona={persona}
      {...(isExternal ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
    >
      {text}
    </a>
  );
}
