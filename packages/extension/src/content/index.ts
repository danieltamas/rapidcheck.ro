/**
 * Content script — v0.2 lifecycle dispatcher.
 *
 * Runs at:
 *   - `document_start` for anaf.ro (per manifest split) — loader injects before
 *     the page paints, so the user never sees the original 1800s chrome.
 *   - `document_idle` for the other ship-list sites (dgep, portal.just,
 *     ghiseul, rotld, itmcluj). v0.2.0 does NOT mount an overlay for those —
 *     they keep the toolbar badge (verified state) and otherwise render the
 *     original page untouched. Their per-site modules ship in subsequent tasks.
 *
 * Flow:
 *   1. Resolve the site module from `./sites/registry.ts`.
 *      - If none claims the URL → exit cleanly. No loader, no DOM mutation.
 *   2. Mount the loader (hide-original style + splash) immediately.
 *   3. Ask the SW for verified status.
 *      - If not verified → loader.abort(), restoring the original page.
 *   4. Read density preference from chrome.storage.local.
 *   5. Mount the closed shadow host with overlay styles.
 *   6. Extract context from the original document.
 *   7. Render the site module's `App` into the shadow root via Preact.
 *   8. Hold loader for ≥200ms (visible feedback) then dismiss.
 *   9. Wire storage listener for density changes + extensionEnabled toggle +
 *      legacy showOriginal toggle.
 *
 * Failure paths:
 *   - SW unreachable → loader.abort() (page restored).
 *   - Module's extractContext throws → render with default context (App must
 *     defend against missing fields).
 *   - Render throws → loader.abort() so user isn't stuck.
 *
 * Invariants enforced:
 *   #1 Original DOM untouched aside from the THREE appended siblings under
 *      <body>: <style id="onegov-hide-original">, <div id="onegov-loader">,
 *      <div id="onegov-root">. The site module also sets the documented
 *      documentElement.style.overflow toggle (carry-over from v0.1.1).
 *   #2 No passive form data reads. The site module's bridge.ts is the ONLY
 *      surface that touches form inputs, and only on explicit user submit.
 *   #3 No remote code. JSX-only paths.
 *   #4 No external network from this file. Site modules MAY call public APIs
 *      under their host_permissions (e.g. webservicesp.anaf.ro) — see §H.4.
 *   #5 Escape hatch unchanged: removing #onegov-hide-original (and hiding the
 *      shadow host) restores the live page.
 *
 * Bundle: this file ships inside content.js. We deep-import the site module
 * surfaces directly so the bundler can tree-shake everything else.
 */

import { h, render as preactRender } from 'preact';

import { mountLoader, applyHideOriginal, removeHideOriginal } from '../loader/index.js';
import { resolveModule } from '../sites/registry.js';
import {
  DEFAULT_DENSITY,
  DENSITY_VALUES,
  type Density,
  type SiteModule,
  type SiteRuntime,
} from '../sites/types.js';

import type { GetStatusReply, GetStatusRequest } from '../messages.js';
import { startSignalCollection } from './signals.js';

declare const __DEV__: boolean | undefined;
/** Safe accessor — `__DEV__` is a Vite define at build time but unset in tests. */
const isDev = (): boolean => {
  try {
    return typeof __DEV__ !== 'undefined' && __DEV__ === true;
  } catch {
    return false;
  }
};

const HOST_ID = 'onegov-root';
const MOUNT_ID = 'onegov-app';
const MIN_LOADER_HOLD_MS = 200;
/** The maximum z-index allowed by the spec. */
const MAX_Z_INDEX = 2147483647;

/**
 * Round-trip a typed request through `chrome.runtime.sendMessage`. Returns
 * `null` on transport failure (SW unreachable, port closed) so callers can
 * degrade cleanly.
 */
async function sendMessage(req: GetStatusRequest): Promise<GetStatusReply | null> {
  try {
    const reply = (await chrome.runtime.sendMessage(req)) as GetStatusReply | undefined;
    return reply ?? null;
  } catch {
    return null;
  }
}

/** Coerce raw storage value into the `Density` union. */
function coerceDensity(raw: unknown): Density {
  return typeof raw === 'string' && (DENSITY_VALUES as ReadonlyArray<string>).includes(raw)
    ? (raw as Density)
    : DEFAULT_DENSITY;
}

interface Settings {
  density: Density;
  /** v0.1.1 primary toggle (default true). */
  enabled: boolean;
  /** Legacy "afișează site-ul original" toggle (default false). */
  showOriginal: boolean;
}

async function readSettings(): Promise<Settings> {
  try {
    const stored = await chrome.storage.local.get([
      'uiDensity',
      'showOriginal',
      'extensionEnabled',
    ]);
    const enabledExplicit = stored['extensionEnabled'];
    const enabled = enabledExplicit === undefined ? true : enabledExplicit !== false;
    return {
      density: coerceDensity(stored['uiDensity']),
      enabled,
      showOriginal: stored['showOriginal'] === true,
    };
  } catch {
    return { density: DEFAULT_DENSITY, enabled: true, showOriginal: false };
  }
}

/**
 * Apply the full-viewport overlay styling to the host element. Pulled out so
 * the test suite can assert the exact contract. Carry-over from v0.1.1 with
 * one tweak: background uses `--onegov-color-bg` indirectly through the
 * host's child surface; the host itself stays white to avoid a flash if
 * tokens haven't loaded.
 */
function applyOverlayStyles(host: HTMLDivElement): void {
  const s = host.style;
  s.setProperty('position', 'fixed', 'important');
  s.setProperty('inset', '0', 'important');
  s.setProperty('top', '0', 'important');
  s.setProperty('left', '0', 'important');
  s.setProperty('right', '0', 'important');
  s.setProperty('bottom', '0', 'important');
  s.setProperty('width', '100%', 'important');
  s.setProperty('height', '100%', 'important');
  s.setProperty('margin', '0', 'important');
  s.setProperty('padding', '0', 'important');
  s.setProperty('z-index', String(MAX_Z_INDEX), 'important');
  s.setProperty('isolation', 'isolate', 'important');
  s.setProperty('background', '#ffffff', 'important');
  s.setProperty('color-scheme', 'light', 'important');
  s.setProperty('overflow-x', 'hidden', 'important');
  s.setProperty('overflow-y', 'auto', 'important');
  s.setProperty('display', 'block', 'important');
}

/**
 * Resolve once `document.body` exists. At `document_start` (the v0.2 anaf
 * lifecycle entry point) the body hasn't been parsed yet, so direct
 * `document.body.appendChild(host)` throws "Cannot read properties of null".
 * MutationObserver on documentElement is the canonical wait pattern; we add
 * a `readystatechange` fallback for browsers that don't deliver the
 * mutation in time.
 */
function waitForBody(): Promise<HTMLElement> {
  if (document.body) return Promise.resolve(document.body);
  return new Promise<HTMLElement>((resolve) => {
    const settle = (): boolean => {
      if (document.body) {
        observer.disconnect();
        document.removeEventListener('readystatechange', onState);
        resolve(document.body);
        return true;
      }
      return false;
    };
    const observer = new MutationObserver(() => {
      settle();
    });
    const onState = (): void => {
      settle();
    };
    observer.observe(document.documentElement, { childList: true });
    document.addEventListener('readystatechange', onState);
  });
}

/** Mount the closed shadow host. Awaits `document.body` because we may have
 *  been called at `document_start`, before the body is parsed. */
async function mountShadowHost(): Promise<{ host: HTMLDivElement; shadow: ShadowRoot }> {
  const body = await waitForBody();
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.dataset['onegov'] = '1';
  applyOverlayStyles(host);
  body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  return { host, shadow };
}

/**
 * Document scroll lock — narrow exception to invariant #1 (carry-over from
 * v0.1.1, documented at length in the previous content script).
 */
let previousDocumentOverflow: string | null = null;

function lockDocumentScroll(): void {
  if (previousDocumentOverflow !== null) return;
  previousDocumentOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
}

function unlockDocumentScroll(): void {
  if (previousDocumentOverflow === null) return;
  document.documentElement.style.overflow = previousDocumentOverflow;
  previousDocumentOverflow = null;
}

/**
 * Three host display modes:
 *   'overlay'  — full viewport, opaque, hide-original style applied (default
 *                when extensionEnabled && !showOriginal)
 *   'minimal'  — slim 48px strip at top of viewport, hide-original removed,
 *                original page visible underneath. The status bar stays
 *                mounted so the user can re-enable. Active when the user
 *                clicked "afișează site original" but extensionEnabled.
 *   'off'      — host hidden entirely, hide-original removed, original page
 *                fully visible. Active when extensionEnabled === false.
 */
type HostMode = 'overlay' | 'minimal' | 'off';

function setHostMode(host: HTMLDivElement, mode: HostMode): void {
  // eslint-disable-next-line no-console
  console.info('[onegov] setHostMode →', mode);
  switch (mode) {
    case 'overlay': {
      host.style.setProperty('display', 'block', 'important');
      host.style.setProperty('position', 'fixed', 'important');
      host.style.setProperty('inset', '0', 'important');
      host.style.setProperty('top', '0', 'important');
      host.style.setProperty('bottom', '0', 'important');
      host.style.setProperty('width', '100%', 'important');
      host.style.setProperty('height', '100%', 'important');
      host.style.setProperty('background', '#ffffff', 'important');
      host.style.setProperty('overflow-y', 'auto', 'important');
      host.style.setProperty('pointer-events', 'auto', 'important');
      lockDocumentScroll();
      applyHideOriginal();
      return;
    }
    case 'minimal': {
      // Slim strip at top — original page below is fully visible + interactive.
      host.style.setProperty('display', 'block', 'important');
      host.style.setProperty('position', 'fixed', 'important');
      host.style.setProperty('top', '0', 'important');
      host.style.setProperty('left', '0', 'important');
      host.style.setProperty('right', '0', 'important');
      host.style.setProperty('bottom', 'auto', 'important');
      host.style.setProperty('width', '100%', 'important');
      host.style.setProperty('height', '48px', 'important');
      host.style.setProperty('background', 'transparent', 'important');
      host.style.setProperty('overflow', 'visible', 'important');
      host.style.setProperty('pointer-events', 'none', 'important');
      // The status bar inside re-enables pointer-events on itself via the
      // anaf-statusbar class (see styles.ts). Body content not rendered.
      unlockDocumentScroll();
      removeHideOriginal();
      return;
    }
    case 'off': {
      host.style.setProperty('display', 'none', 'important');
      unlockDocumentScroll();
      removeHideOriginal();
      return;
    }
  }
}

/**
 * Inject the design-system theme stylesheet into the shadow root, then
 * (optionally) the site module's own CSS. Theme first so module styles can
 * read tokens; both are idempotent.
 */
async function injectStyles(shadow: ShadowRoot, moduleCss?: string): Promise<void> {
  const ownerDoc = shadow.ownerDocument;
  if (!ownerDoc) return;

  if (!shadow.querySelector('style[data-onegov-theme]')) {
    const { THEME_CSS } = await import('@onegov/ui');
    const style = ownerDoc.createElement('style');
    style.setAttribute('data-onegov-theme', '1');
    style.textContent = THEME_CSS;
    shadow.appendChild(style);
  }

  if (moduleCss && !shadow.querySelector('style[data-onegov-module]')) {
    const style = ownerDoc.createElement('style');
    style.setAttribute('data-onegov-module', '1');
    style.textContent = moduleCss;
    shadow.appendChild(style);
  }
}

/**
 * Activate the v0.2 takeover for the resolved site module.
 *
 * Steps mirror the §Lifecycle phases in `jobs/v0.2.0-anaf/01-anaf-takeover.md`.
 */
async function activate(mod: SiteModule): Promise<void> {
  const t0 = performance.now();
  // eslint-disable-next-line no-console
  console.info('[onegov] activate() entered for', mod.domain, 'at t0');
  const loader = mountLoader({
    mark: mod.loaderMark,
    subtitle: mod.loaderSubtitle,
  });

  // eslint-disable-next-line no-console
  console.info('[onegov] sending get-status to SW...');
  const statusReply = await sendMessage({ type: 'get-status', url: location.href });
  // eslint-disable-next-line no-console
  console.info('[onegov] SW reply:', statusReply ? statusReply.status?.kind ?? 'no-status-kind' : 'NULL (SW unreachable)');
  const status = statusReply?.status ?? null;
  if (!status || status.kind !== 'verified') {
    // eslint-disable-next-line no-console
    console.warn('[onegov] not verified — aborting. status:', status?.kind ?? 'null');
    loader.abort('Site nesuportat');
    return;
  }

  const settings = await readSettings();
  // showOriginal is a TRANSIENT per-tab toggle (peek at original) — never
  // persist it across page navigations. If the previous session left it
  // true in storage, clear it now so this page boots into the overlay.
  if (settings.showOriginal) {
    void chrome.storage.local.set({ showOriginal: false }).catch(() => {});
    settings.showOriginal = false;
  }

  // Mount shadow host (still hidden if user has overlay off). Awaits
  // document.body because we ran at document_start before body was parsed.
  // eslint-disable-next-line no-console
  console.info('[onegov] waiting for document.body...');
  const { host, shadow } = await mountShadowHost();
  // eslint-disable-next-line no-console
  console.info('[onegov] shadow host mounted, attaching styles + Preact');

  // Theme tokens + module CSS so the first paint inside the shadow root
  // has them.
  await injectStyles(shadow, mod.css);

  // Mount node for Preact.
  let mountNode = shadow.querySelector(`#${MOUNT_ID}`) as HTMLElement | null;
  if (!mountNode) {
    const ownerDoc = shadow.ownerDocument;
    if (!ownerDoc) {
      loader.abort();
      return;
    }
    mountNode = ownerDoc.createElement('div');
    mountNode.id = MOUNT_ID;
    shadow.appendChild(mountNode);
  }
  // Strict-mode requires a non-null reference for preactRender's parent;
  // freeze the local in a const so TS narrows correctly across closures.
  const mount: HTMLElement = mountNode;

  // Reflect density on the host so token cascades take effect.
  host.setAttribute('data-density', settings.density);

  // Build a typed runtime services bag the site module's App receives. Using
  // closures keeps the App free of chrome.* references.
  let currentDensity: Density = settings.density;
  let currentEnabled = settings.enabled;
  let currentShowOriginal = settings.showOriginal;

  const runtime: SiteRuntime = {
    density: currentDensity,
    showingOriginal: currentShowOriginal,
    showOriginal(): void {
      void chrome.storage.local.set({ showOriginal: true }).catch(() => {});
    },
    hideOriginal(): void {
      void chrome.storage.local.set({ showOriginal: false }).catch(() => {});
    },
    setDensity(next: Density): void {
      currentDensity = next;
      runtime.density = next;
      host.setAttribute('data-density', next);
      void chrome.storage.local.set({ uiDensity: next }).catch(() => {});
      // Re-render with the new density value.
      void renderApp();
    },
  };

  /** Extract context + render the App tree. Defensive against extractor throws. */
  function renderApp(): Promise<void> {
    let ctx: unknown;
    try {
      ctx = mod.extractContext(document, new URL(location.href));
      // eslint-disable-next-line no-console
      console.info('[onegov] extractContext OK');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[onegov] extractContext threw:', err);
      ctx = null;
    }
    try {
      preactRender(h(mod.App, { ctx, runtime }), mount);
      // eslint-disable-next-line no-console
      console.info('[onegov] preactRender OK');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[onegov] preactRender THREW — aborting loader:', err);
      // Critical: if the App can't render, don't leave the user on a splash.
      loader.abort('Eroare la randare');
      return Promise.resolve();
    }
    return Promise.resolve();
  }

  // eslint-disable-next-line no-console
  console.info('[onegov] mounting shadow + rendering App...');
  await renderApp();
  if (loader.disposed) {
    // renderApp aborted on render error — page already restored, nothing
    // more to do.
    return;
  }

  // Initial host mode based on the resolved settings:
  //   !enabled         → off    (extension disabled in popup)
  //   showOriginal     → minimal (slim status bar at top, original visible)
  //   default          → overlay (full takeover)
  const initialMode: HostMode =
    !currentEnabled ? 'off' : currentShowOriginal ? 'minimal' : 'overlay';
  setHostMode(host, initialMode);

  // Hold the loader for at least MIN_LOADER_HOLD_MS so the user sees the
  // transition rather than a snap.
  const elapsed = performance.now() - t0;
  const holdRemaining = Math.max(0, MIN_LOADER_HOLD_MS - elapsed);
  // eslint-disable-next-line no-console
  console.info('[onegov] dismissing loader in', Math.round(holdRemaining), 'ms (elapsed since t0:', Math.round(elapsed), 'ms)');
  setTimeout(() => loader.dismiss(), holdRemaining);

  // Start passive signal collection (carry-over from v0.1.1 — feeds the
  // background SW's persona inference even though the popup no longer
  // surfaces persona by default).
  startSignalCollection();

  // Storage subscription — density + escape hatch.
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    if (changes['uiDensity']) {
      const next = coerceDensity(changes['uiDensity'].newValue);
      if (next !== currentDensity) {
        currentDensity = next;
        runtime.density = next;
        host.setAttribute('data-density', next);
        void renderApp();
      }
    }

    if (changes['extensionEnabled'] !== undefined || changes['showOriginal'] !== undefined) {
      const enabledChange = changes['extensionEnabled'];
      const showOriginalChange = changes['showOriginal'];
      const enabled =
        enabledChange !== undefined ? enabledChange.newValue !== false : currentEnabled;
      const showOriginal =
        showOriginalChange !== undefined
          ? showOriginalChange.newValue === true
          : currentShowOriginal;
      currentEnabled = enabled;
      currentShowOriginal = showOriginal;
      // 3-state mode: off (extension disabled) > minimal (peek at original
      // with slim status bar) > overlay (full takeover).
      const nextMode: HostMode = !enabled ? 'off' : showOriginal ? 'minimal' : 'overlay';
      setHostMode(host, nextMode);
      // Tell the App about the new showingOriginal so it skips renderRoute()
      // and only mounts the StatusBar — the body content disappears in
      // 'minimal' mode but the bar stays so the user can re-enable.
      runtime.showingOriginal = showOriginal;
      void renderApp();
    }
  });
}

/**
 * Entry point. Resolve the site module first; bail without side effects when
 * no module owns the current URL (other 5 ship-list sites).
 */
async function main(): Promise<void> {
  let url: URL;
  try {
    url = new URL(location.href);
  } catch {
    return;
  }

  const mod = resolveModule(url);
  if (!mod) {
    if (isDev()) {
      // eslint-disable-next-line no-console
      console.info('[onegov] no site module for', url.hostname, '— exiting');
    }
    // v0.2.0: only anaf.ro gets the takeover UI; other sites await per-site
    // modules. Verified-domain badge on the toolbar is owned by the SW;
    // nothing to do here.
    return;
  }

  if (isDev()) {
    // eslint-disable-next-line no-console
    console.info('[onegov] site module matched:', mod.domain, '— activating');
  }

  await activate(mod);
}

void main();

export {};
