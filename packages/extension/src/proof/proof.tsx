/**
 * Proof page — standalone verification credential for a directory entity.
 *
 * Opened via chrome-extension://<id>/proof.html?entity=<id> or
 * ?domain=<hostname>. Renders a branded identity card that confirms
 * the entity's official status. No messaging required — reads the
 * directory directly since this runs in the extension's own origin.
 */

import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import {
  findEntityByDomain,
  listEntities,
  type VerifiedEntity,
  type VerifiedEntitySummary,
  type EntityCategory,
} from '@rapidcheck/directory';
import { toEntitySummary } from '@rapidcheck/directory';

import logoUrl from '../../icons-src/rapidcheck.logo.color.svg';

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

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function resolveEntity(): { entity: VerifiedEntity; summary: VerifiedEntitySummary } | null {
  const params = new URLSearchParams(globalThis.location.search);
  const id = params.get('entity');
  const domain = params.get('domain');

  if (id) {
    const found = listEntities().find((e) => e.id === id);
    return found ? { entity: found, summary: toEntitySummary(found) } : null;
  }

  if (domain) {
    const found = findEntityByDomain(domain);
    return found ? { entity: found, summary: toEntitySummary(found) } : null;
  }

  return null;
}

function formatCategory(cat: EntityCategory): string {
  return CATEGORY_CHIP[cat]?.label ?? cat;
}

function ProofCard({ entity }: { entity: VerifiedEntity }) {
  const chip = CATEGORY_CHIP[entity.category] ?? CATEGORY_CHIP['other'];
  const categoryLabel = formatCategory(entity.category);

  return (
    <div class="proof-card">
      <div class="proof-card__accent-bar" aria-hidden="true" />
      <div class="proof-card__inner">
        <div class="proof-card__status">
          <span class="proof-card__dot proof-card__dot--verified" aria-hidden="true" />
          <span class="proof-card__status-label">Site oficial verificat</span>
        </div>

        <div class="proof-card__icon-row">
          <span class="proof-card__shield"><ShieldIcon /></span>
          <span class="proof-card__eyebrow">Identitate oficială</span>
        </div>

        <h1 class="proof-card__name">{entity.name}</h1>

        <div class="proof-card__meta-row">
          <span class="proof-card__chip" style={{ '--chip-color': chip.color } as preact.JSX.CSSProperties}>
            {chip.label}
          </span>
          <span class="proof-card__domain">{entity.domains[0]}</span>
        </div>

        {entity.shortName && entity.shortName !== entity.name && (
          <div class="proof-card__meta-row">
            <span class="proof-card__domain" style={{ fontWeight: 600 }}>Acronim: {entity.shortName}</span>
          </div>
        )}

        <div class="proof-card__divider" />

        <div class="proof-card__details">
          <div class="proof-card__detail-row">
            <span class="proof-card__detail-label">Categorie</span>
            <span class="proof-card__detail-value">{categoryLabel}</span>
          </div>
          <div class="proof-card__detail-row">
            <span class="proof-card__detail-label">Domeniu principal</span>
            <span class="proof-card__detail-value">{entity.domains.join(', ')}</span>
          </div>
          <div class="proof-card__detail-row">
            <span class="proof-card__detail-label">Pagină oficială</span>
            <span class="proof-card__detail-value">
              <a href={entity.officialUrls[0]} target="_blank" rel="noopener noreferrer">
                {entity.officialUrls[0]}
              </a>
            </span>
          </div>
          <div class="proof-card__detail-row">
            <span class="proof-card__detail-label">Sursa verificării</span>
            <span class="proof-card__detail-value">
              <a href={entity.sourceUrls[0]} target="_blank" rel="noopener noreferrer">
                Sursă
              </a>
            </span>
          </div>
          <div class="proof-card__detail-row">
            <span class="proof-card__detail-label">Ultima verificare</span>
            <span class="proof-card__detail-value">{entity.lastVerifiedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div class="proof-not-found">
      <div class="proof-not-found__title">Entitate negăsită</div>
      <p class="proof-not-found__text">
        Nu am găsit o entitate verificată pentru adresa solicitată.
        Verifică parametrul din URL sau caută entitatea în directorul RapidCheck.
      </p>
    </div>
  );
}

function ProofPage() {
  const [result, setResult] = useState<{ entity: VerifiedEntity } | null>(undefined as unknown as { entity: VerifiedEntity } | null);

  useEffect(() => {
    setResult(resolveEntity());
  }, []);

  return (
    <main class="proof-shell">
      <div class="proof-header">
        <img class="proof-header__logo" src={logoUrl} alt="RapidCheck.ro" height={24} />
      </div>

      {result ? <ProofCard entity={result.entity} /> : <NotFound />}

      <footer class="proof-footer">
        <span>Verificare furnizată de</span>
        <a class="proof-footer__brand" href="https://rapidcheck.ro" target="_blank" rel="noopener noreferrer">
          RapidCheck.ro
        </a>
      </footer>
    </main>
  );
}

const mount = document.getElementById('app');
if (mount) render(<ProofPage />, mount);

export {};