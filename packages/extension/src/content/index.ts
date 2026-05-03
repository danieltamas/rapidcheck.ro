/**
 * Content script — v0.3 direct page replacement.
 *
 * The page is either:
 *   - ONEGOV app content, rendered directly into the document body, or
 *   - the original site body content, with the same full-width ONEGOV
 *     activation bar kept as the first body child.
 *
 * No shadow DOM. No hide-original stylesheet. No overlay z-index takeover.
 */

import { h, render as preactRender } from 'preact';

import { ANAF_SITE_MAP } from '@onegov/site-data/anaf';
import type { Density, SiteMap } from '@onegov/site-data';
import { THEME_CSS } from '@onegov/ui';

import type { DomainStatus } from '@onegov/core';
import type { GetStatusReply, GetStatusRequest } from '../messages.js';
import { OnegovRuntimeBar, RenderEngine } from '../render-engine/RenderEngine';
import { RENDER_ENGINE_CSS } from '../render-engine/styles';

declare const __DEV__: boolean | undefined;

const BAR_ID = 'onegov-bar-root';
const APP_ID = 'onegov-app';
const STYLE_ID = 'onegov-document-styles';
const DENSITY_VALUES: ReadonlyArray<Density> = ['minimal', 'simplu', 'bogat'];
const DEFAULT_DENSITY: Density = 'simplu';

interface Settings {
  density: Density;
  enabled: boolean;
}

interface RuntimeMount {
  body: HTMLElement;
  barRoot: HTMLDivElement;
  appRoot: HTMLDivElement;
  originalNodes: ChildNode[];
}

async function sendMessage(req: GetStatusRequest): Promise<GetStatusReply | null> {
  try {
    const reply = (await chrome.runtime.sendMessage(req)) as GetStatusReply | undefined;
    return reply ?? null;
  } catch {
    return null;
  }
}

function coerceDensity(raw: unknown): Density {
  return typeof raw === 'string' && DENSITY_VALUES.includes(raw as Density)
    ? (raw as Density)
    : DEFAULT_DENSITY;
}

async function readSettings(): Promise<Settings> {
  try {
    const stored = await chrome.storage.local.get(['uiDensity', 'extensionEnabled']);
    return {
      density: coerceDensity(stored['uiDensity']),
      enabled: stored['extensionEnabled'] !== false,
    };
  } catch {
    return { density: DEFAULT_DENSITY, enabled: true };
  }
}

function waitForBody(): Promise<HTMLElement> {
  if (document.body) return Promise.resolve(document.body);
  return new Promise((resolve) => {
    const done = (): boolean => {
      if (!document.body) return false;
      observer.disconnect();
      document.removeEventListener('readystatechange', onState);
      resolve(document.body);
      return true;
    };
    const observer = new MutationObserver(() => {
      done();
    });
    const onState = (): void => {
      done();
    };
    observer.observe(document.documentElement, { childList: true });
    document.addEventListener('readystatechange', onState);
  });
}

function siteMapFor(url: URL): SiteMap | null {
  const host = url.hostname.toLowerCase();
  if (host === 'anaf.ro' || host.endsWith('.anaf.ro')) {
    if (/^(webservicesp|static|declunic|pfinternet|evtva|mfinante)\.anaf\.ro$/.test(host)) {
      return null;
    }
    return ANAF_SITE_MAP;
  }
  return null;
}

function isVerified(status: DomainStatus | null): boolean {
  return status?.kind === 'verified';
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `${documentThemeCss(THEME_CSS)}\n${RENDER_ENGINE_CSS}`;
  document.head.appendChild(style);
}

function documentThemeCss(css: string): string {
  return css
    .replaceAll(':host([data-persona=', '#onegov-app[data-persona=')
    .replaceAll(':host', '#onegov-app');
}

function createMount(body: HTMLElement): RuntimeMount {
  const originalNodes = Array.from(body.childNodes);
  const barRoot = document.createElement('div');
  const appRoot = document.createElement('div');
  barRoot.id = BAR_ID;
  appRoot.id = APP_ID;
  appRoot.dataset['onegov'] = '1';
  return { body, barRoot, appRoot, originalNodes };
}

function showOnegov(mount: RuntimeMount): void {
  mount.body.replaceChildren(mount.barRoot, mount.appRoot);
}

function restoreOriginalContent(mount: RuntimeMount): void {
  mount.body.replaceChildren(mount.barRoot, ...mount.originalNodes);
}

function renderBar(mount: RuntimeMount, active: boolean, siteMap: SiteMap): void {
  preactRender(
    h(OnegovRuntimeBar, {
      active,
      shortLabel: siteMap.branding.shortLabel,
      onToggle: () => {
        void chrome.storage.local.set({ extensionEnabled: !active }).catch(() => {});
      },
    }),
    mount.barRoot,
  );
}

function renderApp(mount: RuntimeMount, siteMap: SiteMap, density: Density, url: URL): void {
  mount.appRoot.setAttribute('data-density', density);
  preactRender(h(RenderEngine, { siteMap, density, initialUrl: url }), mount.appRoot);
}

async function activate(siteMap: SiteMap, url: URL): Promise<void> {
  const statusReply = await sendMessage({ type: 'get-status', url: location.href });
  if (!isVerified(statusReply?.status ?? null)) return;

  const body = await waitForBody();
  injectStyles();

  const mount = createMount(body);
  const settings = await readSettings();
  let density = settings.density;
  let active = settings.enabled;

  renderBar(mount, active, siteMap);
  renderApp(mount, siteMap, density, url);
  if (active) showOnegov(mount);
  else restoreOriginalContent(mount);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    if (changes['uiDensity']) {
      density = coerceDensity(changes['uiDensity'].newValue);
      renderApp(mount, siteMap, density, new URL(location.href));
    }

    if (changes['extensionEnabled'] !== undefined) {
      active = changes['extensionEnabled'].newValue !== false;
      renderBar(mount, active, siteMap);
      if (active) {
        renderApp(mount, siteMap, density, new URL(location.href));
        showOnegov(mount);
      } else {
        restoreOriginalContent(mount);
      }
    }
  });
}

async function main(): Promise<void> {
  let url: URL;
  try {
    url = new URL(location.href);
  } catch {
    return;
  }

  const siteMap = siteMapFor(url);
  if (!siteMap) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.info('[onegov] no v0.3 site map for', url.hostname);
    }
    return;
  }

  await activate(siteMap, url);
}

void main();

export {};
