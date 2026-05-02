/**
 * Minimal `chrome.*` stub for the background SW tests.
 *
 * Wires `webNavigation.onCommitted`, `tabs.onActivated`, `tabs.get`,
 * `tabs.query`, `runtime.onInstalled` and `action.setIcon` — the entire API
 * surface the icon state machine touches and nothing more. Stub objects
 * remember the last registered listener so tests can fire synthetic events
 * by calling `stub.fire.<eventName>(payload)`.
 *
 * Lives next to the SW test it backs rather than in a shared `tests/`
 * folder; the icon state machine is the only background SW today, and a
 * shared stub would tempt other tracks to extend it without owning it.
 */
type Listener<T> = (arg: T) => void | Promise<void>;

interface CommittedDetails {
  tabId: number;
  url: string;
  frameId: number;
}

interface ActivatedInfo {
  tabId: number;
  windowId: number;
}

interface SetIconCall {
  tabId?: number;
  path?: Record<number, string>;
}

export interface ChromeStub {
  setIconCalls: SetIconCall[];
  tabsTable: Map<number, { id: number; url?: string }>;
  fire: {
    committed: (details: CommittedDetails) => Promise<void>;
    activated: (info: ActivatedInfo) => Promise<void>;
    installed: () => Promise<void>;
  };
  // expose listener registration counts for sanity assertions
  listenerCounts: () => { committed: number; activated: number; installed: number };
}

export function makeChromeStub(): ChromeStub {
  const committedListeners: Array<Listener<CommittedDetails>> = [];
  const activatedListeners: Array<Listener<ActivatedInfo>> = [];
  const installedListeners: Array<Listener<void>> = [];
  const setIconCalls: SetIconCall[] = [];
  const tabsTable = new Map<number, { id: number; url?: string }>();

  const chromeImpl = {
    webNavigation: {
      onCommitted: {
        addListener(cb: Listener<CommittedDetails>) {
          committedListeners.push(cb);
        },
      },
    },
    tabs: {
      onActivated: {
        addListener(cb: Listener<ActivatedInfo>) {
          activatedListeners.push(cb);
        },
      },
      get(tabId: number): Promise<{ id: number; url?: string }> {
        const t = tabsTable.get(tabId);
        if (!t) return Promise.reject(new Error(`No tab with id ${tabId}`));
        return Promise.resolve(t);
      },
      query(_filter: Record<string, unknown>): Promise<Array<{ id: number; url?: string }>> {
        return Promise.resolve(Array.from(tabsTable.values()));
      },
    },
    runtime: {
      onInstalled: {
        addListener(cb: Listener<void>) {
          installedListeners.push(cb);
        },
      },
    },
    action: {
      setIcon(details: SetIconCall): Promise<void> {
        setIconCalls.push(details);
        return Promise.resolve();
      },
    },
  };

  // Install onto globalThis so the SW under test sees `chrome.*`.
  (globalThis as unknown as { chrome: typeof chromeImpl }).chrome = chromeImpl;

  return {
    setIconCalls,
    tabsTable,
    fire: {
      async committed(details) {
        for (const cb of committedListeners) await cb(details);
      },
      async activated(info) {
        for (const cb of activatedListeners) await cb(info);
        // Allow the .then() chain inside the SW to resolve before the test
        // assertion runs — one microtask is enough.
        await new Promise<void>((resolve) => queueMicrotask(resolve));
        await new Promise<void>((resolve) => queueMicrotask(resolve));
      },
      async installed() {
        for (const cb of installedListeners) await cb();
        await new Promise<void>((resolve) => queueMicrotask(resolve));
        await new Promise<void>((resolve) => queueMicrotask(resolve));
      },
    },
    listenerCounts: () => ({
      committed: committedListeners.length,
      activated: activatedListeners.length,
      installed: installedListeners.length,
    }),
  };
}

export function uninstallChromeStub(): void {
  delete (globalThis as Partial<{ chrome: unknown }>).chrome;
}
