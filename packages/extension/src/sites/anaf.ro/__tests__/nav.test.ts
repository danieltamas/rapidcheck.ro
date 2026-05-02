/**
 * anaf.ro nav tests — pure-function URL classification + matcher.
 *
 * Pure functions; no DOM setup needed.
 */

import { describe, expect, it } from 'bun:test';

import { isMatch, classifyRoute } from '../nav.js';

describe('isMatch', () => {
  it('matches anaf.ro and www.anaf.ro', () => {
    expect(isMatch(new URL('https://anaf.ro/'))).toBe(true);
    expect(isMatch(new URL('https://www.anaf.ro/anaf/internet/ANAF/'))).toBe(true);
  });

  it('matches non-API anaf subdomains', () => {
    // Hypothetical content subdomains (e.g. spv portals when redirected back
    // to anaf.ro chrome) — matches by default.
    expect(isMatch(new URL('https://intranet.anaf.ro/something'))).toBe(true);
    expect(isMatch(new URL('https://portal.anaf.ro/'))).toBe(true);
  });

  it('does NOT match the API/asset subdomains', () => {
    expect(isMatch(new URL('https://webservicesp.anaf.ro/api/x'))).toBe(false);
    expect(isMatch(new URL('https://static.anaf.ro/asset.png'))).toBe(false);
    expect(isMatch(new URL('https://declunic.anaf.ro/'))).toBe(false);
    expect(isMatch(new URL('https://pfinternet.anaf.ro/'))).toBe(false);
  });

  it('does NOT match unrelated hosts', () => {
    expect(isMatch(new URL('https://example.test/anaf'))).toBe(false);
    expect(isMatch(new URL('https://google.com/'))).toBe(false);
    // Lookalike — should NOT match (the lookalike state is owned by the SW).
    expect(isMatch(new URL('https://anaf-portal.ro/'))).toBe(false);
  });
});

describe('classifyRoute', () => {
  it('classifies the homepage / catch-all anaf root', () => {
    expect(classifyRoute(new URL('https://www.anaf.ro/'))).toEqual({ kind: 'home' });
    expect(classifyRoute(new URL('https://www.anaf.ro/anaf/internet/ANAF/'))).toEqual({
      kind: 'home',
    });
  });

  it('classifies CUI lookup paths and extracts the CUI', () => {
    expect(classifyRoute(new URL('https://www.anaf.ro/anaf/internet/ANAF/?cui=14841555'))).toEqual({
      kind: 'cui',
      cui: '14841555',
    });
    expect(classifyRoute(new URL('https://www.anaf.ro/verificare-cui'))).toEqual({
      kind: 'cui',
    });
    expect(classifyRoute(new URL('https://www.anaf.ro/platitor/12345'))).toEqual({
      kind: 'cui',
      cui: '12345',
    });
  });

  it('handles uppercase CUI param', () => {
    expect(classifyRoute(new URL('https://www.anaf.ro/?CUI=14399840'))).toEqual({
      kind: 'cui',
      cui: '14399840',
    });
  });

  it('classifies known external sections', () => {
    expect(
      classifyRoute(
        new URL('https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili/calendar_fiscal'),
      ).kind,
    ).toBe('external');
    expect(
      classifyRoute(new URL('https://www.anaf.ro/anaf/internet/ANAF/servicii_online')).kind,
    ).toBe('external');
    expect(classifyRoute(new URL('https://www.anaf.ro/anaf/internet/ANAF/contact')).kind).toBe(
      'external',
    );
  });

  it('falls back to "unknown" for arbitrary deep paths but never throws', () => {
    const out = classifyRoute(new URL('https://www.anaf.ro/some/random/page'));
    expect(out.kind).toBe('unknown');
  });

  it('rejects implausible CUI lengths in path captures', () => {
    // Single digit "/1/" is too short to be a CUI; should not classify cui.
    const out = classifyRoute(new URL('https://www.anaf.ro/foo/1/bar'));
    expect(out.kind).toBe('unknown');
  });
});
