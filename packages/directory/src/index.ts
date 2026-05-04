import rawDirectory from '../data/entities.json';

import {
  verifiedDirectorySchema,
  type VerifiedDirectory,
  type VerifiedEntity,
  type VerifiedEntitySummary,
} from './schema.js';

const DIRECTORY = verifiedDirectorySchema.parse(rawDirectory);

export type { EntityCategory, SourceType, VerifiedDirectory, VerifiedEntity, VerifiedEntitySummary } from './schema.js';
export { verifiedDirectorySchema, verifiedEntitySchema } from './schema.js';

export function loadDirectory(): VerifiedDirectory {
  return DIRECTORY;
}

export function listEntities(): VerifiedEntity[] {
  return DIRECTORY.entities;
}

export function domainsFromDirectory(): string[] {
  return domainsFromVerifiedDirectory(DIRECTORY);
}

export function domainsFromVerifiedDirectory(directory: VerifiedDirectory): string[] {
  return directory.entities.flatMap((entity) => entity.domains);
}

export function findEntityByDomain(hostname: string): VerifiedEntity | null {
  return findEntityByDomainInDirectory(DIRECTORY, hostname);
}

export function findEntityByDomainInDirectory(
  directory: VerifiedDirectory,
  hostname: string,
): VerifiedEntity | null {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return null;
  return (
    directory.entities.find((entity) =>
      entity.domains.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`)),
    ) ?? null
  );
}

export function entitySummaryForDomain(hostname: string): VerifiedEntitySummary | null {
  const entity = findEntityByDomainInDirectory(DIRECTORY, hostname);
  return entity ? toEntitySummary(entity) : null;
}

export function entitySummaryForDomainInDirectory(
  directory: VerifiedDirectory,
  hostname: string,
): VerifiedEntitySummary | null {
  const entity = findEntityByDomainInDirectory(directory, hostname);
  return entity ? toEntitySummary(entity) : null;
}

export function searchEntities(query: string, limit = 5): VerifiedEntitySummary[] {
  return searchEntitiesInDirectory(DIRECTORY, query, limit);
}

export function searchEntitiesInDirectory(
  directory: VerifiedDirectory,
  query: string,
  limit = 5,
): VerifiedEntitySummary[] {
  const needle = normalizeSearch(query);
  if (needle.length < 2) return [];

  return directory.entities
    .map((entity) => ({ entity, score: scoreEntity(entity, needle) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.entity.name.localeCompare(b.entity.name, 'ro'))
    .slice(0, limit)
    .map((hit) => toEntitySummary(hit.entity));
}

export function toEntitySummary(entity: VerifiedEntity): VerifiedEntitySummary {
  return {
    id: entity.id,
    name: entity.name,
    shortName: entity.shortName,
    category: entity.category,
    primaryDomain: entity.domains[0]!,
    officialUrl: entity.officialUrls[0]!,
    sourceUrl: entity.sourceUrls[0]!,
    lastVerifiedAt: entity.lastVerifiedAt,
  };
}

function normalizeHostname(hostname: string): string | null {
  const trimmed = hostname.trim().toLowerCase();
  if (trimmed.length === 0) return null;
  const stripped = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
  return stripped.length > 0 ? stripped : null;
}

function normalizeSearch(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

function scoreEntity(entity: VerifiedEntity, needle: string): number {
  const shortName = entity.shortName ? normalizeSearch(entity.shortName) : '';
  const name = normalizeSearch(entity.name);
  const domains = entity.domains.map(normalizeSearch);

  if (domains.some((domain) => domain === needle)) return 100;
  if (shortName === needle) return 95;
  if (domains.some((domain) => domain.startsWith(needle))) return 88;
  if (shortName.startsWith(needle)) return 82;
  if (name.includes(needle)) return 70;
  if (domains.some((domain) => domain.includes(needle))) return 60;
  return 0;
}
