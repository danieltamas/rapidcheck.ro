/**
 * Popup — Preact app rendered inside the browser action popup (v0.2.0).
 *
 * v0.2 redesign: replaces the persona pill with a single UI density chip.
 * Persona inference + storage stays under the hood for back-compat (the
 * background SW still classifies + the storage key still exists), but the
 * popup no longer surfaces it.
 *
 *   ┌─────────────────────────────────────┐
 *   │  [g]  onegov                        │   branded header strip
 *   │       UX layer pentru servicii .ro  │
 *   ├─────────────────────────────────────┤
 *   │  Aplică interfața onegov   ●━━━━○   │   primary on/off toggle
 *   │  comutator principal                │
 *   ├─────────────────────────────────────┤
 *   │  Densitate: [Esențial][Standard][Complet]│ density chip
 *   │  controlează cât conținut afișăm    │
 *   ├─────────────────────────────────────┤
 *   │  ●  anaf.ro                         │   current-tab status
 *   │     Site oficial verificat          │
 *   ├─────────────────────────────────────┤
 *   │  Despre · v0.2.0 · GitHub           │   footer (subtle)
 *   └─────────────────────────────────────┘
 *
 * State surfaces:
 *   - `extensionEnabled` (chrome.storage.local, default true) — primary
 *     toggle. v0.3 swaps between ONEGOV body content and the original body
 *     content while keeping a sticky activation bar.
 *   - `uiDensity` (chrome.storage.local, default 'simplu') — content script
 *     reads this at mount + on storage change, re-rendering the App.
 *
 * Romanian copy is allowed because this is user-facing UI text (per CLAUDE.md
 * §Critical Rules). All other code stays in English.
 *
 * Invariants enforced here:
 *   #3 No remote code — Preact JSX only, no `dangerouslySetInnerHTML`.
 *   #4 No external network — only `chrome.runtime.sendMessage` and
 *      `chrome.storage.local`. The "GitHub" link is a regular `<a>` the user
 *      clicks; the popup itself never fetches.
 *   #5 Escape — the primary toggle restores the original page under the bar.
 */

import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import type { DomainStatus } from '@onegov/core';

import type { GetStatusReply } from '../messages.js';
import logoUrl from '../../icons-src/onegov.logo.white.svg';

const REPO_URL = 'https://github.com/danitamas/onegov.ro';

/** Mirror of the SiteRuntime density type. Local to keep the popup free of
 *  cross-package imports beyond what's already available via @onegov/core. */
type Density = 'minimal' | 'simplu' | 'bogat';
const DENSITY_ORDER: ReadonlyArray<Density> = ['minimal', 'simplu', 'bogat'];
const DEFAULT_DENSITY: Density = 'simplu';

const DENSITY_LABELS: Record<Density, string> = {
  minimal: 'Esențial',
  simplu: 'Standard',
  bogat: 'Complet',
};

const DENSITY_HINTS: Record<Density, string> = {
  minimal: 'interfață concentrată',
  simplu: 'echilibrat (recomandat)',
  bogat: 'detalii extinse',
};

/**
 * Translate a `DomainStatus` (or absence thereof) into the trio of values the
 * site-status row needs: a colour key (drives the dot CSS class), the label
 * shown next to the eTLD+1, and the variant string used by tests/aria.
 *
 * Pure so it can be unit-tested in isolation. Exported alongside the popup so
 * the existing test in `__tests__/index.test.tsx` keeps importing it.
 */
export function statusPillFor(status: DomainStatus | null): {
  variant: 'verified' | 'lookalike' | 'unknown';
  glyph: string;
  label: string;
} {
  if (!status) {
    return { variant: 'unknown', glyph: '\u26AA', label: 'Site nesuportat' };
  }
  switch (status.kind) {
    case 'verified':
      return { variant: 'verified', glyph: '\u2705', label: 'Site oficial verificat' };
    case 'lookalike':
      return { variant: 'lookalike', glyph: '\u{1F6A8}', label: 'Atenție — domeniu suspect' };
    case 'unknown':
      return { variant: 'unknown', glyph: '\u26AA', label: 'Site nesuportat' };
  }
}

function Header() {
  return (
    <header class="pop-header" role="banner">
      <img class="pop-header__logo" src={logoUrl} alt="onegov" height={28} />
      <span class="pop-header__tagline">UX layer pentru servicii publice .ro</span>
    </header>
  );
}

interface PrimaryToggleProps {
  on: boolean;
  onChange: (next: boolean) => void;
}

function PrimaryToggle({ on, onChange }: PrimaryToggleProps) {
  return (
    <section class="pop-section pop-section--toggle">
      <div class="pop-toggle-row">
        <div class="pop-toggle-meta">
          <span class="pop-toggle-meta__label">Aplică interfața onegov</span>
        </div>
        <label class={`pop-switch${on ? ' pop-switch--on' : ''}`}>
          <input
            class="pop-switch__input"
            type="checkbox"
            role="switch"
            aria-checked={on}
            checked={on}
            onChange={(ev) => onChange((ev.currentTarget as HTMLInputElement).checked)}
          />
          <span class="pop-switch__thumb" aria-hidden="true" />
        </label>
      </div>
    </section>
  );
}

interface DensityChipProps {
  current: Density;
  onPick: (next: Density) => void;
}

/**
 * v0.2 replacement for the persona card. A single chip with three options;
 * the description below explains what each does in one phrase.
 */
function DensityChip({ current, onPick }: DensityChipProps) {
  return (
    <section class="pop-section pop-section--density">
      <div class="pop-density">
        <span class="pop-density__label">Densitate interfață</span>
        <div class="pop-density__chip" role="radiogroup" aria-label="Densitate interfață">
          {DENSITY_ORDER.map((d) => {
            const selected = d === current;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={selected}
                data-density={d}
                class={`pop-density__option${selected ? ' pop-density__option--selected' : ''}`}
                onClick={() => onPick(d)}
              >
                {DENSITY_LABELS[d]}
              </button>
            );
          })}
        </div>
        <span class="pop-density__hint">{DENSITY_HINTS[current]}</span>
      </div>
    </section>
  );
}

interface SiteStatusProps {
  status: DomainStatus | null;
  hostname: string | null;
}

function SiteStatus({ status, hostname }: SiteStatusProps) {
  const { variant, label } = statusPillFor(status);
  const display = hostname && hostname.length > 0 ? hostname : '\u2014';
  return (
    <section class="pop-section pop-section--site">
      <div class="pop-site" role="status" aria-live="polite">
        <span
          class={`pop-site__dot pop-site__dot--${variant}`}
          aria-hidden="true"
          data-variant={variant}
        />
        <div class="pop-site__body">
          <span class="pop-site__host">{display}</span>
          <span class="pop-site__state">{label}</span>
        </div>
      </div>
    </section>
  );
}

function Footer({ version }: { version: string }) {
  return (
    <footer class="pop-footer">
      <span class="pop-footer__group">
        <span>onegov</span>
        <span class="pop-footer__sep">{'\u00B7'}</span>
        <span>v{version}</span>
      </span>
      <a class="pop-footer__link" href={REPO_URL} target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
    </footer>
  );
}

/** Coerce raw storage value into a Density. */
function coerceDensity(raw: unknown): Density {
  return typeof raw === 'string' && (DENSITY_ORDER as ReadonlyArray<string>).includes(raw)
    ? (raw as Density)
    : DEFAULT_DENSITY;
}

function Popup() {
  const [enabled, setEnabled] = useState(true);
  const [density, setDensity] = useState<Density>(DEFAULT_DENSITY);
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [hostname, setHostname] = useState<string | null>(null);

  // Hydrate from storage + ask the SW for status.
  useEffect(() => {
    let cancelled = false;
    chrome.storage.local
      .get(['uiDensity', 'extensionEnabled'])
      .then((s) => {
        if (cancelled) return;
        setDensity(coerceDensity(s['uiDensity']));
        setEnabled(s['extensionEnabled'] !== false);
      })
      .catch(() => {
        // Storage unreachable — defaults stand.
      });

    chrome.runtime
      .sendMessage({ type: 'get-status' })
      .then((reply: GetStatusReply | undefined) => {
        if (cancelled) return;
        setStatus(reply?.status ?? null);
        setHostname(reply?.hostname ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setStatus(null);
          setHostname(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const listener = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ): void => {
      if (areaName !== 'local') return;
      if (changes['uiDensity'] !== undefined) {
        setDensity(coerceDensity(changes['uiDensity'].newValue));
      }
      if (changes['extensionEnabled'] !== undefined) {
        setEnabled(changes['extensionEnabled'].newValue !== false);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      const event = chrome.storage.onChanged as {
        removeListener?: (cb: typeof listener) => void;
      };
      event.removeListener?.(listener);
    };
  }, []);

  function pickDensity(next: Density) {
    setDensity(next);
    void chrome.storage.local.set({ uiDensity: next }).catch(() => {});
  }

  function toggleEnabled(next: boolean) {
    setEnabled(next);
    void chrome.storage.local
      .set({ extensionEnabled: next })
      .catch(() => {});
  }

  const manifestVersion = chrome.runtime.getManifest().version;
  const uiActive = enabled;

  return (
    <main class="pop-shell">
      <Header />
      <PrimaryToggle on={enabled} onChange={toggleEnabled} />
      {uiActive ? <DensityChip current={density} onPick={pickDensity} /> : null}
      <SiteStatus status={status} hostname={hostname} />
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
