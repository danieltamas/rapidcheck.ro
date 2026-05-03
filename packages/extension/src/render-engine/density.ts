import type { Density, FaqItem, SectionItem, SiteLink, SiteSection } from '@onegov/site-data';

const RANK: Record<Density, number> = {
  minimal: 0,
  simplu: 1,
  bogat: 2,
};

export function visibleLink(item: SiteLink, density: Density): boolean {
  return item.density === undefined || rank(item.density) <= rank(density);
}

export function visibleSectionItem(item: SectionItem, density: Density): boolean {
  return item.density === undefined || rank(item.density) <= rank(density);
}

export function visibleFaqItem(item: FaqItem, density: Density): boolean {
  return item.density === undefined || rank(item.density) <= rank(density);
}

export function filterSection(section: SiteSection, density: Density): SiteSection | null {
  if (section.kind === 'faq') {
    const items = section.items.filter((item) => visibleFaqItem(item, density));
    return items.length > 0 ? { ...section, items } : null;
  }
  const items = section.items.filter((item) => visibleSectionItem(item, density));
  return items.length > 0 ? { ...section, items } : null;
}

function rank(density: Density): number {
  return RANK[density];
}
