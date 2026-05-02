/**
 * Popup — Preact app rendered inside the browser action popup.
 *
 * STATUS: Stub. Track 4 implements the status pill, persona picker
 * (2×2 grid), and the "afișează site-ul original" toggle. The placeholder
 * markup here proves the popup loads, the script bundles, and there are no
 * console errors when the unpacked extension is opened.
 *
 * Romanian copy is allowed inside the popup because it is user-facing UI text
 * (per CLAUDE.md §Critical Rules). All other code is English.
 */

import { render } from 'preact';

function Popup() {
  return (
    <main>
      <h1
        style={{
          margin: 0,
          fontSize: '16px',
          color: 'var(--onegov-color-primary)',
        }}
      >
        onegov.ro
      </h1>
      <p style={{ margin: '8px 0 0', color: 'var(--onegov-color-text)' }}>
        Schelet v0.1. UI-ul personalizat ajunge în Track 4.
      </p>
    </main>
  );
}

const mount = document.getElementById('app');
if (mount) {
  render(<Popup />, mount);
}
