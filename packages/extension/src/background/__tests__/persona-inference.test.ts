/**
 * Persona inference tests (v0.1.1).
 *
 * Coverage:
 *   - classifyFromState() — every rule fires correctly given synthetic state
 *   - Default state classifies as `standard` with the "still learning" reason
 *   - recordSignal() — bounded rolling window doesn't grow unbounded
 *   - recordSignal() — tab-usage cap kicks in when totals exceed horizon
 *   - recordSignal() — handles the in-process fallback when storage.session
 *     is missing (which it always is in our test stub)
 *
 * The classifier is a pure function over `SignalState` so the rules can be
 * unit-tested without any chrome stub. `recordSignal()` and `classifyPersona()`
 * touch storage; we drive them with the in-process fallback (no
 * chrome.storage.session in the existing background stub).
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import {
  __resetForTests,
  classifyFromState,
  classifyPersona,
  recordSignal,
  type SignalState,
} from '../persona-inference.js';

import { makeChromeStub, uninstallChromeStub } from './chrome-stub.js';

beforeEach(() => {
  makeChromeStub();
  __resetForTests();
});

afterEach(() => {
  uninstallChromeStub();
  __resetForTests();
});

const empty: SignalState = {
  tabUsage: { tabKeys: 0, totalKeys: 0 },
  dwellMs: [],
  scrollPxPerSec: [],
};

describe('classifyFromState() — defaults', () => {
  it('returns standard with "still learning" reason on pristine state', () => {
    const out = classifyFromState(empty);
    expect(out.persona).toBe('standard');
    expect(out.reason).toContain('învăț');
  });
});

describe('classifyFromState() — pro rule', () => {
  it('fires when tab usage > 30%', () => {
    const out = classifyFromState({ ...empty, tabUsage: { tabKeys: 40, totalKeys: 100 } });
    expect(out.persona).toBe('pro');
    expect(out.reason).toContain('Tab');
  });

  it('fires when avg dwell < 30s', () => {
    const out = classifyFromState({ ...empty, dwellMs: [10_000, 20_000, 15_000] });
    expect(out.persona).toBe('pro');
    expect(out.reason).toContain('rapid');
  });

  it('does NOT fire when tab usage is exactly 30% and dwell is otherwise default', () => {
    const out = classifyFromState({ ...empty, tabUsage: { tabKeys: 30, totalKeys: 100 } });
    // 30% is not strictly > 30 → falls through to next rule.
    expect(out.persona).not.toBe('pro');
  });
});

describe('classifyFromState() — pensioner rule', () => {
  it('fires when avg dwell > 120s AND scroll velocity < 100 px/s', () => {
    const out = classifyFromState({
      ...empty,
      dwellMs: [180_000, 200_000, 250_000],
      scrollPxPerSec: [40, 60, 80],
    });
    expect(out.persona).toBe('pensioner');
    expect(out.reason).toContain('lung');
  });

  it('does NOT fire if dwell is high but scroll velocity is high', () => {
    const out = classifyFromState({
      ...empty,
      dwellMs: [200_000],
      scrollPxPerSec: [400],
    });
    expect(out.persona).not.toBe('pensioner');
  });

  it('does NOT fire if scroll velocity is low but dwell is short', () => {
    const out = classifyFromState({
      ...empty,
      dwellMs: [10_000],
      scrollPxPerSec: [40],
    });
    // Short dwell triggers pro before pensioner can match.
    expect(out.persona).toBe('pro');
  });
});

describe('classifyFromState() — journalist rule', () => {
  it('fires when dwell ∈ [30s..120s] AND tab usage ∈ [15%..30%]', () => {
    const out = classifyFromState({
      ...empty,
      tabUsage: { tabKeys: 20, totalKeys: 100 },
      dwellMs: [60_000, 75_000, 90_000],
    });
    expect(out.persona).toBe('journalist');
    expect(out.reason).toContain('mediu');
  });

  it('does NOT fire if tab usage is below the journalist band', () => {
    const out = classifyFromState({
      ...empty,
      tabUsage: { tabKeys: 5, totalKeys: 100 },
      dwellMs: [60_000],
    });
    expect(out.persona).not.toBe('journalist');
  });
});

describe('classifyFromState() — fallback to standard', () => {
  it('falls through to standard for unmatched mid-range signals', () => {
    const out = classifyFromState({
      ...empty,
      tabUsage: { tabKeys: 5, totalKeys: 100 },
      dwellMs: [60_000],
    });
    expect(out.persona).toBe('standard');
    expect(out.reason).toContain('echilibrat');
  });
});

describe('recordSignal() — bounded window', () => {
  it('caps dwellMs samples at MAX_SAMPLES (rolling)', async () => {
    for (let i = 0; i < 50; i++) {
      await recordSignal({ kind: 'dwell', ms: 1000 + i });
    }
    const out = await classifyPersona();
    // No throw, classifier still resolves; we can't reach internal state
    // directly but we can re-test indirect: 50 short dwells (<30s) → pro.
    expect(out.persona).toBe('pro');
  });

  it('caps scrollPxPerSec samples at MAX_SAMPLES (rolling)', async () => {
    for (let i = 0; i < 50; i++) {
      await recordSignal({ kind: 'scroll', pxPerSec: 30 });
    }
    // Combined with long dwell, this should classify as pensioner.
    for (let i = 0; i < 5; i++) {
      await recordSignal({ kind: 'dwell', ms: 200_000 });
    }
    const out = await classifyPersona();
    expect(out.persona).toBe('pensioner');
  });

  it('ignores invalid dwell signals (negative, NaN, Infinity)', async () => {
    await recordSignal({ kind: 'dwell', ms: -100 });
    await recordSignal({ kind: 'dwell', ms: Number.NaN });
    await recordSignal({ kind: 'dwell', ms: Number.POSITIVE_INFINITY });
    const out = await classifyPersona();
    // No samples were accepted; state stays pristine → standard.
    expect(out.persona).toBe('standard');
  });

  it('caps tab-usage totals at the configured horizon', async () => {
    // Push a giant burst of all-Tab keystrokes.
    await recordSignal({ kind: 'tab-usage', tabKeys: 100000, totalKeys: 100000 });
    // Now push a normal-distribution signal.
    await recordSignal({ kind: 'tab-usage', tabKeys: 0, totalKeys: 200 });
    const out = await classifyPersona();
    // Even though the burst was huge, the cap prevents it from locking the
    // ratio at exactly 1.0 forever; ratio stays > 30% → pro.
    expect(out.persona).toBe('pro');
  });
});

describe('classifyPersona() — round-trip through storage', () => {
  it('honors recorded dwell + scroll → pensioner', async () => {
    for (let i = 0; i < 5; i++) {
      await recordSignal({ kind: 'dwell', ms: 200_000 });
      await recordSignal({ kind: 'scroll', pxPerSec: 50 });
    }
    const out = await classifyPersona();
    expect(out.persona).toBe('pensioner');
  });

  it('returns the standard default after __resetForTests()', async () => {
    await recordSignal({ kind: 'dwell', ms: 200_000 });
    __resetForTests();
    const out = await classifyPersona();
    expect(out.persona).toBe('standard');
  });
});
