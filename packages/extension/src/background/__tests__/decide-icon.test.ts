/**
 * Tests for the pure icon-decision function.
 *
 * `decideIcon()` is the contract between the (security-sensitive) verifier in
 * `@onegov/core` and the (Chrome-glue) service worker. We test it here in
 * plain bun:test — no chrome.* stubs needed — because keeping the decision
 * pure is the whole reason the function exists as its own module.
 *
 * Coverage targets:
 *   - verified eTLD+1 → green
 *   - lookalike (suffix attack, TLD swap, homograph) → red
 *   - off-list domain → gray
 *   - malformed URL (about:blank, "", garbage) → gray (no throw)
 *   - empty roster → every URL becomes gray
 */

import { describe, expect, it } from 'bun:test';

import type { VerifiedDomainList } from '@onegov/core';

import { decideIcon, iconPath, badgeStyle } from '../decide-icon.js';

const ROSTER: VerifiedDomainList = {
  version: '0.1.0-test',
  updatedAt: '2026-05-02',
  domains: [
    { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-02', source: 'https://anaf.ro' },
    { domain: 'gov.ro', category: 'gov', addedAt: '2026-05-02', source: 'https://gov.ro' },
  ],
};

const EMPTY: VerifiedDomainList = {
  version: '0.0.0',
  updatedAt: '2026-05-02',
  domains: [],
};

describe('decideIcon() — verified path', () => {
  it('returns green for an exact eTLD+1 match', () => {
    expect(decideIcon('https://anaf.ro/', ROSTER)).toBe('green');
  });

  it('returns green for a www subdomain', () => {
    expect(decideIcon('https://www.anaf.ro/foo?bar=baz', ROSTER)).toBe('green');
  });

  it('returns green for a deep subdomain (spv.anaf.ro)', () => {
    expect(decideIcon('https://spv.anaf.ro/inbox', ROSTER)).toBe('green');
  });

  it('returns green regardless of URL scheme casing or path content', () => {
    expect(decideIcon('HTTPS://ANAF.RO/page#frag', ROSTER)).toBe('green');
  });
});

describe('decideIcon() — lookalike path', () => {
  it('returns red for a suffix-attack lookalike (anaf-portal.ro)', () => {
    expect(decideIcon('https://anaf-portal.ro/', ROSTER)).toBe('red');
  });

  it('returns red for a TLD swap (anaf.com)', () => {
    expect(decideIcon('https://anaf.com/', ROSTER)).toBe('red');
  });

  it('returns red for a Cyrillic homograph (\u0430naf.ro)', () => {
    // \u0430 is Cyrillic small letter a — visually identical to ASCII 'a'.
    expect(decideIcon('https://\u0430naf.ro/', ROSTER)).toBe('red');
  });
});

describe('decideIcon() — unknown path', () => {
  it('returns gray for a fully off-list domain', () => {
    expect(decideIcon('https://google.com/', ROSTER)).toBe('gray');
  });

  it('returns gray for example.com', () => {
    expect(decideIcon('https://example.com/page', ROSTER)).toBe('gray');
  });
});

describe('decideIcon() — defensive behaviour on malformed input', () => {
  it('returns gray for an empty URL string (does not throw)', () => {
    expect(() => decideIcon('', ROSTER)).not.toThrow();
    expect(decideIcon('', ROSTER)).toBe('gray');
  });

  it('returns gray for a garbage URL string', () => {
    expect(decideIcon('not a url', ROSTER)).toBe('gray');
  });

  it('returns gray for about:blank (no hostname)', () => {
    expect(decideIcon('about:blank', ROSTER)).toBe('gray');
  });

  it('returns gray for chrome://newtab (no public hostname)', () => {
    expect(decideIcon('chrome://newtab/', ROSTER)).toBe('gray');
  });

  it('returns gray for a javascript: URL', () => {
    expect(decideIcon('javascript:void(0)', ROSTER)).toBe('gray');
  });

  it('returns gray for a file:// URL with no host', () => {
    expect(decideIcon('file:///etc/hosts', ROSTER)).toBe('gray');
  });

  it('returns gray for a data: URL', () => {
    expect(decideIcon('data:text/plain,hello', ROSTER)).toBe('gray');
  });
});

describe('decideIcon() — empty roster', () => {
  it('returns gray for any URL when the roster has no domains', () => {
    expect(decideIcon('https://anaf.ro/', EMPTY)).toBe('gray');
    expect(decideIcon('https://google.com/', EMPTY)).toBe('gray');
    expect(decideIcon('https://anaf-portal.ro/', EMPTY)).toBe('gray');
  });
});

describe('iconPath()', () => {
  it('produces the canonical 16/32/48 path map for green', () => {
    expect(iconPath('green')).toEqual({
      16: 'icons/green-16.png',
      32: 'icons/green-32.png',
      48: 'icons/green-48.png',
    });
  });

  it('produces the canonical map for gray', () => {
    expect(iconPath('gray')).toEqual({
      16: 'icons/gray-16.png',
      32: 'icons/gray-32.png',
      48: 'icons/gray-48.png',
    });
  });

  it('produces the canonical map for red', () => {
    expect(iconPath('red')).toEqual({
      16: 'icons/red-16.png',
      32: 'icons/red-32.png',
      48: 'icons/red-48.png',
    });
  });
});

describe('badgeStyle()', () => {
  it('shows a green check for verified', () => {
    const b = badgeStyle('green');
    expect(b.text).toBe('\u2713');
    expect(b.backgroundColor).toBe('#0F8A4F');
  });

  it('shows a loud red exclamation for lookalike', () => {
    const b = badgeStyle('red');
    expect(b.text).toBe('!');
    expect(b.backgroundColor).toBe('#C62828');
  });

  it('shows no badge text on unknown (keeps the toolbar clean)', () => {
    const b = badgeStyle('gray');
    expect(b.text).toBe('');
  });
});
