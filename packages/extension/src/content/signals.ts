/**
 * Persona-inference signal collector (v0.1.1).
 *
 * Tracks three lightweight behavioural signals while the overlay is active
 * and forwards rolled-up summaries to the background SW. Intended to be
 * unobtrusive — listeners are passive, never preventDefault, never block
 * the page's own handlers.
 *
 * Signals:
 *   - tab-usage   keys-with-Tab / total keystrokes
 *                 Flushed every FLUSH_KEY_THRESHOLD keystrokes (or on unload)
 *                 so the SW can update its rolling window in chunks.
 *   - dwell       ms the page was visible before unload / tab hide
 *                 Flushed once per session (when document becomes hidden /
 *                 pagehide fires).
 *   - scroll      px/s, computed from a rolling window of scroll deltas
 *                 Flushed every FLUSH_SCROLL_THRESHOLD scroll events.
 *
 * No PII. No URLs. No timestamps. Numerical aggregates only.
 *
 * The collector exposes a single public function `startSignalCollection()`
 * which the content script's `activate()` calls after the overlay mounts.
 * The function returns void; the listeners detach themselves on `pagehide`
 * to avoid leaking across SPA navigations (out of scope for v0.1 but cheap
 * defence).
 */

import type { RecordSignalRequest } from '../messages.js';

const FLUSH_KEY_THRESHOLD = 50;
const FLUSH_SCROLL_THRESHOLD = 30;

interface KeyState {
  tabKeys: number;
  totalKeys: number;
}

interface ScrollState {
  /** Rolling window of (deltaPx, deltaMs) tuples. */
  samples: Array<{ dPx: number; dMs: number }>;
  lastY: number;
  lastT: number;
}

const SCROLL_WINDOW = 16;

/**
 * Send a signal to the SW. Fire-and-forget — failures are silently swallowed
 * because telemetry is best-effort and we never block the page on our own
 * messaging.
 */
function sendSignal(signal: RecordSignalRequest['signal']): void {
  try {
    void chrome.runtime
      .sendMessage({ type: 'record-signal', signal } satisfies RecordSignalRequest)
      .catch(() => {
        /* swallow */
      });
  } catch {
    /* swallow — chrome.runtime missing or sendMessage threw synchronously */
  }
}

function flushKeys(state: KeyState): void {
  if (state.totalKeys === 0) return;
  sendSignal({ kind: 'tab-usage', tabKeys: state.tabKeys, totalKeys: state.totalKeys });
  state.tabKeys = 0;
  state.totalKeys = 0;
}

function flushScroll(state: ScrollState): void {
  if (state.samples.length === 0) return;
  let totalPx = 0;
  let totalMs = 0;
  for (const s of state.samples) {
    totalPx += s.dPx;
    totalMs += s.dMs;
  }
  if (totalMs <= 0) {
    state.samples.length = 0;
    return;
  }
  const pxPerSec = (totalPx * 1000) / totalMs;
  sendSignal({ kind: 'scroll', pxPerSec });
  state.samples.length = 0;
}

/**
 * Wire passive listeners on `document` / `window` to track the three
 * signals. Call once after the overlay mounts. The function is idempotent —
 * subsequent calls are no-ops (private flag check).
 */
let started = false;
let teardown: (() => void) | null = null;
export function startSignalCollection(): void {
  if (started) return;
  started = true;

  // Skip in non-browser environments (test stubs without happy-dom listeners).
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const keyState: KeyState = { tabKeys: 0, totalKeys: 0 };
  const scrollState: ScrollState = {
    samples: [],
    lastY: typeof window !== 'undefined' ? window.scrollY ?? 0 : 0,
    lastT: typeof performance !== 'undefined' ? performance.now() : Date.now(),
  };

  const dwellStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
  let dwellSent = false;

  const onKeyDown = (ev: KeyboardEvent): void => {
    keyState.totalKeys += 1;
    if (ev.key === 'Tab') keyState.tabKeys += 1;
    if (keyState.totalKeys >= FLUSH_KEY_THRESHOLD) flushKeys(keyState);
  };

  const onScroll = (): void => {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const y = window.scrollY ?? 0;
    const dPx = Math.abs(y - scrollState.lastY);
    const dMs = now - scrollState.lastT;
    scrollState.lastY = y;
    scrollState.lastT = now;
    if (dMs > 0 && dPx > 0) {
      scrollState.samples.push({ dPx, dMs });
      if (scrollState.samples.length > SCROLL_WINDOW) scrollState.samples.shift();
    }
    if (scrollState.samples.length >= FLUSH_SCROLL_THRESHOLD) flushScroll(scrollState);
  };

  const flushAll = (): void => {
    flushKeys(keyState);
    flushScroll(scrollState);
    if (!dwellSent) {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const ms = Math.max(0, Math.round(now - dwellStart));
      // Only emit a dwell signal if we actually spent time on the page —
      // avoids polluting the rolling window with millisecond-scale samples
      // from rapid tab-flick navigation.
      if (ms > 1000) sendSignal({ kind: 'dwell', ms });
      dwellSent = true;
    }
  };

  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') flushAll();
  };

  document.addEventListener('keydown', onKeyDown, { passive: true, capture: true });
  window.addEventListener('scroll', onScroll, { passive: true, capture: true });
  document.addEventListener('visibilitychange', onVisibilityChange, { passive: true });
  window.addEventListener('pagehide', flushAll, { passive: true });

  teardown = (): void => {
    document.removeEventListener('keydown', onKeyDown, { capture: true });
    window.removeEventListener('scroll', onScroll, { capture: true });
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', flushAll);
  };
}

/** Test-only — reset the started flag and detach listeners. Not exported via index. */
export function __resetSignalsForTests(): void {
  if (teardown) teardown();
  teardown = null;
  started = false;
}
