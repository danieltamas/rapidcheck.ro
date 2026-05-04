/**
 * SERP content script — badge verified (blue/brand) and lookalike (red)
 * result links on Google, Bing, DuckDuckGo, Yandex, Ecosia.
 * Unknown = no badge.  Only organic result title links are badged.
 */

import type { DomainStatus } from '@rapidcheck/core/types';
import type { GetStatusReply } from '../messages.js';

const BADGE_CLASS = 'rapidcheck-serp-badge';
const STYLE_ID = 'rapidcheck-serp-style-v3';
const DEBOUNCE_MS = 600;

const cache = new Map<string, BadgeInfo>();
const badged = new WeakSet<Element>();
let timer: ReturnType<typeof setTimeout> | null = null;

interface BadgeInfo {
  variant: 'verified' | 'lookalike';
  label: string;
  title?: string;
  subtitle?: string;
}

async function getStatus(hostname: string): Promise<GetStatusReply | null> {
  try {
    return (await chrome.runtime.sendMessage({ type: 'get-status', url: `https://${hostname}/` })) as GetStatusReply | undefined ?? null;
  } catch { return null; }
}

export function statusToBadge(status: DomainStatus | null): { variant: 'verified' | 'lookalike' | 'unknown'; label: string } {
  if (!status) return { variant: 'unknown', label: 'Neverificat' };
  if (status.kind === 'verified') return { variant: 'verified', label: 'Verificat' };
  if (status.kind === 'lookalike') return { variant: 'lookalike', label: `⚠ ${status.nearest.domain}` };
  return { variant: 'unknown', label: 'Neverificat' };
}

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
.${BADGE_CLASS} {
  all: unset !important;
  box-sizing: border-box !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  margin: 0 0 0 8px !important;
  padding: 2px 8px 2px 6px !important;
  border-radius: 999px !important;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: .01em !important;
  line-height: 1.4 !important;
  vertical-align: middle !important;
  white-space: nowrap !important;
  pointer-events: none !important;
  transform: none !important;
  -webkit-transform: none !important;
  color: inherit !important;
  background: transparent !important;
  border: none !important;
  position: relative !important;
  z-index: 10 !important;
}
.${BADGE_CLASS}--verified {
  background: linear-gradient(135deg, #7c3aed 0%, #2563eb 100%) !important;
  color: #ffffff !important;
  border-radius: 999px !important;
  box-shadow: 0 1px 5px rgba(37, 99, 235, 0.4), 0 0 0 1px rgba(37, 99, 235, 0.2) !important;
}
.${BADGE_CLASS}--lookalike {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
  color: #ffffff !important;
  border-radius: 999px !important;
  box-shadow: 0 1px 5px rgba(185, 28, 28, 0.4), 0 0 0 1px rgba(185, 28, 28, 0.2) !important;
}
.${BADGE_CLASS} svg,
.${BADGE_CLASS} img {
  width: 13px !important;
  height: 13px !important;
  flex-shrink: 0 !important;
  vertical-align: middle !important;
  pointer-events: none !important;
}
.${BADGE_CLASS} .rc-label {
  all: unset !important;
  display: inline !important;
  font-size: inherit !important;
  font-weight: inherit !important;
  color: inherit !important;
  line-height: inherit !important;
  letter-spacing: inherit !important;
  font-family: inherit !important;
}
.${BADGE_CLASS} .rc-icon {
  all: unset !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 15px !important;
  height: 15px !important;
  flex-shrink: 0 !important;
  pointer-events: none !important;
  line-height: 1 !important;
}
.${BADGE_CLASS}-wrap {
  all: unset !important;
  display: inline-flex !important;
  align-items: center !important;
  position: relative !important;
  z-index: 10 !important;
}
.${BADGE_CLASS}-tip {
  all: unset !important;
  display: none !important;
  position: absolute !important;
  bottom: calc(100% + 6px) !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  background: #1e293b !important;
  color: #f8fafc !important;
  border-radius: 10px !important;
  padding: 10px 14px !important;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  line-height: 1.5 !important;
  white-space: nowrap !important;
  pointer-events: none !important;
  z-index: 9999 !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.08) !important;
  min-width: 160px !important;
  max-width: 260px !important;
  white-space: normal !important;
  text-align: center !important;
}
.${BADGE_CLASS}-tip::after {
  content: '' !important;
  position: absolute !important;
  top: 100% !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  border: 6px solid transparent !important;
  border-top-color: #1e293b !important;
}
.${BADGE_CLASS}-wrap:hover .${BADGE_CLASS}-tip,
.${BADGE_CLASS}-wrap:focus-within .${BADGE_CLASS}-tip {
  display: block !important;
}
.${BADGE_CLASS}-tip-head {
  display: block !important;
  font-weight: 700 !important;
  font-size: 12px !important;
  margin-bottom: 2px !important;
  color: white !important;
}
.${BADGE_CLASS}-tip-verified .${BADGE_CLASS}-tip-head { color: #86efac !important; }
.${BADGE_CLASS}-tip-lookalike .${BADGE_CLASS}-tip-head { color: #fca5a5 !important; }
.${BADGE_CLASS}-tip-sub {
  display: block !important;
  font-size: 11px !important;
  color: #94a0ae !important;
  margin-top: 2px !important;
}`;
  (document.head ?? document.documentElement).appendChild(s);
}

/**
 * RapidCheck shield icon — small inline SVG, brand purple gradient.
 * Matches the popup ShieldCheckIcon but with a purple/blue fill for the badge.
 */
function shieldIcon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" style="flex-shrink:0">
<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="white"/>
<path d="M9 12l2 2 4-4" stroke="#7c3aed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
}

function makeBadge(variant: 'verified' | 'lookalike', label: string, title?: string, subtitle?: string): HTMLElement {
  // Outer wrapper — handles hover for tooltip positioning
  const wrap = document.createElement('span');
  wrap.className = `${BADGE_CLASS}-wrap`;

  const el = document.createElement('span');
  el.className = `${BADGE_CLASS} ${BADGE_CLASS}--${variant}`;
  el.setAttribute('role', 'status');
  el.tabIndex = 0;
  el.textContent = '';

  const icon = document.createElement('span');
  icon.className = 'rc-icon';
  icon.innerHTML = shieldIcon();

  const lbl = document.createElement('span');
  lbl.className = 'rc-label';
  lbl.textContent = label;

  el.appendChild(icon);
  el.appendChild(lbl);

  // Tooltip
  const tip = document.createElement('span');
  tip.className = `${BADGE_CLASS}-tip ${BADGE_CLASS}-tip-${variant}`;
  const head = document.createElement('span');
  head.className = `${BADGE_CLASS}-tip-head`;
  head.textContent = variant === 'verified' ? '✓ Verificat' : '⚠ Alertă';
  const sub = document.createElement('span');
  sub.className = `${BADGE_CLASS}-tip-sub`;
  sub.textContent = subtitle ?? (variant === 'verified' ? 'Site verificat de RapidCheck' : 'Domeniu suspect — phishing posibil');
  tip.appendChild(head);
  tip.appendChild(sub);

  wrap.appendChild(el);
  wrap.appendChild(tip);
  if (title) el.title = title;
  return wrap;
}

/**
 * Determine the real destination hostname from a SERP link.
 *
 * Google organic result:  href is the direct URL (e.g. https://www.bancatransilvania.ro/)
 * Google ad / ACLK:      href is google.com/aclk?...&adurl=https://...  → extract adurl
 * Google redirect:       href is /url?q=https://...&...               → extract q param
 * Bing redirect:         /ck/a0?u=https://...                          → extract u param
 * DDG redirect:           /l/?uddg=https://...                          → extract uddg param
 */
function realHostname(link: HTMLAnchorElement): string | null {
  // Ad — data-adurl holds the real destination
  const adurl = link.getAttribute('data-adurl');
  if (adurl) {
    try { return new URL(adurl).hostname; } catch { /* */ }
  }

  const href = link.getAttribute('href');
  if (!href) return null;

  try {
    // Try relative URL first (from page origin)
    const url = new URL(href, location.href);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    // Google /url redirect
    if (url.hostname.endsWith('google.') && url.pathname === '/url') {
      const q = url.searchParams.get('q') ?? url.searchParams.get('url');
      if (q) { try { return new URL(q).hostname; } catch { /* */ } }
    }

    // Google ACLK redirect
    if (url.hostname.endsWith('google.') && url.pathname === '/aclk') {
      const aurl = url.searchParams.get('adurl');
      if (aurl) { try { return new URL(aurl).hostname; } catch { /* */ } }
    }

    // Bing CK redirect
    if (url.hostname.endsWith('bing.com') && url.pathname.startsWith('/ck/')) {
      const u = url.searchParams.get('u');
      if (u) { try { return new URL(decodeURIComponent(u)).hostname; } catch { /* */ } }
    }

    // DDG redirect
    if (url.hostname === 'duckduckgo.com' && url.pathname === '/l/') {
      const uddg = url.searchParams.get('uddg');
      if (uddg) { try { return new URL(uddg).hostname; } catch { /* */ } }
    }

    // Organic result — href is already the real URL
    // Skip known non-result hosts (Google's own pages, etc.)
    if (SKIP_HOSTS.test(url.hostname)) return null;

    return url.hostname;
  } catch {
    return null;
  }
}

const SKIP_HOSTS = /^(www\.)?(google|bing|duckduckgo|yandex|ecosia|youtube|facebook|twitter|x\.com|linkedin|instagram|reddit|amazon|wikipedia|maps\.google|translate\.google|mail\.google|accounts\.google|play\.google|t\.co|goo\.gl|bit\.ly)\./i;

/**
 * Check if a link is an organic SERP result title link worth badging.
 * Returns the real hostname, or null to skip.
 */
function checkLink(link: HTMLAnchorElement): string | null {
  if (badged.has(link)) return null;

  // Must have an href
  const raw = link.getAttribute('href');
  if (!raw) return null;

  // Skip nav, footer, sidebar, PAA, knowledge panels, ads
  if (link.closest('nav, header, footer, aside, [role="navigation"], [role="complementary"], .commercial-unit, .kp-blk, .related-question-pair, [class*="carousel"], [class*="sidebar"], #rhs, #leftnav')) return null;

  // Skip Google ads (data-adurl on the link or parent)
  if (link.getAttribute('data-adurl')) return null;

  // Skip links without meaningful text
  const text = (link.textContent ?? '').trim();
  if (text.length < 4) return null;

  // Skip invisible links
  const w = link.offsetWidth;
  const h = link.offsetHeight;
  if (w < 40 || h < 10) return null;

  const host = realHostname(link);
  if (!host) return null;

  // Skip Google search engine results themselves (google.com/search?q=...)
  if (host === location.hostname) return null;

  badged.add(link);
  return host;
}

/**
 * Find all organic result title links.
 *
 * Strategy — Google 2025:
 *   Start from h3.LC20lb (the result title text node).
 *   Walk up to the containing <a class="zReHs"> — that IS the link.
 *   This is precise because h3.LC20lb only appears in organic results.
 *
 * Fallback selectors per engine cover the next layer of the DOM.
 */
function findLinks(): { link: HTMLAnchorElement; host: string }[] {
  const out: { link: HTMLAnchorElement; host: string }[] = [];
  const seen = new Set<Element>();

  // ---- Google: start from title h3, walk up to the result <a> ----
  try {
    for (const h3 of document.querySelectorAll<HTMLHeadingElement>('h3.LC20lb')) {
      // The parent <a class="zReHs"> is the result link
      const anchor = h3.closest<HTMLAnchorElement>('a.zReHs, a[href][class*="LC20lb"]');
      if (!anchor || seen.has(anchor)) continue;
      const host = checkLink(anchor);
      if (host) { seen.add(anchor); out.push({ link: anchor, host }); }
    }
  } catch { /* */ }

  // ---- Per-engine fallback selectors ----
  const fallbackSelectors = [
    // Bing: h2 in b_algo
    'li.b_algo h2 a[href]',
    // DuckDuckGo: result titles
    'a.result__a[href]',
    // Yandex
    '.serp-item a[href]',
    // Ecosia
    'a.result-link[href]',
  ];

  for (const sel of fallbackSelectors) {
    try {
      for (const el of document.querySelectorAll<HTMLAnchorElement>(sel)) {
        if (seen.has(el)) continue;
        const host = checkLink(el);
        if (host) { seen.add(el); out.push({ link: el, host }); }
      }
    } catch { /* invalid selector */ }
  }

  return out;
}

async function annotate(): Promise<void> {
  const links = findLinks();
  console.log('[rapidcheck][serp] found result links:', links.length);
  if (links.length === 0) return;

  injectStyle();

  // Group by hostname to batch lookups
  const byHost = new Map<string, typeof links>();
  for (const { link, host } of links) {
    const list = byHost.get(host) ?? [];
    list.push({ link, host });
    byHost.set(host, list);
  }

  for (const [host, entries] of byHost) {
    // If we already know this host, reuse
    const cached = cache.get(host);
    if (cached) {
      for (const { link } of entries) attach(link, cached);
      continue;
    }

    const reply = await getStatus(host);
    const status = reply?.status;
    if (!status || status.kind === 'unknown') {
      // Unknown: don't badge, don't cache long (could be new)
      continue;
    }

    if (status.kind === 'lookalike') {
      const info: BadgeInfo = {
        variant: 'lookalike',
        label: `⚠ ${status.nearest.domain}`,
        title: `Alertă phishing: ${status.nearest.domain}`,
        subtitle: `Similar cu ${status.nearest.domain} — verificat de RapidCheck`
      };
      cache.set(host, info);
      for (const { link } of entries) attach(link, info);
    } else {
      // Always use "Verificat" for verified — never the entity shortName
      const info: BadgeInfo = {
        variant: 'verified',
        label: 'Verificat',
        title: reply?.entity?.name,
        subtitle: reply?.entity?.name
          ? `${reply.entity.name} · Verificat de RapidCheck`
          : 'Site verificat de RapidCheck'
      };
      cache.set(host, info);
      for (const { link } of entries) attach(link, info);
    }
  }
}

function attach(link: HTMLAnchorElement, info: BadgeInfo): void {
  const h3 = link.querySelector<HTMLHeadingElement>('h3.LC20lb');
  const ref = h3 ?? link;
  const already = ref.querySelector('.' + BADGE_CLASS + '-wrap');
  if (already) return;
  const badge = makeBadge(info.variant, info.label, info.title, info.subtitle);
  try {
    ref.appendChild(badge);
  } catch { /* element gone */ }
}

function schedule(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void annotate(), DEBOUNCE_MS);
}

function isSerp(): boolean {
  try {
    const u = new URL(location.href);
    const h = u.hostname;
    const p = u.pathname + u.search;
    if (/(^|\.)google\.[a-z.]+$/.test(h) && (p.includes('/search') || u.searchParams.has('q'))) return true;
    if (/(^|\.)bing\.com$/.test(h) && p.includes('/search')) return true;
    if (h === 'duckduckgo.com' && u.searchParams.has('q')) return true;
    if (/(^|\.)yandex\.[a-z.]+$/.test(h) && p.includes('/search')) return true;
    if (/(^|\.)ecosia\.org$/.test(h) && p.includes('/search')) return true;
    return false;
  } catch { return false; }
}

async function main(): Promise<void> {
  console.log('[rapidcheck][serp] loaded, page:', location.href.slice(0, 80));
  if (!isSerp()) { console.log('[rapidcheck][serp] not a SERP, skip'); return; }

  const s = await chrome.storage.local.get(['protectionEnabled']);
  console.log('[rapidcheck][serp] protectionEnabled:', s['protectionEnabled']);
  if (s['protectionEnabled'] === false) return;

  schedule();
  document.addEventListener('load', schedule);
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
}

if (typeof chrome !== 'undefined' && typeof document !== 'undefined' && typeof location !== 'undefined') {
  void main();
}

export {};
