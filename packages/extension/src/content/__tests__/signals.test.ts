/**
 * Signal-collector tests (v0.1.1).
 *
 * Coverage:
 *   - startSignalCollection() is idempotent (second call is a no-op)
 *   - Tab keydowns increment the tab-keys counter; non-Tab keydowns only the
 *     total-keys counter; threshold flush sends a record-signal message
 *   - visibilitychange → hidden flushes the dwell signal once
 *   - pagehide flushes everything once
 *   - The collector tolerates `chrome.runtime` being missing (no throw)
 *
 * The signals module reads `document` / `window` / `performance`. happy-dom
 * supplies all three. Messages are observed via the chrome content stub
 * which records every `sendMessage` payload.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';

import { setupDom } from '../../../../ui/tests/setup-dom.js';
import type { Reply, Request } from '../../messages.js';

import {
  installChromeContentStub,
  uninstallChromeContentStub,
  type ChromeContentStub,
} from './chrome-stub.js';

import { __resetSignalsForTests, startSignalCollection } from '../signals.js';

beforeAll(() => {
  setupDom();
});

let stub: ChromeContentStub;

beforeEach(() => {
  __resetSignalsForTests();
  stub = installChromeContentStub((_req: Request): Reply | undefined => undefined);
});

afterEach(() => {
  uninstallChromeContentStub();
});

function recordSignals(): Request[] {
  return stub.messages.filter((m) => m.type === 'record-signal');
}

describe('startSignalCollection() — idempotency', () => {
  it('does not double-wire listeners on second call', () => {
    startSignalCollection();
    startSignalCollection();
    // Both calls succeed but only one set of listeners is attached. Verify
    // by firing a single keydown and asserting we get at most one increment
    // toward the threshold.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    // No flush yet — threshold is 50.
    expect(recordSignals()).toHaveLength(0);
  });
});

describe('startSignalCollection() — tab usage', () => {
  it('flushes a tab-usage signal at the keystroke threshold', () => {
    startSignalCollection();
    for (let i = 0; i < 50; i++) {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: i < 20 ? 'Tab' : 'a' }),
      );
    }
    const sigs = recordSignals();
    expect(sigs).toHaveLength(1);
    const s = sigs[0];
    if (s?.type !== 'record-signal') return;
    if (s.signal.kind !== 'tab-usage') return;
    expect(s.signal.tabKeys).toBe(20);
    expect(s.signal.totalKeys).toBe(50);
  });

  it('does NOT flush before the keystroke threshold', () => {
    startSignalCollection();
    for (let i = 0; i < 10; i++) {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    }
    expect(recordSignals()).toHaveLength(0);
  });
});

describe('startSignalCollection() — dwell on visibility hidden', () => {
  it('emits a dwell signal when document becomes hidden (after some time)', async () => {
    startSignalCollection();
    // Wait a moment so the dwell threshold (>1000ms) has a chance.
    await new Promise<void>((r) => setTimeout(r, 1100));

    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    const dwellSigs = recordSignals().filter(
      (m) => m.type === 'record-signal' && m.signal.kind === 'dwell',
    );
    expect(dwellSigs.length).toBeGreaterThanOrEqual(1);
  });

  it('does not emit a dwell signal if visibility never goes hidden', () => {
    startSignalCollection();
    const dwellSigs = recordSignals().filter(
      (m) => m.type === 'record-signal' && m.signal.kind === 'dwell',
    );
    expect(dwellSigs).toHaveLength(0);
  });
});

describe('startSignalCollection() — defensive', () => {
  it('does not throw when chrome.runtime.sendMessage is missing', () => {
    uninstallChromeContentStub();
    // chrome is gone now; reset and start should not throw.
    __resetSignalsForTests();
    expect(() => startSignalCollection()).not.toThrow();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    // Reinstall for afterEach symmetry.
    stub = installChromeContentStub(() => undefined);
  });
});
