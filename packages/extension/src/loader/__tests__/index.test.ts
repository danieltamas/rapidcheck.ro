/**
 * Loader lifecycle tests.
 *
 * Asserts the contract from §A of the v0.2.0-anaf takeover spec:
 *   - mount in <5ms (sanity-bound; happy-dom is much faster than a real browser
 *     so a generous 25ms ceiling still proves "no measurable work")
 *   - hide-original style appended with the documented selector
 *   - loader element appended with role/aria/label
 *   - dismiss() removes loader, KEEPS hide-original
 *   - abort() removes loader AND hide-original
 *   - safety timeout auto-aborts after SAFETY_TIMEOUT_MS
 *   - reduced-motion path uses instant removal (no fade transition)
 *   - idempotency: a second mountLoader() call doesn't double up the DOM
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';

import { setupDom } from '../../../../ui/tests/setup-dom.js';
import { mountLoader, applyHideOriginal, removeHideOriginal } from '../index.js';

const STYLE_ID = 'onegov-hide-original';
const LOADER_ID = 'onegov-loader';

beforeAll(() => {
  setupDom();
});

beforeEach(() => {
  document.body.innerHTML = '<header>old anaf chrome</header><main>old content</main>';
  // Reset matchMedia mock between tests.
  setMatchMediaResult(false);
});

afterEach(() => {
  // Clean up any lingering loader/style nodes.
  const loader = document.getElementById(LOADER_ID);
  if (loader) loader.remove();
  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
  document.body.innerHTML = '';
});

/** Replace happy-dom's matchMedia with a stub honoring the requested boolean. */
function setMatchMediaResult(matches: boolean): void {
  // happy-dom may already provide a partial matchMedia; we override.
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (q: string) => ({
      media: q,
      matches,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    }),
  });
}

describe('mountLoader() — basic mount', () => {
  it('appends the hide-original <style> with the documented selector', () => {
    const handle = mountLoader();
    const style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    expect(style).not.toBeNull();
    expect(style?.tagName).toBe('STYLE');
    expect(style?.textContent ?? '').toContain(`body > *:not(#onegov-root):not(#${LOADER_ID})`);
    expect(style?.textContent ?? '').toContain('display:none!important');
    handle.abort();
  });

  it('appends the loader <div> with role, aria-live, aria-label', () => {
    const handle = mountLoader();
    const loader = document.getElementById(LOADER_ID);
    expect(loader).not.toBeNull();
    expect(loader?.getAttribute('role')).toBe('status');
    expect(loader?.getAttribute('aria-live')).toBe('polite');
    expect(loader?.getAttribute('aria-label')).toBe('Se încarcă onegov');
    handle.abort();
  });

  it('embeds the inlined logo SVG', () => {
    const handle = mountLoader();
    const svg = document.querySelector(`#${LOADER_ID} .l-logo svg`);
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 358.95 66');
    handle.abort();
  });

  it('contains the Romanian hint text (hidden initially)', () => {
    const handle = mountLoader();
    const hint = document.querySelector(`#${LOADER_ID} .l-hint`);
    expect(hint).not.toBeNull();
    expect(hint?.textContent).toBe('Pregătim interfața...');
    expect(hint?.classList.contains('l-hint--visible')).toBe(false);
    handle.abort();
  });
});

describe('mountLoader() — performance', () => {
  it('mounts in <25ms (zero-work threshold for happy-dom)', () => {
    document.body.innerHTML = '';
    const t0 = performance.now();
    const handle = mountLoader();
    const dt = performance.now() - t0;
    expect(dt).toBeLessThan(25);
    handle.abort();
  });
});

describe('mountLoader() — idempotency', () => {
  it('does not duplicate the loader/style on a second call', () => {
    const a = mountLoader();
    const b = mountLoader();
    expect(document.querySelectorAll(`#${LOADER_ID}`).length).toBe(1);
    expect(document.querySelectorAll(`#${STYLE_ID}`).length).toBe(1);
    a.abort();
    b.abort();
  });
});

describe('LoaderHandle.dismiss() — happy path', () => {
  it('removes the loader after FADE_MS but KEEPS the hide-original style', async () => {
    const handle = mountLoader();
    expect(document.getElementById(LOADER_ID)).not.toBeNull();

    handle.dismiss();
    expect(handle.disposed).toBe(true);

    // Wait for the fade timeout (FADE_MS=120ms in source). 250ms is safe.
    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(document.getElementById(LOADER_ID)).toBeNull();
    // hide-original style stays in place — the app is mounted now, so the
    // page underneath should remain hidden.
    expect(document.getElementById(STYLE_ID)).not.toBeNull();
  });

  it('reduced-motion path removes loader instantly (no transition)', () => {
    setMatchMediaResult(true);
    const handle = mountLoader();
    handle.dismiss();
    // Instant removal — no waiting for FADE_MS.
    expect(document.getElementById(LOADER_ID)).toBeNull();
    expect(document.getElementById(STYLE_ID)).not.toBeNull();
  });

  it('second dismiss() is a no-op (disposed guard)', () => {
    const handle = mountLoader();
    handle.dismiss();
    expect(handle.disposed).toBe(true);
    handle.dismiss(); // should not throw
    expect(handle.disposed).toBe(true);
  });
});

describe('LoaderHandle.abort() — failure path', () => {
  it('removes BOTH the loader and the hide-original style', () => {
    const handle = mountLoader();
    expect(document.getElementById(LOADER_ID)).not.toBeNull();
    expect(document.getElementById(STYLE_ID)).not.toBeNull();

    handle.abort('test reason');
    expect(handle.disposed).toBe(true);
    expect(document.getElementById(LOADER_ID)).toBeNull();
    expect(document.getElementById(STYLE_ID)).toBeNull();
  });
});

describe('mountLoader() — safety timeout', () => {
  // The safety timeout is 3000ms in source. Bun's test default timeout is 5s
  // which is enough; we tag this test as slow.
  it('auto-aborts after 3s if dismiss() never called', async () => {
    const handle = mountLoader();
    await new Promise((resolve) => setTimeout(resolve, 3100));
    expect(handle.disposed).toBe(true);
    expect(document.getElementById(LOADER_ID)).toBeNull();
    expect(document.getElementById(STYLE_ID)).toBeNull();
  }, 6000);
});

describe('removeHideOriginal() / applyHideOriginal() — toggle helpers', () => {
  it('removeHideOriginal() drops the style; applyHideOriginal() restores it', () => {
    const handle = mountLoader();
    handle.dismiss();
    expect(document.getElementById(STYLE_ID)).not.toBeNull();

    removeHideOriginal();
    expect(document.getElementById(STYLE_ID)).toBeNull();

    applyHideOriginal();
    expect(document.getElementById(STYLE_ID)).not.toBeNull();
  });

  it('applyHideOriginal() is idempotent (does not duplicate)', () => {
    applyHideOriginal();
    applyHideOriginal();
    expect(document.querySelectorAll(`#${STYLE_ID}`).length).toBe(1);
  });
});
