/**
 * Persona inference (v0.1.1) — rules-based classifier.
 *
 * Lives in the background SW so the per-tab signals collected by the content
 * script (tab-key usage rate, dwell time, scroll velocity) can fold into a
 * single rolling window without leaking from one tab's lifetime to the next.
 * Storage is `chrome.storage.session` so signals reset on browser restart;
 * privacy-by-default — nothing here ever leaves the device, nothing is
 * persisted across sessions.
 *
 * Signals tracked:
 *   - tab-usage rate     keys-with-Tab / total keystrokes (rolling sum)
 *   - dwell time         ms a tab stayed visible before navigation (last N)
 *   - scroll velocity    px/s (last N)
 *
 * Classification rules (start simple, refine):
 *   - `pro`        Tab usage > 30%        OR avg dwell < 30s
 *   - `pensioner`  avg dwell > 120s       AND avg scroll velocity < 100 px/s
 *   - `journalist` avg dwell 30..120s     AND tab usage 15..30%
 *   - `standard`   default
 *
 * The rolling window is bounded by `MAX_SAMPLES` so storage cannot grow
 * unbounded — older samples are discarded on the right.
 *
 * ⚠️ IMPORTANT: this module reads `chrome.storage.session`. In Chrome MV3
 * `session` is in-memory only and bounded; that is the privacy-preserving
 * choice (no persistence across browser restart). If `session` storage is
 * unavailable (older Chrome versions, test harness without the API) we fall
 * back to in-process state and behave the same way for the rest of the SW
 * lifetime — never throwing into the message handler.
 */

import type { Persona } from '@onegov/core';

import type { RecordSignalRequest } from '../messages.js';

const MAX_SAMPLES = 32;
const STORAGE_KEY = 'onegov-persona-signals';

export interface SignalState {
  tabUsage: { tabKeys: number; totalKeys: number };
  dwellMs: number[];
  scrollPxPerSec: number[];
}

const EMPTY: SignalState = { tabUsage: { tabKeys: 0, totalKeys: 0 }, dwellMs: [], scrollPxPerSec: [] };

/** In-memory fallback when `chrome.storage.session` is missing. */
let inProcess: SignalState = { ...EMPTY, dwellMs: [], scrollPxPerSec: [] };

/**
 * Best-effort read. Anything that throws collapses to in-process state so
 * the caller never has to defend against storage failures. Also tolerates
 * `chrome.storage` itself being absent (older Chromes / test stubs).
 */
async function readState(): Promise<SignalState> {
  const storage = (globalThis as { chrome?: { storage?: { session?: chrome.storage.StorageArea } } })
    .chrome?.storage;
  const session = storage?.session;
  if (!session) return inProcess;
  try {
    const out = await session.get([STORAGE_KEY]);
    const raw = out[STORAGE_KEY];
    if (!raw || typeof raw !== 'object') return { ...EMPTY, dwellMs: [], scrollPxPerSec: [] };
    const r = raw as Partial<SignalState>;
    return {
      tabUsage: {
        tabKeys: typeof r.tabUsage?.tabKeys === 'number' ? r.tabUsage.tabKeys : 0,
        totalKeys: typeof r.tabUsage?.totalKeys === 'number' ? r.tabUsage.totalKeys : 0,
      },
      dwellMs: Array.isArray(r.dwellMs)
        ? r.dwellMs.filter((n): n is number => typeof n === 'number')
        : [],
      scrollPxPerSec: Array.isArray(r.scrollPxPerSec)
        ? r.scrollPxPerSec.filter((n): n is number => typeof n === 'number')
        : [],
    };
  } catch {
    return inProcess;
  }
}

async function writeState(state: SignalState): Promise<void> {
  inProcess = state;
  const storage = (globalThis as { chrome?: { storage?: { session?: chrome.storage.StorageArea } } })
    .chrome?.storage;
  const session = storage?.session;
  if (!session) return;
  try {
    await session.set({ [STORAGE_KEY]: state });
  } catch {
    /* swallow — in-process fallback already updated */
  }
}

/** Bound an array to its last N elements (right-side window). */
function pushBounded<T>(arr: ReadonlyArray<T>, value: T, max: number): T[] {
  const next = arr.length >= max ? arr.slice(arr.length - max + 1) : arr.slice();
  next.push(value);
  return next;
}

/**
 * Fold a single signal into the rolling window. Pure-ish — reads + writes
 * `chrome.storage.session` (or the in-process fallback). Always resolves;
 * never throws.
 */
export async function recordSignal(signal: RecordSignalRequest['signal']): Promise<void> {
  const state = await readState();
  let next: SignalState = state;
  switch (signal.kind) {
    case 'tab-usage': {
      // Add to running totals; cap to a reasonable horizon so old signals
      // decay rather than dominating forever. We cap at MAX_SAMPLES * 100
      // keystrokes total — generous enough for real use, bounded enough that
      // a single anomalous burst doesn't lock the inference for the session.
      const cap = MAX_SAMPLES * 100;
      let tabKeys = state.tabUsage.tabKeys + Math.max(0, signal.tabKeys);
      let totalKeys = state.tabUsage.totalKeys + Math.max(0, signal.totalKeys);
      if (totalKeys > cap) {
        const ratio = cap / totalKeys;
        tabKeys = Math.round(tabKeys * ratio);
        totalKeys = cap;
      }
      next = { ...state, tabUsage: { tabKeys, totalKeys } };
      break;
    }
    case 'dwell': {
      if (Number.isFinite(signal.ms) && signal.ms >= 0) {
        next = { ...state, dwellMs: pushBounded(state.dwellMs, signal.ms, MAX_SAMPLES) };
      }
      break;
    }
    case 'scroll': {
      if (Number.isFinite(signal.pxPerSec) && signal.pxPerSec >= 0) {
        next = {
          ...state,
          scrollPxPerSec: pushBounded(state.scrollPxPerSec, signal.pxPerSec, MAX_SAMPLES),
        };
      }
      break;
    }
  }
  await writeState(next);
}

function avg(arr: ReadonlyArray<number>): number | null {
  if (arr.length === 0) return null;
  let sum = 0;
  for (const n of arr) sum += n;
  return sum / arr.length;
}

export interface InferenceResult {
  persona: Persona;
  reason: string;
}

/**
 * Pure classifier — exposed so unit tests can drive synthetic state without
 * touching `chrome.storage.session`. Reasons are Romanian, popup-ready.
 */
export function classifyFromState(state: SignalState): InferenceResult {
  const tabRatio =
    state.tabUsage.totalKeys > 0
      ? state.tabUsage.tabKeys / state.tabUsage.totalKeys
      : null;
  const dwellAvg = avg(state.dwellMs);
  const scrollAvg = avg(state.scrollPxPerSec);

  const pristine =
    tabRatio === null && dwellAvg === null && scrollAvg === null;
  if (pristine) {
    return { persona: 'standard', reason: 'încă învăț tiparul tău' };
  }

  if ((tabRatio !== null && tabRatio > 0.3) || (dwellAvg !== null && dwellAvg < 30_000)) {
    return {
      persona: 'pro',
      reason: tabRatio !== null && tabRatio > 0.3 ? 'folosești des Tab' : 'sesiuni scurte, ritm rapid',
    };
  }

  if (
    dwellAvg !== null &&
    dwellAvg > 120_000 &&
    scrollAvg !== null &&
    scrollAvg < 100
  ) {
    return { persona: 'pensioner', reason: 'sesiuni lungi, mișcare lentă' };
  }

  if (
    dwellAvg !== null &&
    dwellAvg >= 30_000 &&
    dwellAvg <= 120_000 &&
    tabRatio !== null &&
    tabRatio >= 0.15 &&
    tabRatio <= 0.3
  ) {
    return { persona: 'journalist', reason: 'navigare diversă, ritm mediu' };
  }

  return { persona: 'standard', reason: 'tipar echilibrat' };
}

/** Convenience: read current state and classify. Used by the message handler. */
export async function classifyPersona(): Promise<InferenceResult> {
  const state = await readState();
  return classifyFromState(state);
}

/** Test-only — clear in-process state. Not exported via index. */
export function __resetForTests(): void {
  inProcess = { ...EMPTY, dwellMs: [], scrollPxPerSec: [] };
}
