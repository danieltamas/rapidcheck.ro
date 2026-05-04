import { z } from 'zod';

export const entityCategorySchema = z.enum([
  'central-gov',
  'local-gov',
  'public-service',
  'bank',
  'mobile-operator',
  'regulator',
  'court',
  'utility',
  'other',
]);

export const sourceTypeSchema = z.enum([
  'official-site',
  'regulator-registry',
  'public-authority-list',
  'manual-evidence',
]);

export const verifiedEntitySchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(2),
  shortName: z.string().min(1).optional(),
  category: entityCategorySchema,
  domains: z.array(z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/)).min(1),
  officialUrls: z.array(z.string().url()).min(1),
  sourceUrls: z.array(z.string().url()).min(1),
  sourceType: sourceTypeSchema,
  country: z.literal('RO'),
  riskTags: z.array(z.string().min(1)).optional(),
  lastVerifiedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const verifiedDirectorySchema = z.object({
  version: z.string().min(1),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entities: z.array(verifiedEntitySchema).min(1),
});

export type EntityCategory = z.infer<typeof entityCategorySchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type VerifiedEntity = z.infer<typeof verifiedEntitySchema>;
export type VerifiedDirectory = z.infer<typeof verifiedDirectorySchema>;

export interface VerifiedEntitySummary {
  id: string;
  name: string;
  shortName?: string;
  category: EntityCategory;
  primaryDomain: string;
  officialUrl: string;
  sourceUrl: string;
  lastVerifiedAt: string;
}
