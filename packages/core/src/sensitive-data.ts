/**
 * Sensitive Romanian public-service identifiers.
 *
 * Pure helpers used by the extension submit guard. Values are checked only at
 * user submit time; callers must not run these against keystrokes or idle page
 * state.
 */

export type SensitiveDataKind = 'cnp' | 'cui' | 'iban' | 'card';

export interface SensitiveDataMatch {
  kind: SensitiveDataKind;
  evidence: 'checksum' | 'pattern';
}

const CNP_WEIGHTS = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9] as const;
const CUI_WEIGHTS = [7, 5, 3, 2, 1, 7, 5, 3, 2] as const;

export function detectSensitiveData(values: Iterable<string>): SensitiveDataMatch[] {
  const found = new Map<SensitiveDataKind, SensitiveDataMatch>();
  for (const value of values) {
    const normalized = value.trim();
    if (normalized.length === 0) continue;
    if (!found.has('cnp') && isValidCnp(normalized)) {
      found.set('cnp', { kind: 'cnp', evidence: 'checksum' });
    }
    if (!found.has('cui') && isValidCui(normalized)) {
      found.set('cui', { kind: 'cui', evidence: 'checksum' });
    }
    if (!found.has('iban') && looksLikeRomanianIban(normalized)) {
      found.set('iban', { kind: 'iban', evidence: 'pattern' });
    }
    if (!found.has('card') && looksLikePaymentCard(normalized)) {
      found.set('card', { kind: 'card', evidence: 'pattern' });
    }
  }
  return Array.from(found.values());
}

export function isValidCnp(input: string): boolean {
  const digits = input.replace(/\D/g, '');
  if (!/^\d{13}$/.test(digits)) return false;
  const s = Number(digits[0]);
  if (s < 1 || s > 9) return false;
  const yy = Number(digits.slice(1, 3));
  const mm = Number(digits.slice(3, 5));
  const dd = Number(digits.slice(5, 7));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  // The exact century is not needed for rejecting obvious invalid dates.
  const date = new Date(Date.UTC(2000 + yy, mm - 1, dd));
  if (date.getUTCMonth() !== mm - 1 || date.getUTCDate() !== dd) return false;
  let sum = 0;
  for (let i = 0; i < CNP_WEIGHTS.length; i++) {
    sum += Number(digits[i]) * CNP_WEIGHTS[i]!;
  }
  const control = sum % 11;
  const expected = control === 10 ? 1 : control;
  return expected === Number(digits[12]);
}

export function isValidCui(input: string): boolean {
  const digits = input.replace(/^RO/i, '').replace(/\D/g, '');
  if (!/^\d{2,10}$/.test(digits)) return false;
  const body = digits.slice(0, -1).padStart(9, '0');
  const controlDigit = Number(digits[digits.length - 1]);
  let sum = 0;
  for (let i = 0; i < CUI_WEIGHTS.length; i++) {
    sum += Number(body[i]) * CUI_WEIGHTS[i]!;
  }
  const control = (sum * 10) % 11;
  const expected = control === 10 ? 0 : control;
  return expected === controlDigit;
}

function looksLikeRomanianIban(input: string): boolean {
  return /^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/i.test(input.replace(/\s/g, ''));
}

function looksLikePaymentCard(input: string): boolean {
  const digits = input.replace(/[\s-]/g, '');
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}
