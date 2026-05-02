/**
 * Content script — runs in the page's isolated world at `document_idle`.
 *
 * v0.1.1 polish: the shadow host now claims the full viewport
 * (`position: fixed; inset: 0; z-index: 2147483647`) with an opaque
 * background so the original page is visually replaced rather than peeking
 * through. The owner explicitly approved this in the v0.1.1 task spec — the
 * five invariants still hold because the original DOM is untouched (only the
 * appended `<div id="onegov-root">` differs) and the toggle remains the
 * one-click escape hatch.
 *
 * Architectural choice (per task spec, option 2): the heavy modules
 * (`verifyDomain` + `loadBundled` from `@onegov/core`) live in the
 * background service worker. This script only does extraction + rendering,
 * so the bundle stays under the 80 KB gzipped cap.
 *
 * Lifecycle:
 *   1. Ask the background SW: `{ type: 'get-status', url: location.href }`
 *      → SW replies with the same `DomainStatus` it used to paint the icon.
 *   2. If `verified`, ask the SW for the bundled rule pack.
 *   3. Pick the first `Route` whose `match.pattern` regex matches.
 *   4. Read persona + extensionEnabled from `chrome.storage.local`.
 *   5. Apply persona overrides + extract → SemanticTree.
 *   6. Mount the closed shadow host with the full-viewport overlay styles.
 *   7. Render persona-adapted Preact app inside the shadow root. If the tree
 *      is sparse (<3 nodes), the persona layout falls back to a diagnostic
 *      banner so the user always sees a visible affordance.
 *   8. Subscribe to `chrome.storage.onChanged`:
 *      - persona switch → re-extract + re-render.
 *      - extensionEnabled / showOriginal toggle → flip overlay visibility +
 *        restore document scroll.
 *
 * ⚠️ ONE NARROW DOM EXCEPTION (deliberate, scoped, restored on toggle off):
 *
 *   While the overlay is visible we set `documentElement.style.overflow =
 *   'hidden'` so the page underneath does not scroll alongside the overlay's
 *   own scrollable inner column. When the overlay is toggled off (or the
 *   content script is told to hide), we restore the original inline value.
 *
 *   Invariant #1 forbids mutating "any non-`<div id="onegov-root">` node",
 *   and `documentElement` is the *original page's* root. The v0.1.1 task
 *   spec authorizes this exception explicitly because:
 *     - it is a single inline style toggle, not structural mutation;
 *     - it is fully reversible (we cache the old value and restore it);
 *     - without it the dual-scroll feels broken on every test page.
 *   Document this loudly: any future contributor MUST NOT extend this to
 *   other style properties or other elements without a similar review.
 *
 * Invariants enforced here:
 *   #1 Original DOM untouched. The ONLY structural mutation is appending
 *      the shadow host node, exactly once. The ONLY style mutation is the
 *      documented `documentElement.style.overflow` toggle above.
 *   #2 No form data. `SerializableDoc` exposes neither `.value` nor
 *      `.elements` nor `FormData`.
 *   #3 No remote code. Rule-pack data renders exclusively through Preact
 *      JSX (escaped). No `eval`, no `Function`, no `innerHTML =`.
 *   #4 No external network. ZERO `fetch()` here — every cross-context call
 *      goes through `chrome.runtime.sendMessage`.
 *   #5 Escape works. Toggling `extensionEnabled` (or legacy `showOriginal`)
 *      hides the overlay AND restores the document scroll, so the original
 *      page is fully interactive underneath.
 *
 * Bundle-size discipline: deep-imports `extract` and
 * `applyPersonaOverrides` from `@onegov/core` (avoiding the barrel).
 */

import { extract } from '../../../core/src/semantic-extractor.js';
import { applyPersonaOverrides } from '../../../core/src/persona.js';
import type { DomainStatus, Persona, Route, RulePack, SemanticTree } from '@onegov/core';
import { render } from '@onegov/ui';

import type {
  GetStatusReply,
  GetStatusRequest,
  LoadPackReply,
  LoadPackRequest,
} from '../messages.js';

import { wrapDocument } from './serializable-doc.js';
import { startSignalCollection } from './signals.js';

declare const __DEV__: boolean;

const HOST_ID = 'onegov-root';
const PERSONAS_VALID: ReadonlySet<Persona> = new Set([
  'pensioner',
  'standard',
  'pro',
  'journalist',
] satisfies Persona[]);
const DEFAULT_PERSONA: Persona = 'standard';

/** The maximum z-index the spec allows. Used to claim the viewport. */
const MAX_Z_INDEX = 2147483647;

/**
 * Round-trip a typed request through `chrome.runtime.sendMessage` and return
 * the typed reply. Returns `null` on transport failure (SW unreachable, port
 * closed mid-flight) so callers can degrade to a no-op cleanly.
 */
async function sendMessage<TReply>(
  request: GetStatusRequest | LoadPackRequest,
): Promise<TReply | null> {
  try {
    const reply = (await chrome.runtime.sendMessage(request)) as TReply | undefined;
    return reply ?? null;
  } catch {
    return null;
  }
}

/** Clamp a `chrome.storage.local` value into the `Persona` union. */
function coercePersona(raw: unknown): Persona {
  return typeof raw === 'string' && PERSONAS_VALID.has(raw as Persona)
    ? (raw as Persona)
    : DEFAULT_PERSONA;
}

interface Settings {
  persona: Persona;
  /** v0.1.1 primary toggle (default true). */
  enabled: boolean;
  /** Legacy "afișează site-ul original" toggle (default false). */
  showOriginal: boolean;
}

/**
 * Read persona + visibility from storage. Two keys are honored:
 *   - `extensionEnabled` (v0.1.1, default true) — primary on/off
 *   - `showOriginal` (legacy, default false) — original "afișează site-ul
 *     original" toggle. The popup writes both for back-compat.
 *
 * The caller computes "hidden" from these two values: `hidden = !enabled ||
 * showOriginal`. We expose them separately so the storage-change listener
 * can fold partial events without re-reading storage (avoids race with the
 * not-yet-flushed write the popup just made).
 */
async function readSettings(): Promise<Settings> {
  try {
    const stored = await chrome.storage.local.get([
      'persona',
      'showOriginal',
      'extensionEnabled',
    ]);
    const enabledExplicit = stored['extensionEnabled'];
    const enabled = enabledExplicit === undefined ? true : enabledExplicit !== false;
    return {
      persona: coercePersona(stored['persona']),
      enabled,
      showOriginal: stored['showOriginal'] === true,
    };
  } catch {
    return { persona: DEFAULT_PERSONA, enabled: true, showOriginal: false };
  }
}

/**
 * Build the `SemanticTree` for `route` under `persona`.
 */
function buildTree(route: Route, persona: Persona, url: string, domain: string): SemanticTree {
  const adapted = applyPersonaOverrides(route, persona);
  const base = extract(adapted.extract, wrapDocument(document), url);
  return { ...base, domain, layout: adapted.layout };
}

/**
 * Pick the first `Route` whose pathname pattern matches.
 */
function matchRoute(pack: RulePack, pathname: string): Route | null {
  for (const route of pack.routes) {
    let re: RegExp;
    try {
      re = new RegExp(route.match.pattern);
    } catch {
      continue;
    }
    if (re.test(pathname)) return route;
  }
  return null;
}

/**
 * Apply the full-viewport overlay styling to the host element. Pulled out so
 * the test suite can assert the exact contract (every style listed below MUST
 * be present; nothing else writes inline styles to the host except the
 * `display` toggle and the persona-driven background that comes through the
 * shadow root's `<style>` element, not the host).
 *
 * `setProperty(name, value, 'important')` is the safest path against pages
 * that ship aggressive `* { z-index: ... !important }` rules — the shadow
 * host is OUR element, but we still want our `position: fixed` to win.
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
  // Opaque background so the page underneath is visually replaced. The
  // persona theme's --onegov-color-bg cascades into the shadow root and
  // colors the inner content; the host itself stays the same neutral white
  // so a flicker between persona switches doesn't bleed through.
  s.setProperty('background', '#ffffff', 'important');
  s.setProperty('color-scheme', 'light', 'important');
  s.setProperty('overflow', 'hidden', 'important');
  s.setProperty('display', 'block', 'important');
}

/**
 * Mount the shadow host with the full-viewport overlay styles. Closed-mode
 * by hard rule (CLAUDE.md). The host is a single sibling div under `<body>`
 * carrying a stable id + the `data-onegov` marker the renderer keys off of.
 */
function mountShadowHost(): { host: HTMLDivElement; shadow: ShadowRoot } {
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.dataset['onegov'] = '1';
  applyOverlayStyles(host);
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  return { host, shadow };
}

/**
 * Document scroll lock. The overlay manages its own scroll; the page beneath
 * should NOT scroll while we're up. This is the one narrow exception to
 * invariant #1, documented at the top of this file.
 *
 * `previousOverflow` caches the inline value so we restore exactly what was
 * there — including an empty string, which means "no inline override".
 */
let previousDocumentOverflow: string | null = null;

function lockDocumentScroll(): void {
  if (previousDocumentOverflow !== null) return; // already locked
  previousDocumentOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = 'hidden';
}

function unlockDocumentScroll(): void {
  if (previousDocumentOverflow === null) return; // not locked
  document.documentElement.style.overflow = previousDocumentOverflow;
  previousDocumentOverflow = null;
}

/**
 * Set host visibility + lock/unlock the document scroll in one call so the
 * two stay in sync.
 */
function setOverlayVisible(host: HTMLDivElement, visible: boolean): void {
  if (visible) {
    host.style.setProperty('display', 'block', 'important');
    lockDocumentScroll();
  } else {
    host.style.setProperty('display', 'none', 'important');
    unlockDocumentScroll();
  }
}

/**
 * Activate the overlay for a verified domain. All side effects are
 * concentrated here so `main()` stays readable.
 */
async function activate(domain: string, pack: RulePack): Promise<void> {
  const route = matchRoute(pack, location.pathname);
  if (!route) {
    // eslint-disable-next-line no-console
    console.info(
      '[onegov] exiting — no route in pack matches pathname',
      location.pathname,
      '(routes:',
      pack.routes.map((r) => r.match.pattern).join(', '),
      ')',
    );
    return;
  }
  // eslint-disable-next-line no-console
  console.info('[onegov] route matched:', route.match.pattern, '— mounting overlay');

  const initial = await readSettings();
  const { host, shadow } = mountShadowHost();

  let currentPersona: Persona = initial.persona;
  let currentEnabled = initial.enabled;
  let currentShowOriginal = initial.showOriginal;
  let currentTree: SemanticTree = buildTree(route, currentPersona, location.href, domain);
  render(currentTree, currentPersona, shadow);

  const initiallyHidden = !currentEnabled || currentShowOriginal;
  setOverlayVisible(host, !initiallyHidden);

  // Start collecting persona-inference signals (tab-key usage, dwell time,
  // scroll velocity). Passive listeners only — never block the page.
  startSignalCollection();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    if (changes['persona']) {
      const next = coercePersona(changes['persona'].newValue);
      if (next !== currentPersona) {
        currentPersona = next;
        currentTree = buildTree(route, currentPersona, location.href, domain);
        render(currentTree, currentPersona, shadow);
      }
    }

    // Visibility — driven by either key. Compute the merged "should be
    // hidden" verdict from the change events themselves so we don't race
    // the underlying storage reads. The popup writes both keys atomically
    // via `chrome.storage.local.set`, but we still defend against partial
    // events by treating undefined as "no change to this key" and consulting
    // the cached current state.
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
      const hidden = !enabled || showOriginal;
      setOverlayVisible(host, !hidden);
    }
  });
}

/**
 * Entry point. Awaits classification, then either activates or exits cleanly.
 *
 * v0.1.1: visible (non-DEV-gated) `[onegov]` log lines so users can diagnose
 * "nothing happens on this site" from the browser console without a dev build.
 * Each log explains the lifecycle stage and why the script is doing what it
 * does. Quiet on the happy path (one line saying "active" + one per re-render).
 */
async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.info('[onegov] content script loaded on', location.href);

  const statusReply = await sendMessage<GetStatusReply>({
    type: 'get-status',
    url: location.href,
  });
  const status: DomainStatus | null = statusReply?.status ?? null;
  if (!status || status.kind !== 'verified') {
    // eslint-disable-next-line no-console
    console.info(
      '[onegov] exiting — domain not verified (status:',
      status?.kind ?? 'unreachable',
      ')',
    );
    return;
  }

  const packReply = await sendMessage<LoadPackReply>({
    type: 'load-pack',
    domain: status.domain.domain,
  });
  const pack: RulePack | null = packReply?.pack ?? null;
  if (!pack) {
    // eslint-disable-next-line no-console
    console.info('[onegov] exiting — no rule pack for', status.domain.domain);
    return;
  }

  // eslint-disable-next-line no-console
  console.info(
    '[onegov] verified domain',
    status.domain.domain,
    '— pack has',
    pack.routes.length,
    'route(s); checking against pathname',
    location.pathname,
  );

  await activate(status.domain.domain, pack);
}

void main();

// Empty export keeps `isolatedModules` + the IIFE bundle target happy.
export {};
