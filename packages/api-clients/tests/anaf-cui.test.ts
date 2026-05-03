import { describe, expect, it } from 'bun:test';

import { lookupCui, normaliseCui } from '../src/index.js';

describe('ANAF CUI client', () => {
  it('normalises RO prefix and whitespace', () => {
    expect(normaliseCui(' RO 14841555 ')).toBe('14841555');
  });

  it('rejects invalid CUI values', () => {
    expect(normaliseCui('abc')).toBeNull();
  });

  it('maps the ANAF response into CompanyInfo', async () => {
    const calls: RequestInit[] = [];
    const fetcher = async (_url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      calls.push(init ?? {});
      return new Response(JSON.stringify({
        found: [{ cui: 14841555, denumire: 'TEST SRL', adresa: 'București', scpTVA: true }],
      }), { status: 200 });
    };

    const out = await lookupCui('14841555', {
      fetcher: fetcher as typeof fetch,
      today: new Date('2026-05-03T00:00:00Z'),
    });

    expect(out?.name).toBe('TEST SRL');
    expect(out?.vatActive).toBe(true);
    expect(calls[0]?.body).toBe('[{"cui":14841555,"data":"2026-05-03"}]');
  });
});
