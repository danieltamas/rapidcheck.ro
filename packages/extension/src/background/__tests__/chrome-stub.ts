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

interface RemovedInfo {
  isWindowClosing: boolean;
  windowId: number;
}

interface SetIconCall {
  tabId?: number;
  path?: Record<number, string>;
}

export interface SetBadgeTextCall {
  tabId?: number;
  text: string;
}
export interface SetBadgeBackgroundColorCall {
  tabId?: number;
  color: string;
}

export interface ChromeStub {
  setIconCalls: SetIconCall[];
  setBadgeTextCalls: SetBadgeTextCall[];
  setBadgeBackgroundColorCalls: SetBadgeBackgroundColorCall[];
  tabsTable: Map<number, { id: number; url?: string }>;
  fire: {
    committed: (details: CommittedDetails) => Promise<void>;
    activated: (info: ActivatedInfo) => Promise<void>;
    removed: (tabId: number, info?: RemovedInfo) => Promise<void>;
    installed: () => Promise<void>;
  };
  // expose listener registration counts for sanity assertions
  listenerCounts: () => {
    committed: number;
    activated: number;
    removed: number;
    installed: number;
    message: number;
    storageChanged: number;
  };
  // injection / storage spies
  insertedCss: Array<{ tabId: number; css: string; origin: string }>;
  removedCss: Array<{ tabId: number; css: string; origin: string }>;
  storage: Record<string, unknown>;
  sentTabMessages: Array<{ tabId: number; msg: unknown }>;
}

export function makeChromeStub(): ChromeStub {
  const committedListeners: Array<Listener<CommittedDetails>> = [];
  const activatedListeners: Array<Listener<ActivatedInfo>> = [];
  const removedListeners: Array<Listener<number>> = [];
  const installedListeners: Array<Listener<void>> = [];
  const messageListeners: Array<unknown> = [];
  const storageChangedListeners: Array<
    (changes: Record<string, { newValue?: unknown; oldValue?: unknown }>, area: string) => void
  > = [];
  const setIconCalls: SetIconCall[] = [];
  const setBadgeTextCalls: SetBadgeTextCall[] = [];
  const setBadgeBackgroundColorCalls: SetBadgeBackgroundColorCall[] = [];
  const tabsTable = new Map<number, { id: number; url?: string }>();
  const insertedCss: Array<{ tabId: number; css: string; origin: string }> = [];
  const removedCss: Array<{ tabId: number; css: string; origin: string }> = [];
  const storage: Record<string, unknown> = {};
  const sentTabMessages: Array<{ tabId: number; msg: unknown }> = [];

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
      onRemoved: {
        addListener(cb: Listener<number>) {
          removedListeners.push(cb);
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
      sendMessage(tabId: number, msg: unknown): Promise<void> {
        sentTabMessages.push({ tabId, msg });
        return Promise.resolve();
      },
    },
    scripting: {
      insertCSS(opts: { target: { tabId: number }; css: string; origin: string }): Promise<void> {
        insertedCss.push({ tabId: opts.target.tabId, css: opts.css, origin: opts.origin });
        return Promise.resolve();
      },
      removeCSS(opts: { target: { tabId: number }; css: string; origin: string }): Promise<void> {
        removedCss.push({ tabId: opts.target.tabId, css: opts.css, origin: opts.origin });
        return Promise.resolve();
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
        addListener(
          cb: (
            changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
            area: string,
          ) => void,
        ) {
          storageChangedListeners.push(cb);
        },
      },
    },
    runtime: {
      onInstalled: {
        addListener(cb: Listener<void>) {
          installedListeners.push(cb);
        },
      },
      // Track 4b adds an onMessage handler. We accept the registration and
      // record it so the listener-count assertion can verify wiring; the
      // handler logic itself is unit-tested directly via `messaging.test.ts`.
      onMessage: {
        addListener(cb: unknown) {
          messageListeners.push(cb);
        },
      },
      // `loadBundled` calls `chrome.runtime.getURL` from inside the SW. The
      // icon state-machine tests never fire it, but the stub must expose the
      // method so module evaluation does not throw. Returns a chrome-extension
      // URL by convention; never actually fetched here.
      getURL(path: string): string {
        return `chrome-extension://test/${path}`;
      },
    },
    action: {
      setIcon(details: SetIconCall): Promise<void> {
        setIconCalls.push(details);
        return Promise.resolve();
      },
      setBadgeText(details: SetBadgeTextCall): Promise<void> {
        setBadgeTextCalls.push(details);
        return Promise.resolve();
      },
      setBadgeBackgroundColor(details: SetBadgeBackgroundColorCall): Promise<void> {
        setBadgeBackgroundColorCalls.push(details);
        return Promise.resolve();
      },
    },
  };

  // Install onto globalThis so the SW under test sees `chrome.*`.
  (globalThis as unknown as { chrome: typeof chromeImpl }).chrome = chromeImpl;

  return {
    setIconCalls,
    setBadgeTextCalls,
    setBadgeBackgroundColorCalls,
    tabsTable,
    fire: {
      async committed(details) {
        for (const cb of committedListeners) await cb(details);
        await new Promise<void>((resolve) => queueMicrotask(resolve));
        await new Promise<void>((resolve) => queueMicrotask(resolve));
      },
      async activated(info) {
        for (const cb of activatedListeners) await cb(info);
        await new Promise<void>((resolve) => queueMicrotask(resolve));
        await new Promise<void>((resolve) => queueMicrotask(resolve));
      },
      async removed(tabId) {
        for (const cb of removedListeners) await cb(tabId);
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
      removed: removedListeners.length,
      installed: installedListeners.length,
      message: messageListeners.length,
      storageChanged: storageChangedListeners.length,
    }),
    insertedCss,
    removedCss,
    storage,
    sentTabMessages,
  };
}

export function uninstallChromeStub(): void {
  delete (globalThis as Partial<{ chrome: unknown }>).chrome;
}
