/**
 * Minimal `chrome.*` stub for the popup test.
 *
 * Wires the surfaces the popup touches:
 *   - `chrome.runtime.sendMessage` (request/reply)
 *   - `chrome.storage.local.get/set`
 *   - `chrome.storage.onChanged.addListener` + synthetic firing
 *   - `chrome.runtime.getManifest`
 */

import type { Reply, Request } from '../../messages.js';

type ChangeListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) => void;

export interface ChromePopupStub {
  storage: Record<string, unknown>;
  activeTabUrl: string | null;
  fireStorageChanged: (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName?: string,
  ) => void;
}

export function installChromePopupStub(
  responder: (req: Request) => Reply | undefined,
  initialActiveTabUrl: string | null = 'https://anaf.ro/',
): ChromePopupStub {
  const storage: Record<string, unknown> = {};
  const changeListeners: ChangeListener[] = [];
  const state: { activeTabUrl: string | null } = { activeTabUrl: initialActiveTabUrl };

  const chromeImpl = {
    runtime: {
      sendMessage(req: Request): Promise<Reply | undefined> {
        return Promise.resolve(responder(req));
      },
      getManifest(): { version: string } {
        return { version: '0.1.0-test' };
      },
      getURL(path: string): string {
        return `chrome-extension://test-id/${path}`;
      },
    },
    tabs: {
      query(_filter: Record<string, unknown>) {
        if (state.activeTabUrl === null) return Promise.resolve([]);
        return Promise.resolve([{ id: 1, url: state.activeTabUrl }]);
      },
    },
    storage: {
      local: {
        get(keys: string | string[]): Promise<Record<string, unknown>> {
          const wanted = typeof keys === 'string' ? [keys] : keys;
          const out: Record<string, unknown> = {};
          for (const k of wanted) {
            if (k in storage) out[k] = storage[k];
          }
          return Promise.resolve(out);
        },
        set(values: Record<string, unknown>): Promise<void> {
          Object.assign(storage, values);
          return Promise.resolve();
        },
      },
      onChanged: {
        addListener(cb: ChangeListener): void {
          changeListeners.push(cb);
        },
        removeListener(cb: ChangeListener): void {
          const idx = changeListeners.indexOf(cb);
          if (idx >= 0) changeListeners.splice(idx, 1);
        },
      },
    },
  };

  (globalThis as unknown as { chrome: typeof chromeImpl }).chrome = chromeImpl;

  return {
    storage,
    get activeTabUrl() {
      return state.activeTabUrl;
    },
    set activeTabUrl(v: string | null) {
      state.activeTabUrl = v;
    },
    fireStorageChanged(changes, areaName = 'local') {
      for (const cb of changeListeners) cb(changes, areaName);
    },
  };
}

export function uninstallChromePopupStub(): void {
  delete (globalThis as Partial<{ chrome: unknown }>).chrome;
}
