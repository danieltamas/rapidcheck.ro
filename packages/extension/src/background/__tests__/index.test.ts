/**
 * Tests for the background service worker glue.
 *
 * The decision logic itself lives in `decide-icon.ts` and is unit-tested
 * exhaustively in `decide-icon.test.ts`. These tests cover only the
 * `chrome.*` wiring:
 *
 *   - `webNavigation.onCommitted` (top frame only) wires through to setIcon
 *   - sub-frame events are ignored
 *   - malformed URLs do not crash the listener
 *   - `tabs.onActivated` re-applies the icon for the now-active tab
 *   - `runtime.onInstalled` paints every existing open tab
 *
 * The bundled `_verified-domains.json` roster is mocked into a small fixture
 * so we can exercise all three colour outcomes (green, red, gray) without
 * mutating the on-disk file. Mock must be installed BEFORE the SW module is
 * imported — `mock.module` rewrites the resolution for subsequent imports.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

import { makeChromeStub, uninstallChromeStub, type ChromeStub } from './chrome-stub.js';

mock.module('../../../../../rule-packs/_verified-domains.json', () => ({
  default: {
    version: '0.1.0-test',
    updatedAt: '2026-05-02',
    domains: [
      { domain: 'anaf.ro', category: 'gov', addedAt: '2026-05-02', source: 'https://anaf.ro' },
    ],
  },
}));

let chromeStub: ChromeStub;

beforeAll(async () => {
  chromeStub = makeChromeStub();
  // Import the SW module AFTER both the chrome stub is on globalThis and the
  // JSON import has been mocked. Side effects in the module body register
  // the three event listeners against `chromeStub`.
  await import('../index.js');
});

afterAll(() => {
  uninstallChromeStub();
});

beforeEach(() => {
  chromeStub.setIconCalls.length = 0;
  chromeStub.tabsTable.clear();
});

describe('background SW — listener wiring', () => {
  it('registers exactly one listener on each of the three event sources', () => {
    const counts = chromeStub.listenerCounts();
    expect(counts.committed).toBe(1);
    expect(counts.activated).toBe(1);
    expect(counts.installed).toBe(1);
  });
});

describe('background SW — webNavigation.onCommitted', () => {
  it('paints green for a verified domain on the top frame', async () => {
    await chromeStub.fire.committed({ tabId: 7, url: 'https://anaf.ro/', frameId: 0 });
    expect(chromeStub.setIconCalls).toHaveLength(1);
    expect(chromeStub.setIconCalls[0]).toEqual({
      tabId: 7,
      path: { 16: 'icons/green-16.png', 32: 'icons/green-32.png', 48: 'icons/green-48.png' },
    });
  });

  it('paints red for a lookalike domain (anaf-portal.ro)', async () => {
    await chromeStub.fire.committed({ tabId: 11, url: 'https://anaf-portal.ro/', frameId: 0 });
    expect(chromeStub.setIconCalls).toHaveLength(1);
    expect(chromeStub.setIconCalls[0]).toEqual({
      tabId: 11,
      path: { 16: 'icons/red-16.png', 32: 'icons/red-32.png', 48: 'icons/red-48.png' },
    });
  });

  it('paints gray for an off-list domain (google.com)', async () => {
    await chromeStub.fire.committed({ tabId: 13, url: 'https://google.com/', frameId: 0 });
    expect(chromeStub.setIconCalls).toHaveLength(1);
    expect(chromeStub.setIconCalls[0]).toEqual({
      tabId: 13,
      path: { 16: 'icons/gray-16.png', 32: 'icons/gray-32.png', 48: 'icons/gray-48.png' },
    });
  });

  it('ignores sub-frame events (frameId !== 0)', async () => {
    await chromeStub.fire.committed({ tabId: 17, url: 'https://anaf.ro/', frameId: 4 });
    expect(chromeStub.setIconCalls).toHaveLength(0);
  });

  it('does not crash on a malformed URL — paints gray defensively', async () => {
    await chromeStub.fire.committed({ tabId: 19, url: 'not a url', frameId: 0 });
    expect(chromeStub.setIconCalls).toHaveLength(1);
    expect(chromeStub.setIconCalls[0]?.path).toEqual({
      16: 'icons/gray-16.png',
      32: 'icons/gray-32.png',
      48: 'icons/gray-48.png',
    });
  });

  it('does not crash on an empty URL string and skips the paint', async () => {
    // Falsy URL short-circuits applyIconForUrl. We verify the listener
    // doesn't throw — getting here means it didn't.
    await chromeStub.fire.committed({ tabId: 23, url: '', frameId: 0 });
    expect(chromeStub.setIconCalls).toHaveLength(0);
  });
});

describe('background SW — tabs.onActivated', () => {
  it('re-applies the icon for the newly activated tab via tabs.get', async () => {
    chromeStub.tabsTable.set(29, { id: 29, url: 'https://anaf.ro/' });
    await chromeStub.fire.activated({ tabId: 29, windowId: 1 });
    expect(chromeStub.setIconCalls).toHaveLength(1);
    expect(chromeStub.setIconCalls[0]).toEqual({
      tabId: 29,
      path: { 16: 'icons/green-16.png', 32: 'icons/green-32.png', 48: 'icons/green-48.png' },
    });
  });

  it('paints gray for an off-list activated tab', async () => {
    chromeStub.tabsTable.set(31, { id: 31, url: 'https://example.com/' });
    await chromeStub.fire.activated({ tabId: 31, windowId: 1 });
    expect(chromeStub.setIconCalls).toHaveLength(1);
    expect(chromeStub.setIconCalls[0]?.path).toEqual({
      16: 'icons/gray-16.png',
      32: 'icons/gray-32.png',
      48: 'icons/gray-48.png',
    });
  });

  it('does not paint when the tab has no URL (e.g. New Tab)', async () => {
    chromeStub.tabsTable.set(37, { id: 37 });
    await chromeStub.fire.activated({ tabId: 37, windowId: 1 });
    expect(chromeStub.setIconCalls).toHaveLength(0);
  });

  it('swallows errors when tabs.get rejects (tab closed mid-flight)', async () => {
    // Don't add 41 to tabsTable — tabs.get will reject.
    await chromeStub.fire.activated({ tabId: 41, windowId: 1 });
    expect(chromeStub.setIconCalls).toHaveLength(0);
  });
});

describe('background SW — runtime.onInstalled', () => {
  it('paints every open tab with a URL on install/update', async () => {
    chromeStub.tabsTable.set(43, { id: 43, url: 'https://anaf.ro/' });
    chromeStub.tabsTable.set(47, { id: 47, url: 'https://google.com/' });
    chromeStub.tabsTable.set(53, { id: 53, url: 'https://anaf.com/' });

    await chromeStub.fire.installed();

    expect(chromeStub.setIconCalls).toHaveLength(3);
    const byTab = new Map(chromeStub.setIconCalls.map((c) => [c.tabId, c.path]));
    expect(byTab.get(43)?.[16]).toBe('icons/green-16.png');
    expect(byTab.get(47)?.[16]).toBe('icons/gray-16.png');
    expect(byTab.get(53)?.[16]).toBe('icons/red-16.png');
  });

  it('skips tabs without a numeric id', async () => {
    // The SW's onInstalled handler guards `typeof tab.id === 'number'` because
    // `chrome.tabs.Tab.id` is `number | undefined` in the type contract — Tabs
    // not yet committed (e.g. devtools, prerender) carry no id.
    chromeStub.tabsTable.set(99, { url: 'https://anaf.ro/' } as unknown as {
      id: number;
      url?: string;
    });
    await chromeStub.fire.installed();
    expect(chromeStub.setIconCalls).toHaveLength(0);
  });

  it('skips tabs without a URL', async () => {
    chromeStub.tabsTable.set(61, { id: 61 });
    await chromeStub.fire.installed();
    expect(chromeStub.setIconCalls).toHaveLength(0);
  });
});
