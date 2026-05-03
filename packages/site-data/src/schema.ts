import { z } from 'zod';

export const DensitySchema = z.enum(['minimal', 'simplu', 'bogat']);
export type Density = z.infer<typeof DensitySchema>;

export const IconSchema = z.enum([
  'search',
  'calendar',
  'computer',
  'help',
  'info',
  'building',
  'document',
  'shield',
  'money',
  'external',
]);
export type SiteIcon = z.infer<typeof IconSchema>;

export const LinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  icon: IconSchema.optional(),
  density: DensitySchema.optional(),
});
export type SiteLink = z.infer<typeof LinkSchema>;

export const BrandingSchema = z.object({
  logo: z.object({
    src: z.string().min(1),
    alt: z.string().min(1),
  }),
  fullName: z.string().min(1),
  shortLabel: z.string().min(1),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export type Branding = z.infer<typeof BrandingSchema>;

export const SectionItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  href: z.string().min(1),
  icon: IconSchema,
  density: DensitySchema.optional(),
});
export type SectionItem = z.infer<typeof SectionItemSchema>;

export const FaqItemSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  density: DensitySchema.optional(),
});
export type FaqItem = z.infer<typeof FaqItemSchema>;

export const SectionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('task_grid'),
    eyebrow: z.string().optional(),
    title: z.string().min(1),
    items: z.array(SectionItemSchema).min(1),
  }),
  z.object({
    kind: z.literal('link_group'),
    eyebrow: z.string().optional(),
    title: z.string().min(1),
    items: z.array(SectionItemSchema).min(1),
  }),
  z.object({
    kind: z.literal('faq'),
    eyebrow: z.string().optional(),
    title: z.string().min(1),
    items: z.array(FaqItemSchema).min(1),
  }),
]);
export type SiteSection = z.infer<typeof SectionSchema>;

export const FormFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'search']),
  required: z.boolean().optional(),
  pattern: z.string().optional(),
  helper: z.string().optional(),
});
export type FormField = z.infer<typeof FormFieldSchema>;

export const PageSchema = z.object({
  path: z.string().min(1),
  template: z.enum(['home', 'form', 'list', 'external']),
  title: z.string().min(1),
  sub: z.string().optional(),
  heroActions: z.array(LinkSchema).optional(),
  sections: z.array(SectionSchema).optional(),
  form: z.object({
    fields: z.array(FormFieldSchema).min(1),
    submitLabel: z.string().min(1),
    handler: z.enum(['anaf.lookupCui']),
  }).optional(),
  externalUrl: z.string().url().optional(),
});
export type SitePage = z.infer<typeof PageSchema>;

export const RoutePatternSchema = z.object({
  match: z.string().min(1),
  page: z.string().min(1),
});
export type RoutePattern = z.infer<typeof RoutePatternSchema>;

export const SiteMapSchema = z.object({
  version: z.string().min(1),
  domain: z.string().min(1),
  branding: BrandingSchema,
  navigation: z.object({
    primary: z.array(LinkSchema).min(1),
    primaryCta: LinkSchema,
  }),
  footer: z.array(LinkSchema).min(1),
  pages: z.record(PageSchema),
  urlPatterns: z.array(RoutePatternSchema).min(1),
});
export type SiteMap = z.infer<typeof SiteMapSchema>;

export function validateSiteMap(input: unknown): SiteMap {
  return SiteMapSchema.parse(input);
}
