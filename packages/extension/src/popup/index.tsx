/**
 * Popup — Preact app rendered inside the browser action popup (v0.1.1).
 *
 * Premium redesign per `jobs/v0.1.1-polish/01-premium-ux-overhaul.md`. The
 * popup now reads as designed instead of stacked atomic widgets:
 *
 *   ┌─────────────────────────────────────┐
 *   │  [g]  onegov                        │   branded header strip
 *   │       UX layer pentru servicii .ro  │
 *   ├─────────────────────────────────────┤
 *   │  Aplică interfața onegov   ●━━━━○   │   primary on/off toggle
 *   │  comutator principal                │
 *   ├─────────────────────────────────────┤
 *   │  👴 Vârstnic              schimbă   │   auto-inferred persona
 *   │  detectat automat — sesiuni lungi   │
 *   ├─────────────────────────────────────┤
 *   │  ●  anaf.ro                         │   current-tab status
 *   │     Site oficial verificat          │
 *   ├─────────────────────────────────────┤
 *   │  Despre · v0.1.1 · GitHub           │   footer (subtle)
 *   └─────────────────────────────────────┘
 *
 * State surfaces:
 *   - `extensionEnabled` (chrome.storage.local, default true) — primary
 *     toggle. Drives the content script's host display via
 *     `showOriginal = !extensionEnabled` (back-compat with the existing
 *     content-script storage listener).
 *   - `persona` (chrome.storage.local) — explicit override; absent until the
 *     user picks. The popup hides the override picker by default; "schimbă"
 *     reveals it.
 *   - `personaInference` from the SW — the auto-classified persona + reason.
 *     Always rendered, even when the user has overridden (we surface what we
 *     would have chosen so the override is informed).
 *
 * Romanian copy is allowed because this is user-facing UI text (per CLAUDE.md
 * §Critical Rules). All other code stays in English.
 *
 * Invariants enforced here:
 *   #3 No remote code — Preact JSX only, no `dangerouslySetInnerHTML`.
 *   #4 No external network — only `chrome.runtime.sendMessage` and
 *      `chrome.storage.local`. The "GitHub" link is a regular `<a>` the user
 *      clicks; the popup itself never fetches.
 *   #5 Escape — the primary toggle hides the entire overlay. One click.
 */

import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import type { DomainStatus, Persona } from '@onegov/core';

import type { GetPersonaInferenceReply, GetStatusReply } from '../messages.js';

const REPO_URL = 'https://github.com/danitamas/onegov.ro';

const PERSONA_PRESENTATION: Record<
  Persona,
  { label: string; icon: string; hint: string }
> = {
  pensioner: { label: 'Vârstnic', icon: '\u{1F475}', hint: 'tipar mare, simplu' },
  standard: { label: 'Standard', icon: '\u{1F9D1}', hint: 'echilibrat' },
  pro: { label: 'Profesionist', icon: '\u{1F4BC}', hint: 'compact, taste rapide' },
  journalist: { label: 'Jurnalist', icon: '\u{1F4F0}', hint: 'tabele largi, copiere CSV' },
};

const PERSONA_ORDER: ReadonlyArray<Persona> = ['pensioner', 'standard', 'pro', 'journalist'];

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

/**
 * Branded header strip. Static — no props, no state. The `g` mark is a CSS
 * tile so we don't ship raster icons inline (they'd bloat popup.js).
 */
function Header() {
  return (
    <header class="pop-header" role="banner">
      <span class="pop-header__mark" aria-hidden="true">
        g
      </span>
      <div class="pop-header__text">
        <span class="pop-header__name">onegov</span>
        <span class="pop-header__tagline">UX layer pentru servicii publice .ro</span>
      </div>
    </header>
  );
}

interface PrimaryToggleProps {
  on: boolean;
  onChange: (next: boolean) => void;
}

/**
 * The headline switch. Replaces the previous "Afișează site-ul original"
 * toggle which was framed backwards (the old default was off, meaning the
 * extension was on; new default is on for clarity).
 */
function PrimaryToggle({ on, onChange }: PrimaryToggleProps) {
  return (
    <section class="pop-section pop-section--toggle">
      <div class="pop-toggle-row">
        <div class="pop-toggle-meta">
          <span class="pop-toggle-meta__label">Aplică interfața onegov</span>
          <span class="pop-toggle-meta__hint">comutator principal</span>
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

interface PersonaCardProps {
  inferred: Persona;
  reason: string;
  override: Persona | null;
  onPick: (next: Persona) => void;
  onClearOverride: () => void;
}

/**
 * Auto-inferred persona + an inline override picker. The picker is hidden by
 * default; clicking "schimbă" reveals it. We always show the inferred persona
 * even after the user has overridden so they can return to auto with one tap.
 */
function PersonaCard({ inferred, reason, override, onPick, onClearOverride }: PersonaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const active = override ?? inferred;
  const present = PERSONA_PRESENTATION[active];
  const hint = override
    ? 'ales manual'
    : `detectat automat${reason ? ' — ' + reason : ''}`;

  return (
    <section class="pop-section pop-section--persona">
      <div class="pop-persona">
        <span class="pop-persona__icon" aria-hidden="true">
          {present.icon}
        </span>
        <div class="pop-persona__body">
          <span class="pop-persona__label">{present.label}</span>
          <span class="pop-persona__reason">
            {hint}
            {' \u00B7 '}
            <button
              type="button"
              class="pop-persona__change"
              aria-expanded={expanded}
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? 'ascunde' : 'schimbă'}
            </button>
            {override ? (
              <>
                {' \u00B7 '}
                <button
                  type="button"
                  class="pop-persona__change"
                  onClick={() => {
                    onClearOverride();
                    setExpanded(false);
                  }}
                >
                  revino la auto
                </button>
              </>
            ) : null}
          </span>
        </div>
      </div>
      {expanded ? (
        <div class="pop-persona-picker" role="radiogroup" aria-label="Alege persona">
          {PERSONA_ORDER.map((p) => {
            const meta = PERSONA_PRESENTATION[p];
            const selected = p === active;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={selected}
                data-persona={p}
                class={`pop-persona-option${selected ? ' pop-persona-option--selected' : ''}`}
                onClick={() => onPick(p)}
              >
                <span class="pop-persona-option__name">
                  {meta.icon} {meta.label}
                </span>
                <span class="pop-persona-option__hint">{meta.hint}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

interface SiteStatusProps {
  status: DomainStatus | null;
  hostname: string | null;
}

/**
 * Current-tab status row. Shows the eTLD+1 (or "—" for unsupported pages)
 * and the verification state in one line.
 */
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
        <span class="pop-footer__sep">\u00B7</span>
        <span>v{version}</span>
      </span>
      <a class="pop-footer__link" href={REPO_URL} target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
    </footer>
  );
}

/**
 * Hydration helpers — defensive parsing. Both keys default to safe values
 * that match the content script's pre-existing behavior (extension on,
 * no override, no auto-inference yet).
 */
function coercePersona(raw: unknown): Persona | null {
  return typeof raw === 'string' && PERSONA_ORDER.includes(raw as Persona)
    ? (raw as Persona)
    : null;
}

function Popup() {
  const [enabled, setEnabled] = useState(true);
  const [override, setOverride] = useState<Persona | null>(null);
  const [inferred, setInferred] = useState<Persona>('standard');
  const [reason, setReason] = useState('încă învăț tiparul tău');
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [hostname, setHostname] = useState<string | null>(null);

  // Hydrate from storage + ask the SW for status and inference.
  useEffect(() => {
    let cancelled = false;
    chrome.storage.local
      .get(['persona', 'extensionEnabled'])
      .then((s) => {
        if (cancelled) return;
        const ov = coercePersona(s['persona']);
        setOverride(ov);
        // extensionEnabled defaults to true when unset (premium first-run).
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

    chrome.runtime
      .sendMessage({ type: 'get-persona-inference' })
      .then((reply: GetPersonaInferenceReply | undefined) => {
        if (cancelled) return;
        if (reply && reply.type === 'get-persona-inference:reply') {
          setInferred(reply.persona);
          setReason(reply.reason);
        }
      })
      .catch(() => {
        // SW unreachable — keep defaults.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function pickPersona(next: Persona) {
    setOverride(next);
    void chrome.storage.local.set({ persona: next }).catch(() => {});
  }

  function clearOverride() {
    setOverride(null);
    // Persist by removing the key so the content script falls back to the
    // SW-inferred persona on next read. `chrome.storage.local.remove` is a
    // single key here.
    void chrome.storage.local.remove('persona').catch(() => {});
  }

  function toggleEnabled(next: boolean) {
    setEnabled(next);
    // Write BOTH the new key and the legacy `showOriginal` key so the
    // existing content-script listener flips host display without changes.
    // `showOriginal` was framed backwards — true meant "hide overlay" — so we
    // map enabled → !showOriginal here.
    void chrome.storage.local
      .set({ extensionEnabled: next, showOriginal: !next })
      .catch(() => {});
  }

  const manifestVersion = chrome.runtime.getManifest().version;

  return (
    <main class="pop-shell">
      <Header />
      <PrimaryToggle on={enabled} onChange={toggleEnabled} />
      <PersonaCard
        inferred={inferred}
        reason={reason}
        override={override}
        onPick={pickPersona}
        onClearOverride={clearOverride}
      />
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
