/**
 * @rapidcheck/core must remain DOM-free.
 *
 * If anyone imports `document`, `window`, or `chrome.*` into the core package,
 * the bundle leaks browser globals. This test asserts that after importing
 * the public barrel, no such global is defined on `globalThis` (Node has none
 * by default) and that the package code itself never *references* them — the
 * latter is checked indirectly: if the import succeeds in a clean Node
 * runtime, no top-level reference to a missing global was made.
 */

import { describe, it, expect } from 'bun:test';

describe('@rapidcheck/core has no DOM/browser-global side effects on import', () => {
  it('imports cleanly without referencing document/window/chrome', async () => {
    expect(globalThis['document' as keyof typeof globalThis]).toBeUndefined();
    expect(globalThis['window' as keyof typeof globalThis]).toBeUndefined();
    expect(globalThis['chrome' as keyof typeof globalThis]).toBeUndefined();

    // The actual side-effect canary: importing the barrel must not throw.
    // A reference to `document.foo` at the top level of any core module would
    // throw `ReferenceError` here in Node.
    const mod = await import('../src/index.js');
    expect(typeof mod.verifyDomain).toBe('function');
    expect(typeof mod.findNearest).toBe('function');
    expect(typeof mod.levenshtein).toBe('function');
    expect(typeof mod.normalizeHomograph).toBe('function');
  });

  it('still has no DOM globals after import', () => {
    expect(globalThis['document' as keyof typeof globalThis]).toBeUndefined();
    expect(globalThis['window' as keyof typeof globalThis]).toBeUndefined();
    expect(globalThis['chrome' as keyof typeof globalThis]).toBeUndefined();
  });
});
