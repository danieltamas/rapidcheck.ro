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
 *
 * v0.1 API preserved: callers passing { text, href, persona } work unchanged.
 * New `variant`, `children`, `class`, `external` props are additive.
 */

import type { ComponentChildren, JSX } from 'preact';

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

type Variant = 'default' | 'quiet';

interface Props extends Omit<JSX.HTMLAttributes<HTMLAnchorElement>, 'class' | 'children' | 'href'> {
  text?: string;
  children?: ComponentChildren;
  href: string;
  persona?: Persona;
  variant?: Variant;
  /** Override scheme-based external detection. When true, adds rel hardening + target=_blank. */
  external?: boolean;
  class?: string;
}

export function Link({
  text,
  children,
  href,
  persona = 'standard',
  variant = 'default',
  external,
  class: className,
  ...rest
}: Props) {
  const safeHref = sanitizeHref(href);

  const content: ComponentChildren = children ?? text ?? '';

  if (safeHref === null) {
    // Render as plain text — never as an anchor — to neutralise the unsafe
    // scheme. Mark with a class so the visual harness can show the difference.
    return (
      <span class="onegov-link onegov-link--blocked" data-persona={persona}>
        {content}
      </span>
    );
  }

  const classes = ['onegov-link'];
  if (variant === 'quiet') classes.push('onegov-link--quiet');
  if (className) classes.push(className);

  // External links (anything starting with http(s)) get rel hardening unless
  // the caller explicitly opts out by passing `external={false}`.
  const isHttp = safeHref.startsWith('http://') || safeHref.startsWith('https://');
  const treatAsExternal = external ?? isHttp;

  return (
    <a
      class={classes.join(' ')}
      href={safeHref}
      data-persona={persona}
      {...(treatAsExternal ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
      {...rest}
    >
      {content}
    </a>
  );
}
