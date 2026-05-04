import { describe, expect, it } from 'bun:test';

import { detectSensitiveData, isValidCnp, isValidCui } from '../src/index.js';

describe('sensitive data detection', () => {
  it('validates Romanian CNP by checksum', () => {
    expect(isValidCnp('1960529460012')).toBe(true);
    expect(isValidCnp('1960529460019')).toBe(false);
  });

  it('validates Romanian CUI by checksum', () => {
    expect(isValidCui('16031712')).toBe(true);
    expect(isValidCui('16031713')).toBe(false);
  });

  it('detects sensitive values at submit time', () => {
    const matches = detectSensitiveData(['1960529460012', 'RO49AAAA1B31007593840000']);
    expect(matches.map((m) => m.kind).sort()).toEqual(['cnp', 'iban']);
  });
});
