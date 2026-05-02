/**
 * Content script — runs in the page's isolated world at `document_idle`.
 *
 * Architectural choice (per task spec, option 2): the heavy modules
 * (`verifyDomain` + `loadBundled` from `@onegov/core`) live in the
 * background service worker. This script only does extraction + rendering,
 * so the bundle stays under the 80 KB gzipped cap.
 *
 * Lifecycle:
 *   1. Ask the background SW: `{ type: 'get-status', url: location.href }`
 *      → SW replies with the same `DomainStatus` it used to paint the icon.
 *   2. If `verified`, ask the SW for the bundled rule pack:
 *      `{ type: 'load-pack', domain }` → SW fetches + Zod-validates and
 *      replies with the typed `RulePack` (or `null`).
 *   3. Pick the first `Route` whose `match.pattern` regex matches
 *      `location.pathname`.
 *   4. Read persona from `chrome.storage.local`; default `standard`.
 *   5. Apply persona overrides to the route (via `applyPersonaOverrides`).
 *   6. Wrap `document` in a `SerializableDoc` adapter and run
 *      `extract(rules, doc, location.href)` → `SemanticTree`.
 *   7. Append a closed shadow host (`<div id="onegov-root" data-onegov="1">`)
 *      to `<body>` and mount the persona-adapted Preact app via
 *      `render(tree, persona, shadow)` from `@onegov/ui`.
 *   8. Subscribe to `chrome.storage.onChanged`:
 *      - persona switch → re-extract (in case the override hides a rule we
 *        previously emitted) and re-render.
 *      - `showOriginal` toggle → set `host.style.display` accordingly.
 *
 * Invariants enforced here (see CLAUDE.md §The five invariants):
 *   #1 Original DOM untouched. The ONLY mutation is appending the shadow
 *      host node, exactly once. We never write attributes on existing
 *      elements, never remove nodes, never call MutationObserver into a
 *      writeback path.
 *   #2 No form data. The `SerializableDoc` adapter exposes neither
 *      `.value` nor `.elements` nor `FormData`. We READ form structure
 *      through `extract` rules but never pull user-entered values.
 *   #3 No remote code. No `eval`, no `Function`, no `innerHTML =`. Rule-
 *      pack data is rendered exclusively through Preact JSX (escaped).
 *   #4 No external network. The only `fetch()` happens in the BACKGROUND
 *      SW against `chrome.runtime.getURL` for bundled rule packs. This
 *      content script makes ZERO network calls — it routes through
 *      `chrome.runtime.sendMessage`.
 *   #5 Escape works. Toggling `showOriginal` in storage flips
 *      `host.style.display` to `'none'` so the entire overlay vanishes
 *      and the original page is fully interactive underneath.
 *
 * Bundle-size discipline: deep-imports `extract` and
 * `applyPersonaOverrides` from `@onegov/core` (avoiding the barrel which
 * also exports `verifyDomain` + `loadBundled`, pulling psl + idna +
 * Zod). The renderer is a single import from `@onegov/ui` because all
 * code paths route through it.
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

declare const __DEV__: boolean;

const HOST_ID = 'onegov-root';
const PERSONAS_VALID: ReadonlySet<Persona> = new Set([
  'pensioner',
  'standard',
  'pro',
  'journalist',
] satisfies Persona[]);
const DEFAULT_PERSONA: Persona = 'standard';

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

/** Read persona + showOriginal from `chrome.storage.local`, with defaults. */
async function readSettings(): Promise<{ persona: Persona; showOriginal: boolean }> {
  try {
    const stored = await chrome.storage.local.get(['persona', 'showOriginal']);
    return {
      persona: coercePersona(stored['persona']),
      showOriginal: stored['showOriginal'] === true,
    };
  } catch {
    return { persona: DEFAULT_PERSONA, showOriginal: false };
  }
}

/**
 * Build the `SemanticTree` for `route` under `persona`. Encapsulates the
 * persona-override + extraction step so re-renders on persona change run
 * the same code path.
 */
function buildTree(route: Route, persona: Persona, url: string, domain: string): SemanticTree {
  const adapted = applyPersonaOverrides(route, persona);
  const base = extract(adapted.extract, wrapDocument(document), url);
  return { ...base, domain, layout: adapted.layout };
}

/**
 * Pick the first `Route` whose pathname pattern matches. Bad regex strings
 * yield `null` (the route is silently skipped) — a malformed pack is a build
 * defect that surfaces in pack validation, not at render time here.
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
 * Mount the shadow host. Closed-mode by hard rule (CLAUDE.md). The host is
 * a single sibling div under `<body>` carrying a stable id + the
 * `data-onegov` marker the renderer keys off of. Returns the host (so the
 * caller can flip `style.display` for the escape hatch) and the closed
 * shadow root (so the caller can hand it to `render`).
 */
function mountShadowHost(): { host: HTMLDivElement; shadow: ShadowRoot } {
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.dataset['onegov'] = '1';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  return { host, shadow };
}

/**
 * Activate the overlay for a verified domain. All side effects (DOM mutation,
 * storage subscriptions) are concentrated here so `main()` stays readable.
 */
async function activate(domain: string, pack: RulePack): Promise<void> {
  const route = matchRoute(pack, location.pathname);
  if (!route) return; // No route matches — exit cleanly, leave page untouched.

  const { persona: initialPersona, showOriginal: initialHidden } = await readSettings();
  const { host, shadow } = mountShadowHost();

  // Track the current route + persona in closure so re-renders can recompute
  // without rerouting (the route is fixed for the page lifetime — SPA route
  // changes are out of scope for v0.1).
  let currentPersona: Persona = initialPersona;
  let currentTree: SemanticTree = buildTree(route, currentPersona, location.href, domain);
  render(currentTree, currentPersona, shadow);

  if (initialHidden) host.style.display = 'none';

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

    if (changes['showOriginal']) {
      const hide = changes['showOriginal'].newValue === true;
      host.style.display = hide ? 'none' : '';
    }
  });
}

/**
 * Entry point. Awaits classification, then either activates or exits
 * cleanly. Wrapped in an async IIFE so top-level `await` doesn't tie us to
 * a particular bundler target — the IIFE runs once at `document_idle`.
 */
async function main(): Promise<void> {
  // 1. Ask the SW for the page's status.
  const statusReply = await sendMessage<GetStatusReply>({
    type: 'get-status',
    url: location.href,
  });
  const status: DomainStatus | null = statusReply?.status ?? null;
  if (!status || status.kind !== 'verified') {
    // Off-list, lookalike, or transport failure → render nothing. Invariant
    // #1 holds trivially — we did not append a single node.
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.debug(
        '[onegov] content script — exiting cleanly (status:',
        status?.kind ?? 'unreachable',
        ')',
      );
    }
    return;
  }

  // 2. Ask the SW for the bundled rule pack for this verified domain.
  const packReply = await sendMessage<LoadPackReply>({
    type: 'load-pack',
    domain: status.domain.domain,
  });
  const pack: RulePack | null = packReply?.pack ?? null;
  if (!pack) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.debug('[onegov] content script — no pack for', status.domain.domain);
    }
    return;
  }

  // 3. Activate the overlay.
  await activate(status.domain.domain, pack);
}

void main();

// Empty export keeps `isolatedModules` + the IIFE bundle target happy.
export {};
