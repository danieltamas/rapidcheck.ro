import type { SiteMap, SitePage } from '@onegov/site-data';

export function pageForUrl(siteMap: SiteMap, url: URL): SitePage {
  const path = normalisePath(url);
  for (const route of siteMap.urlPatterns) {
    const pattern = new RegExp(route.match, 'i');
    if (pattern.test(path)) return siteMap.pages[route.page] ?? siteMap.pages['/external'] ?? firstPage(siteMap);
  }
  return siteMap.pages['/external'] ?? firstPage(siteMap);
}

export function pageForHref(siteMap: SiteMap, href: string): SitePage {
  if (/^https?:\/\//i.test(href)) {
    return {
      path: '/external',
      template: 'external',
      title: 'Deschide pagina oficială',
      sub: 'Această destinație rămâne disponibilă pe site-ul original.',
      externalUrl: href,
    };
  }
  return siteMap.pages[href] ?? siteMap.pages['/external'] ?? firstPage(siteMap);
}

function firstPage(siteMap: SiteMap): SitePage {
  const first = Object.values(siteMap.pages)[0];
  if (!first) throw new Error(`Site map ${siteMap.domain} has no pages`);
  return first;
}

function normalisePath(url: URL): string {
  const raw = `${url.pathname}${url.search}`;
  return raw === '' ? '/' : raw;
}
