/**
 * Loader — pre-paint splash + hide-original style.
 *
 * Runs at `document_start` from the content script, before the page paints
 * anything. The loader's job is twofold:
 *
 *   1. Append `<style id="onegov-hide-original">` so every body child except
 *      our own root + loader is `display: none !important`. The page never
 *      visually flashes its 1800s chrome — the user sees our splash from the
 *      first frame.
 *   2. Append `<div id="onegov-loader">` with an inlined splash (logo +
 *      breathing animation + delayed "Pregătim interfața..." hint).
 *
 * Constraints (per task spec §A):
 *   - Zero dependencies. No Preact, no module imports beyond a literal SVG
 *     string baked at build time. We need to mount in <5ms.
 *   - Pure DOM ops (createElement, appendChild). No `innerHTML` for any
 *     attacker-influenced data — only the controlled SVG literal goes in via
 *     a single innerHTML write to the icon node (its bytes are bundled).
 *   - Respects `prefers-reduced-motion`: hold-then-instant-swap, no fade.
 *   - Safety timeout (3000ms): if `dismiss()` was never called by the app
 *     mount path, auto-call `abort('Restaurăm site-ul original')` and remove
 *     the hide-original style so the user is never frozen on a splash.
 *
 * Invariants honored:
 *   - Original DOM untouched aside from three appended siblings under
 *     `<body>` (`<style id="onegov-hide-original">`, `<div id="onegov-loader">`,
 *     and — added later by the content script — `<div id="onegov-root">`).
 *   - No `eval`, no `Function`, no `setTimeout(string)`. Two `setTimeout`s
 *     here use function references only.
 *   - No external network. The logo SVG is a literal string baked into this
 *     module by Vite at build time.
 *
 * Bundle: this file ships inside content.js. Keep it tight — the IIFE bundle
 * has a 80 KB gz cap and the loader is the smallest part of the budget.
 */

const STYLE_ID = 'onegov-hide-original';
const LOADER_ID = 'onegov-loader';
const HOST_ID = 'onegov-root';

/** Safety: never leave the user staring at the splash. */
const SAFETY_TIMEOUT_MS = 3000;
/** Show the "Pregătim interfața..." hint after this delay. */
const HINT_DELAY_MS = 300;
/** Cross-fade duration on dismiss. */
const FADE_MS = 120;

/**
 * Inlined onegov logo (blue mark + wordmark) — taken verbatim from
 * `packages/extension/icons-src/onegov.logo.blue.svg`. Inlined so the loader
 * has zero asset-load latency. The `viewBox` and `aria-hidden` are intact;
 * we add a `width`/`height` at insertion time.
 */
const LOGO_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 358.95 66" aria-hidden="true">' +
  '<g><rect width="66" height="66" rx="20" ry="20" style="fill:#1a498f"/>' +
  '<path d="M23.34,17.75c-8.11,0-13.77,6.37-13.77,15.5s5.49,14.99,13.35,14.99c3.83,0,7.29-1.42,9.74-4,2.64-2.78,4.04-6.77,4.04-11.55,0-8.94-5.37-14.95-13.35-14.95ZM23.13,44.07c-4.08,0-8.46-3.41-8.46-10.9,0-5.6,2.63-11.24,8.5-11.24,4.08,0,8.46,3.43,8.46,10.95s-4.27,11.2-8.5,11.2Z" style="fill:#fff"/>' +
  '<path d="M45.9,31.69v4.13h5.77v7.48c-.94.35-2.5.55-4.29.55-6.39,0-10.36-4.16-10.36-10.86s4.15-10.82,10.82-10.82c3.01,0,4.81.63,6.03,1.17l.62.27,1.22-4.12-.45-.22c-1.37-.66-4.01-1.36-7.33-1.36-9.5,0-15.92,6.13-15.96,15.25,0,4.45,1.51,8.46,4.14,11,2.76,2.63,6.36,3.91,11.02,3.91,3.7,0,6.89-.87,8.92-1.59l.39-.14v-14.65h-10.53Z" style="fill:#fff"/>' +
  '<ellipse cx="22.94" cy="33.26" rx="5.3" ry="7.42" style="fill:#fff"/>' +
  '<path d="M130.31,34.42c0,18.23-11.06,29.29-27.31,29.29s-26.15-12.46-26.15-28.3c0-16.67,10.64-29.12,27.06-29.12s26.4,12.79,26.4,28.13ZM90.13,35.16c0,10.89,5.12,18.56,13.53,18.56s13.37-8.09,13.37-18.89c0-9.98-4.79-18.56-13.45-18.56s-13.45,8.08-13.45,18.89Z" style="fill:#1a498f"/>' +
  '<path d="M123.61,62.8V7.19h14.69l11.55,20.38c3.3,5.86,6.6,12.79,9.08,19.06h.25c-.82-7.34-1.07-14.85-1.07-23.18V7.19h11.55v55.61h-13.2l-11.88-21.45c-3.3-5.94-6.93-13.12-9.65-19.64l-.25.08c.33,7.34.5,15.18.5,24.26v16.75h-11.55Z" style="fill:#1a498f"/>' +
  '<path d="M193.42,39.28h-20.46v13.2h22.85v10.31h-35.48V7.19h34.32v10.31h-21.7v11.55h20.46v10.23Z" style="fill:#1a498f"/>' +
  '<path d="M256.92,60.24c-3.88,1.32-11.22,3.13-18.56,3.13-10.15,0-17.49-2.56-22.61-7.51-5.12-4.79-7.92-12.04-7.84-20.21.08-18.48,13.53-29.04,31.76-29.04,7.18,0,12.71,1.4,15.43,2.72l-2.64,10.07c-3.05-1.32-6.85-2.39-12.95-2.39-10.48,0-18.4,5.94-18.4,17.99s7.18,18.23,17.49,18.23c2.89,0,5.2-.33,6.19-.83v-11.63h-8.58v-9.82h20.71v29.29Z" style="fill:#1a498f"/>' +
  '<path d="M312.55,34.42c0,18.23-11.06,29.29-27.31,29.29s-26.15-12.46-26.15-28.3c0-16.67,10.64-29.12,27.06-29.12s26.4,12.79,26.4,28.13ZM272.37,35.16c0,10.89,5.12,18.56,13.53,18.56s13.37-8.09,13.37-18.89c0-9.98-4.79-18.56-13.45-18.56s-13.45,8.08-13.45,18.89Z" style="fill:#1a498f"/>' +
  '<path d="M325.53,62.8l-17.82-55.61h13.78l6.77,23.51c1.9,6.6,3.63,12.95,4.95,19.88h.25c1.4-6.68,3.14-13.28,5.03-19.64l7.1-23.76h13.37l-18.73,55.61h-14.69Z" style="fill:#1a498f"/>' +
  '<ellipse cx="103.42" cy="34.86" rx="11.74" ry="16.44" style="fill:#1a498f"/>' +
  '</g></svg>';

/**
 * The CSS that hides the original page chrome and styles the splash. Kept as
 * a literal string so we can ship it as one `textContent` write — no parser
 * traffic, no innerHTML.
 */
const LOADER_CSS = [
  // Hide-original — nothing in the body paints except our two siblings.
  `body > *:not(#${HOST_ID}):not(#${LOADER_ID}){display:none!important}`,
  // Loader splash positioning.
  `#${LOADER_ID}{position:fixed;inset:0;z-index:2147483647;display:flex;`,
  `flex-direction:column;align-items:center;justify-content:center;gap:24px;`,
  `background:#ffffff;color:#1a498f;font:14px/1.4 Arial,Calibri,Verdana,Tahoma,Trebuchet MS,Ubuntu,sans-serif;`,
  `transition:opacity ${String(FADE_MS)}ms ease-out;will-change:opacity}`,
  // Logo: subtle breathing animation (1.8s, 0.92→1.0).
  `#${LOADER_ID} .l-logo{width:200px;height:auto;animation:onegov-breathe 1.8s ease-in-out infinite}`,
  `#${LOADER_ID} .l-logo svg{display:block;width:100%;height:auto}`,
  // Hint text — hidden by default, fades in via .l-hint--visible.
  `#${LOADER_ID} .l-hint{opacity:0;transition:opacity 180ms ease-out;color:#5b6b7d;font-size:13px;letter-spacing:0.01em}`,
  `#${LOADER_ID} .l-hint--visible{opacity:1}`,
  // Spinner-less; the breathing logo IS the activity indicator.
  // Reduced motion: kill animations + transitions, keep the visual.
  `@keyframes onegov-breathe{0%,100%{opacity:.92;transform:scale(.98)}50%{opacity:1;transform:scale(1)}}`,
  `@media (prefers-reduced-motion:reduce){`,
  `#${LOADER_ID}{transition:none}`,
  `#${LOADER_ID} .l-logo{animation:none}`,
  `#${LOADER_ID} .l-hint{transition:none}`,
  `}`,
].join('');

/**
 * Returned by `mountLoader()`. The caller (content script) uses these to:
 *   - `dismiss()` after the app mount completes successfully (cross-fade out).
 *   - `abort(reason?)` if mount fails — also removes hide-original style so
 *     the original page becomes visible/interactive immediately.
 */
export interface LoaderHandle {
  /** Cross-fade out and remove the loader. Hide-original style stays in place. */
  dismiss(): void;
  /** Tear everything down — loader + hide-original style. Restores page. */
  abort(reason?: string): void;
  /** True when the loader has been dismissed or aborted (idempotency guard). */
  readonly disposed: boolean;
}

/**
 * Mount the splash and append the hide-original style to `<body>`.
 *
 * Idempotent: if a loader (or hide-style) already exists with the known ids,
 * we leave them in place and return a fresh handle that operates on the
 * existing nodes. This makes the loader safe to call from any reload path.
 *
 * Performance: under 5ms in practice — three `createElement`s, two CSS string
 * writes, one DOM mutation per element. No layout-thrashing reads.
 */
export function mountLoader(): LoaderHandle {
  const doc = document;
  const body = doc.body || doc.documentElement;
  if (!body) {
    // No body yet (extremely early — happy-dom edge case). Fall back to a
    // no-op handle so the caller never crashes; the safety timeout will not
    // fire because we never installed it.
    return makeNoopHandle();
  }

  // Idempotency: re-use the existing nodes if a previous call mounted them.
  let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement('style');
    style.id = STYLE_ID;
    style.textContent = LOADER_CSS;
    body.appendChild(style);
  }

  let loaderEl = doc.getElementById(LOADER_ID) as HTMLDivElement | null;
  if (!loaderEl) {
    loaderEl = doc.createElement('div');
    loaderEl.id = LOADER_ID;
    loaderEl.setAttribute('role', 'status');
    loaderEl.setAttribute('aria-live', 'polite');
    loaderEl.setAttribute('aria-label', 'Se încarcă onegov');

    const logo = doc.createElement('div');
    logo.className = 'l-logo';
    // Single, controlled innerHTML write — value is the literal LOGO_SVG
    // baked at build time. No attacker-influenced data ever flows here.
    logo.innerHTML = LOGO_SVG;
    loaderEl.appendChild(logo);

    const hint = doc.createElement('div');
    hint.className = 'l-hint';
    hint.textContent = 'Pregătim interfața...';
    loaderEl.appendChild(hint);

    body.appendChild(loaderEl);
  }

  // Reveal the hint after HINT_DELAY_MS (only if loader still mounted).
  let disposed = false;
  const hintTimer = setTimeout(() => {
    if (disposed) return;
    const hint = loaderEl?.querySelector('.l-hint');
    if (hint) hint.classList.add('l-hint--visible');
  }, HINT_DELAY_MS);

  // Safety timeout — auto-restore page if app mount never calls dismiss().
  let safetyTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    if (disposed) return;
    // eslint-disable-next-line no-console
    console.warn('[onegov] loader safety timeout — restoring original page');
    abort('Restaurăm site-ul original');
  }, SAFETY_TIMEOUT_MS);

  function clearTimers(): void {
    clearTimeout(hintTimer);
    if (safetyTimer !== null) {
      clearTimeout(safetyTimer);
      safetyTimer = null;
    }
  }

  function reducedMotion(): boolean {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return false;
    }
  }

  function removeLoaderEl(): void {
    if (loaderEl && loaderEl.parentNode) {
      loaderEl.parentNode.removeChild(loaderEl);
    }
  }

  function removeStyleEl(): void {
    if (style && style.parentNode) {
      style.parentNode.removeChild(style);
    }
  }

  function dismiss(): void {
    if (disposed) return;
    disposed = true;
    clearTimers();
    if (!loaderEl) return;

    if (reducedMotion()) {
      removeLoaderEl();
      return;
    }

    // Cross-fade then remove. The transition is in our CSS; setting opacity
    // schedules the transition. After FADE_MS, remove from DOM.
    loaderEl.style.opacity = '0';
    setTimeout(removeLoaderEl, FADE_MS);
  }

  function abort(_reason?: string): void {
    if (disposed) return;
    disposed = true;
    clearTimers();
    removeLoaderEl();
    // Critical: remove the hide-original style too so the page becomes
    // visible + interactive again.
    removeStyleEl();
  }

  return {
    dismiss,
    abort,
    get disposed(): boolean {
      return disposed;
    },
  };
}

/**
 * Remove ONLY the hide-original style — used by the content script when
 * the popup toggles "show original site". The shadow host's display is
 * managed separately. Re-applied via `applyHideOriginal()` below.
 */
export function removeHideOriginal(): void {
  const el = document.getElementById(STYLE_ID);
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

/**
 * Re-apply the hide-original style if it was previously removed (toggle on).
 * Idempotent — no-op if the style is already present.
 */
export function applyHideOriginal(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = LOADER_CSS;
  const body = document.body || document.documentElement;
  if (body) body.appendChild(style);
}

/** Used when there's no body — keeps the contract intact. */
function makeNoopHandle(): LoaderHandle {
  let disposed = false;
  return {
    dismiss(): void {
      disposed = true;
    },
    abort(): void {
      disposed = true;
    },
    get disposed(): boolean {
      return disposed;
    },
  };
}
