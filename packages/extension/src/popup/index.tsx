/** Popup — trust/safety control surface. */

import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import type { DomainStatus } from '@rapidcheck/core';
import type { EntityCategory, VerifiedEntitySummary } from '@rapidcheck/directory';

import type { GetStatusReply, SearchEntitiesReply } from '../messages.js';
import logoUrl from '../../icons-src/rapidcheck.logo.color.svg';

const REPO_URL = 'https://rapidcheck.ro';

const CATEGORY_CHIP: Record<EntityCategory, { label: string; color: string }> = {
  'central-gov': { label: 'Guvern', color: '#1a237e' },
  'local-gov': { label: 'Local', color: '#283593' },
  'public-service': { label: 'Serviciu public', color: '#1565c0' },
  bank: { label: 'Bancă', color: '#2e7d32' },
  'mobile-operator': { label: 'Telecom', color: '#6a1b9a' },
  regulator: { label: 'Regulator', color: '#e65100' },
  court: { label: 'Justiție', color: '#4e342e' },
  utility: { label: 'Utilitate', color: '#00695c' },
  other: { label: 'Verificat', color: '#37474f' },
};

function ShieldCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function statusPillFor(status: DomainStatus | null): {
  variant: 'verified' | 'lookalike' | 'unknown';
  glyph: string;
  label: string;
} {
  if (!status) return { variant: 'unknown', glyph: '\u26AA', label: 'Site neclasificat' };
  switch (status.kind) {
    case 'verified':
      return { variant: 'verified', glyph: '\u2705', label: 'Site oficial verificat' };
    case 'lookalike':
      return { variant: 'lookalike', glyph: '\u{1F6A8}', label: 'Domeniu suspect' };
    case 'unknown':
      return { variant: 'unknown', glyph: '\u26AA', label: 'Site neverificat' };
  }
}

function Header() {
  return (
    <header class="pop-header" role="banner">
      <img class="pop-header__logo" src={logoUrl} alt="RapidCheck.ro" height={28} />
      <span class="pop-header__tagline">Verifică rapid site-uri, formulare și plăți online</span>
    </header>
  );
}

function ProtectionToggle({ on, onChange }: { on: boolean; onChange: (next: boolean) => void }) {
  return (
    <section class="pop-section pop-section--toggle">
      <div class="pop-toggle-row">
        <div class="pop-toggle-meta">
          <span class="pop-toggle-meta__label">Protecție RapidCheck</span>
          <span class="pop-toggle-meta__hint">Avertizări anti-fraudă și verificări la trimiterea formularelor</span>
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

function StatusBar({
  status,
  hostname,
}: {
  status: DomainStatus | null;
  hostname: string | null;
}) {
  const { variant, label } = statusPillFor(status);
  const display = hostname && hostname.length > 0 ? hostname : '\u2014';
  return (
    <div class={`pop-status-bar pop-status-bar--${variant}`} role="status" aria-live="polite">
      <span class="pop-status-bar__dot" aria-hidden="true" data-variant={variant} />
      <div class="pop-status-bar__body">
        <span class="pop-status-bar__host">{display}</span>
        <span class="pop-status-bar__label">{label}</span>
      </div>
    </div>
  );
}

function IdentityCard({ entity }: { entity: VerifiedEntitySummary }) {
  const chip = CATEGORY_CHIP[entity.category] ?? CATEGORY_CHIP['other'];
  const proofUrl = chrome.runtime.getURL(`proof.html?entity=${encodeURIComponent(entity.id)}`);
  return (
    <div class="pop-id-card">
      <div class="pop-id-card__accent" aria-hidden="true" />
      <div class="pop-id-card__inner">
        <div class="pop-id-card__header">
          <ShieldCheckIcon />
          <span class="pop-id-card__eyebrow">Identitate oficială</span>
        </div>
        <strong class="pop-id-card__name">{entity.name}</strong>
        <div class="pop-id-card__meta-row">
          <span class="pop-id-card__chip" style={{ '--chip-color': chip.color } as preact.JSX.CSSProperties}>
            {chip.label}
          </span>
          <span class="pop-id-card__domain">{entity.primaryDomain}</span>
        </div>
        <div class="pop-id-card__actions">
          <a class="pop-id-card__proof" href={proofUrl} target="_blank" rel="noopener noreferrer">
            Pagina de verificare
          </a>
          <a class="pop-id-card__link" href={entity.sourceUrl} target="_blank" rel="noopener noreferrer">
            Sursa
          </a>
        </div>
      </div>
    </div>
  );
}

function LookalikeWarning({ status }: { status: DomainStatus & { kind: 'lookalike' } }) {
  return (
    <div class="pop-warning" role="alert">
      <div class="pop-warning__icon-wrap">
        <AlertTriangleIcon />
      </div>
      <div class="pop-warning__body">
        <strong class="pop-warning__title">Atenție: domeniu suspect</strong>
        <p class="pop-warning__text">
          Acest site seamănă cu <strong>{status.nearest.domain}</strong>.
          Nu introduce date sensibile aici.
        </p>
      </div>
    </div>
  );
}

function SiteStatus({
  status,
  hostname,
  entity,
}: {
  status: DomainStatus | null;
  hostname: string | null;
  entity: VerifiedEntitySummary | null;
}) {
  return (
    <section class="pop-section pop-section--site">
      <StatusBar status={status} hostname={hostname} />
      {status?.kind === 'verified' && entity && (
        <IdentityCard entity={entity} />
      )}
      {status?.kind === 'verified' && !entity && (
        <p class="pop-status-bar__note">Domeniu oficial verificat: {status.domain.domain}</p>
      )}
      {status?.kind === 'lookalike' && (
        <LookalikeWarning status={status} />
      )}
      {status?.kind === 'unknown' && (
        <p class="pop-status-bar__note">Nu este în directorul RapidCheck.</p>
      )}
    </section>
  );
}

function FeatureList() {
  return (
    <section class="pop-section pop-section--features" aria-label="Protecții active">
      <ul class="pop-feature-list">
        <li>Verifică domenii oficiale din România</li>
        <li>Blochează domeniile care seamănă cu instituții reale</li>
        <li>Avertizează înainte ca formularele să trimită date sensibile către site-uri neverificate</li>
      </ul>
    </section>
  );
}

function LinkResolver() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<VerifiedEntitySummary[]>([]);
  const hasQuery = query.trim().length >= 2;

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    void chrome.runtime
      .sendMessage({ type: 'search-entities', query: trimmed, limit: 4 })
      .then((reply: SearchEntitiesReply | undefined) => {
        if (!cancelled) setResults(reply?.results ?? []);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <section class="pop-section pop-section--resolver" aria-label="Caută link oficial">
      <label class="pop-resolver__label" for="rapidcheck-resolver">
        Caută link oficial
      </label>
      <div class="pop-resolver__field">
        <span class="pop-resolver__icon" aria-hidden="true"><SearchIcon /></span>
        <input
          id="rapidcheck-resolver"
          class="pop-resolver__input"
          type="search"
          value={query}
          placeholder="ANAF, BT, Vodafone, primaria iasi"
          autocomplete="off"
          onInput={(ev) => setQuery((ev.currentTarget as HTMLInputElement).value)}
        />
      </div>
      {results.length > 0 && (
        <ul class="pop-resolver__results">
          {results.map((entity) => {
            const chip = CATEGORY_CHIP[entity.category] ?? CATEGORY_CHIP['other'];
            return (
              <li class="pop-resolver__result" key={entity.id}>
                <a class="pop-resolver__link" href={entity.officialUrl} target="_blank" rel="noopener noreferrer">
                  <span class="pop-resolver__name">{entity.shortName ?? entity.name}</span>
                  <span class="pop-resolver__badge" style={{ '--chip-color': chip.color } as preact.JSX.CSSProperties}>
                    {chip.label}
                  </span>
                  <span class="pop-resolver__domain">{entity.primaryDomain}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      {hasQuery && results.length === 0 && (
        <p class="pop-resolver__empty">Nu am găsit o potrivire în directorul RapidCheck.</p>
      )}
    </section>
  );
}

function Footer({ version }: { version: string }) {
  return (
    <footer class="pop-footer">
      <span class="pop-footer__group">
        <span>RapidCheck.ro</span>
        <span class="pop-footer__sep">{'\u00B7'}</span>
        <span>v{version}</span>
      </span>
      <a class="pop-footer__link" href={REPO_URL} target="_blank" rel="noopener noreferrer">
        Website
      </a>
    </footer>
  );
}

function Popup() {
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState<DomainStatus | null>(null);
  const [hostname, setHostname] = useState<string | null>(null);
  const [entity, setEntity] = useState<VerifiedEntitySummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    void chrome.storage.local
      .get(['protectionEnabled'])
      .then((s) => {
        if (!cancelled) setEnabled(s['protectionEnabled'] !== false);
      })
      .catch(() => {});
    void chrome.runtime
      .sendMessage({ type: 'get-status' })
      .then((reply: GetStatusReply | undefined) => {
        if (cancelled) return;
        setStatus(reply?.status ?? null);
        setHostname(reply?.hostname ?? null);
        setEntity(reply?.entity ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const listener = (changes: Record<string, chrome.storage.StorageChange>, areaName: string): void => {
      if (areaName !== 'local') return;
      if (changes['protectionEnabled'] !== undefined) {
        setEnabled(changes['protectionEnabled'].newValue !== false);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener?.(listener);
  }, []);

  function toggleEnabled(next: boolean) {
    setEnabled(next);
    void chrome.storage.local.set({ protectionEnabled: next }).catch(() => {});
  }

  const manifestVersion = chrome.runtime.getManifest().version;
  return (
    <main class="pop-shell">
      <Header />
      <ProtectionToggle on={enabled} onChange={toggleEnabled} />
      <SiteStatus status={status} hostname={hostname} entity={entity} />
      <LinkResolver />
      {enabled ? <FeatureList /> : null}
      <Footer version={manifestVersion} />
    </main>
  );
}

const mount = document.getElementById('app');
if (mount) render(<Popup />, mount);

export {};
