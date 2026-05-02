/**
 * Popup — Preact app rendered inside the browser action popup.
 *
 * Three controls plus a status pill (and a footer):
 *   - Status pill — reflects the active tab's `DomainStatus`. Asks the
 *     background SW for the classification rather than re-running the
 *     verifier here (same architectural reason as the content script:
 *     bundle-size + single source of truth).
 *   - Persona picker — 2x2 grid of the four personas. Clicking writes
 *     `{ persona }` to `chrome.storage.local`; the content script's
 *     `chrome.storage.onChanged` listener picks it up and re-renders.
 *   - "Afișează site-ul original" toggle — writes `{ showOriginal }` to
 *     storage; the content script flips the shadow host's `style.display`.
 *   - Footer — "Despre", version (read from `chrome.runtime.getManifest()`),
 *     link to the GitHub repo.
 *
 * Romanian copy is allowed inside the popup because it is user-facing UI text
 * (per CLAUDE.md §Critical Rules). All other code is English.
 *
 * Invariants enforced here:
 *   #3 No remote code — Preact JSX only, no `dangerouslySetInnerHTML`.
 *   #4 No external network — the only `fetch` here is implicit via `chrome.
 *      runtime.sendMessage` to the SW. The "GitHub" link is a regular `<a
 *      href>` the user clicks; the popup itself never performs the fetch.
 *   #5 Escape — toggling `showOriginal` is the kill switch. One click hides
 *      the entire overlay across every verified tab.
 */

import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import type { DomainStatus, Persona } from '@onegov/core';

import type { GetStatusReply } from '../messages.js';

const PERSONAS: Array<{ key: Persona; label: string; hint: string }> = [
  { key: 'pensioner', label: 'Pensionar', hint: 'Tipar mare, simplu' },
  { key: 'standard', label: 'Standard', hint: 'Implicit' },
  { key: 'pro', label: 'Profesionist', hint: 'Compact, taste rapide' },
  { key: 'journalist', label: 'Jurnalist', hint: 'Tabele largi, copiere CSV' },
];

const REPO_URL = 'https://github.com/danitamas/onegov.ro';

/**
 * Translate a `DomainStatus` (or absence thereof) into the trio of values the
 * status pill needs: a colour key (drives CSS class), a leading icon glyph,
 * and the Romanian label. Kept pure so the pill can be tested in isolation.
 */
export function statusPillFor(status: DomainStatus | null): {
  variant: 'verified' | 'lookalike' | 'unknown';
  glyph: string;
  label: string;
} {
  if (!status) {
    return { variant: 'unknown', glyph: '⚪', label: 'Site nesuportat' };
  }
  switch (status.kind) {
    case 'verified':
      return { variant: 'verified', glyph: '✅', label: 'Site oficial verificat' };
    case 'lookalike':
      return { variant: 'lookalike', glyph: '🚨', label: 'Atenție — domeniu suspect' };
    case 'unknown':
      return { variant: 'unknown', glyph: '⚪', label: 'Site nesuportat' };
  }
}

function StatusPill({ status }: { status: DomainStatus | null }) {
  const { variant, glyph, label } = statusPillFor(status);
  return (
    <div
      class={`status-pill status-pill--${variant}`}
      role="status"
      aria-live="polite"
      data-variant={variant}
    >
      <span class="status-pill__glyph" aria-hidden="true">
        {glyph}
      </span>
      <span class="status-pill__label">{label}</span>
    </div>
  );
}

interface PersonaPickerProps {
  current: Persona;
  onPick: (next: Persona) => void;
}

function PersonaPicker({ current, onPick }: PersonaPickerProps) {
  return (
    <div class="persona-picker" role="radiogroup" aria-label="Persona">
      {PERSONAS.map((p) => {
        const selected = p.key === current;
        return (
          <button
            key={p.key}
            type="button"
            role="radio"
            aria-checked={selected}
            class={`persona-button${selected ? ' persona-button--selected' : ''}`}
            onClick={() => onPick(p.key)}
            data-persona={p.key}
          >
            <span class="persona-button__label">{p.label}</span>
            <span class="persona-button__hint">{p.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

interface OriginalToggleProps {
  hidden: boolean;
  onChange: (next: boolean) => void;
}

function OriginalToggle({ hidden, onChange }: OriginalToggleProps) {
  return (
    <label class="toggle">
      <input
        type="checkbox"
        checked={hidden}
        onChange={(ev) => onChange((ev.currentTarget as HTMLInputElement).checked)}
      />
      <span class="toggle__label">Afișează site-ul original</span>
    </label>
  );
}

function Footer({ version }: { version: string }) {
  return (
    <footer class="footer">
      <span class="footer__version">v{version}</span>
      <a class="footer__link" href={REPO_URL} target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
    </footer>
  );
}

function Popup() {
  const [persona, setPersona] = useState<Persona>('standard');
  const [showOriginal, setShowOriginal] = useState(false);
  const [status, setStatus] = useState<DomainStatus | null>(null);

  // Hydrate from storage + ask the SW for the active tab's status.
  useEffect(() => {
    let cancelled = false;
    chrome.storage.local
      .get(['persona', 'showOriginal'])
      .then((s) => {
        if (cancelled) return;
        const p = s['persona'];
        if (typeof p === 'string' && PERSONAS.some((x) => x.key === p)) {
          setPersona(p as Persona);
        }
        setShowOriginal(s['showOriginal'] === true);
      })
      .catch(() => {
        // Storage unreachable — keep defaults.
      });

    chrome.runtime
      .sendMessage({ type: 'get-status' })
      .then((reply: GetStatusReply | undefined) => {
        if (cancelled) return;
        setStatus(reply?.status ?? null);
      })
      .catch(() => {
        // Service worker unreachable — render the gray pill.
        if (!cancelled) setStatus(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function pickPersona(next: Persona) {
    setPersona(next);
    void chrome.storage.local.set({ persona: next }).catch(() => {});
  }

  function toggleOriginal(next: boolean) {
    setShowOriginal(next);
    void chrome.storage.local.set({ showOriginal: next }).catch(() => {});
  }

  const manifestVersion = chrome.runtime.getManifest().version;

  return (
    <main class="popup">
      <header class="header">
        <span class="header__title">onegov.ro</span>
      </header>
      <StatusPill status={status} />
      <PersonaPicker current={persona} onPick={pickPersona} />
      <OriginalToggle hidden={showOriginal} onChange={toggleOriginal} />
      <Footer version={manifestVersion} />
    </main>
  );
}

const mount = document.getElementById('app');
if (mount) {
  render(<Popup />, mount);
}

// Empty export keeps `isolatedModules` happy and prevents accidental globals.
export {};
