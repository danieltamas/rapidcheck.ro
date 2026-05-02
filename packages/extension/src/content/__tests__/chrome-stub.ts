/**
 * Minimal `chrome.*` stub for content-script tests.
 *
 * Mocks only the surfaces the content script touches:
 *   - `chrome.runtime.sendMessage` — the request/reply transport
 *   - `chrome.storage.local.get` — persona + showOriginal hydration
 *   - `chrome.storage.onChanged.addListener` — re-render trigger
 *
 * The handler-fire helpers let tests synthesise both responses and
 * `storage.onChanged` events; the `messages` array records every outgoing
 * request so tests can assert what the script asked for, in order.
 */

import type { Reply, Request } from '../../messages.js';

type ChangeListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) => void;

export interface ChromeContentStub {
  /** Outgoing messages, in send order. */
  messages: Request[];
  /** Storage backing the `chrome.storage.local.get` reads. */
  storage: Record<string, unknown>;
  /** Synthetic firing of `chrome.storage.onChanged`. */
  fireStorageChanged: (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName?: string,
  ) => void;
  /** Counts of registered listeners (sanity assertions). */
  storageListenerCount: () => number;
}

/**
 * Install a chrome stub onto globalThis. The `responder` callback is invoked
 * per outgoing message and produces the typed reply (or `undefined` to
 * simulate a no-response failure).
 */
export function installChromeContentStub(
  responder: (request: Request) => Reply | undefined,
): ChromeContentStub {
  const messages: Request[] = [];
  const storage: Record<string, unknown> = {};
  const storageListeners: ChangeListener[] = [];

  const chromeImpl = {
    runtime: {
      sendMessage(req: unknown): Promise<Reply | undefined> {
        const r = req as Request;
        messages.push(r);
        const reply = responder(r);
        return Promise.resolve(reply);
      },
      getManifest(): { version: string } {
        return { version: '0.1.0-test' };
      },
    },
    storage: {
      local: {
        get(keys: string[] | string): Promise<Record<string, unknown>> {
          const list = typeof keys === 'string' ? [keys] : keys;
          const out: Record<string, unknown> = {};
          for (const k of list) {
            if (k in storage) out[k] = storage[k];
          }
          return Promise.resolve(out);
        },
        set(values: Record<string, unknown>): Promise<void> {
          for (const [k, v] of Object.entries(values)) {
            storage[k] = v;
          }
          return Promise.resolve();
        },
      },
      onChanged: {
        addListener(cb: ChangeListener): void {
          storageListeners.push(cb);
        },
      },
    },
  };

  (globalThis as unknown as { chrome: typeof chromeImpl }).chrome = chromeImpl;

  return {
    messages,
    storage,
    fireStorageChanged(changes, areaName = 'local') {
      for (const cb of storageListeners) cb(changes, areaName);
    },
    storageListenerCount: () => storageListeners.length,
  };
}

export function uninstallChromeContentStub(): void {
  delete (globalThis as Partial<{ chrome: unknown }>).chrome;
}
