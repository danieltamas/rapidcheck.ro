export interface CompanyInfo {
  cui: number;
  name: string;
  address: string;
  vatActive: boolean | null;
  raw: unknown;
}

export interface LookupCuiOptions {
  fetcher?: typeof fetch;
  today?: Date;
}

interface AnafCompanyPayload {
  cui?: number;
  denumire?: string;
  adresa?: string;
  scpTVA?: boolean;
}

interface AnafResponse {
  found?: AnafCompanyPayload[];
  notFound?: Array<{ cui?: number }>;
}

export function normaliseCui(input: string): string | null {
  const value = input.trim().replace(/^ro/i, '').replace(/\s+/g, '');
  return /^\d{2,10}$/.test(value) ? value : null;
}

export async function lookupCui(input: string, opts: LookupCuiOptions = {}): Promise<CompanyInfo | null> {
  const cui = normaliseCui(input);
  if (!cui) {
    throw new Error('CUI invalid');
  }

  const fetcher = opts.fetcher ?? fetch;
  const date = formatDate(opts.today ?? new Date());
  const res = await fetcher('https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify([{ cui: Number(cui), data: date }]),
  });

  if (!res.ok) {
    throw new Error(`ANAF lookup failed: ${res.status}`);
  }

  const payload = (await res.json()) as AnafResponse;
  const first = payload.found?.[0];
  if (!first) return null;
  return {
    cui: first.cui ?? Number(cui),
    name: first.denumire ?? 'Firmă fără denumire în răspuns',
    address: first.adresa ?? '',
    vatActive: typeof first.scpTVA === 'boolean' ? first.scpTVA : null,
    raw: first,
  };
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
