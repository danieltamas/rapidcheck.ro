import { describe, expect, it } from 'bun:test';

import { ANAF_SITE_MAP, validateSiteMap } from '../src/index.js';

describe('@onegov/site-data schema', () => {
  it('accepts the bundled ANAF site map', () => {
    const parsed = validateSiteMap(ANAF_SITE_MAP);
    expect(parsed.domain).toBe('anaf.ro');
    expect(parsed.branding.fullName).toContain('Administrare Fiscală');
    expect(parsed.branding.logo.src).toBe('asset:anaf-logo');
  });

  it('rejects missing branding', () => {
    const broken = { ...ANAF_SITE_MAP, branding: undefined };
    expect(() => validateSiteMap(broken)).toThrow();
  });
});
