import { describe, expect, it } from 'bun:test';

import {
  domainsFromDirectory,
  entitySummaryForDomain,
  findEntityByDomain,
  searchEntities,
} from '../src/index.js';

describe('@rapidcheck/directory lookup', () => {
  it('finds an entity by exact domain', () => {
    expect(findEntityByDomain('anaf.ro')?.shortName).toBe('ANAF');
  });

  it('finds a county council by domain', () => {
    expect(findEntityByDomain('cjcluj.ro')?.shortName).toBe('CJ Cluj');
  });

  it('finds a Bucharest sector by domain', () => {
    expect(findEntityByDomain('sector1.ro')?.shortName).toBe('Sector 1');
  });

  it('finds an entity by subdomain', () => {
    expect(findEntityByDomain('www.bancatransilvania.ro')?.shortName).toBe('BT');
  });

  it('normalizes casing and trailing dots', () => {
    expect(findEntityByDomain('WWW.ORANGE.RO.')?.shortName).toBe('Orange');
  });

  it('returns null for unknown domains', () => {
    expect(findEntityByDomain('example.test')).toBeNull();
  });

  it('builds a compact summary for extension messaging', () => {
    const summary = entitySummaryForDomain('ghiseul.ro');
    expect(summary?.id).toBe('ghiseul');
    expect(summary?.primaryDomain).toBe('ghiseul.ro');
    expect(summary?.sourceUrl).toStartWith('https://');
  });

  it('exposes domains for compatibility rosters', () => {
    expect(domainsFromDirectory()).toContain('anaf.ro');
    expect(domainsFromDirectory()).toContain('vodafone.ro');
    expect(domainsFromDirectory()).toContain('cjcluj.ro');
  });

  it('resolves official links by acronym, name, and domain', () => {
    expect(searchEntities('ANAF')[0]?.primaryDomain).toBe('anaf.ro');
    expect(searchEntities('Banca Transilvania')[0]?.primaryDomain).toBe('bancatransilvania.ro');
    expect(searchEntities('vodafone.ro')[0]?.shortName).toBe('Vodafone');
  });

  it('normalizes Romanian diacritics in resolver queries', () => {
    expect(searchEntities('primaria iasi')[0]?.id).toBe('primaria-iasi');
  });

  it('returns an empty resolver result for tiny or unknown queries', () => {
    expect(searchEntities('a')).toHaveLength(0);
    expect(searchEntities('zzzz-not-real')).toHaveLength(0);
  });
});
