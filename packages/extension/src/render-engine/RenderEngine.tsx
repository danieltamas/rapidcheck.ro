import { useEffect, useMemo, useState } from 'preact/hooks';
import type { JSX } from 'preact';

import { lookupCui, type CompanyInfo } from '@onegov/api-clients';
import { Accordion, Button } from '@onegov/ui';
import type { Density, SiteIcon, SiteLink, SiteMap, SitePage, SiteSection } from '@onegov/site-data';

import { filterSection, visibleLink } from './density';
import { pageForHref, pageForUrl } from './lookup';
import { resolveAsset } from './assets';

interface RenderEngineProps {
  siteMap: SiteMap;
  density: Density;
  initialUrl: URL;
}

export function RenderEngine({ siteMap, density, initialUrl }: RenderEngineProps) {
  const [page, setPage] = useState<SitePage>(() => pageForUrl(siteMap, initialUrl));

  useEffect(() => {
    const onPopState = () => setPage(pageForUrl(siteMap, new URL(location.href)));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [siteMap]);

  function openHref(href: string): void {
    const next = pageForHref(siteMap, href);
    setPage(next);
    if (!/^https?:\/\//i.test(href)) {
      history.pushState({}, '', href);
    }
  }

  return (
    <div class="onegov-fh-page" data-density={density}>
      <SiteHeader siteMap={siteMap} density={density} onNavigate={openHref} />
      <main>
        <Template page={page} siteMap={siteMap} density={density} onNavigate={openHref} />
      </main>
      <SiteFooter siteMap={siteMap} onNavigate={openHref} />
    </div>
  );
}

interface RuntimeBarProps {
  active: boolean;
  shortLabel: string;
  onToggle: () => void;
}

export function OnegovRuntimeBar({ active, shortLabel, onToggle }: RuntimeBarProps) {
  return (
    <div class="onegov-runtime-bar" data-active={active ? 'true' : 'false'}>
      <div class="onegov-runtime-bar__copy">
        <span class="onegov-runtime-bar__title">
          {active ? `Interfață ONEGOV activă pentru ${shortLabel}` : `Site original ${shortLabel}`}
        </span>
        <span class="onegov-runtime-bar__meta">
          {active
            ? 'Optimizat de ONEGOV. Serviciile și identitatea instituției rămân oficiale.'
            : 'Activează interfața ONEGOV pentru versiunea modernizată.'}
        </span>
      </div>
      <button type="button" class="onegov-runtime-bar__action" onClick={onToggle}>
        {active ? 'Site original' : 'Activează interfața ONEGOV'}
      </button>
    </div>
  );
}

interface NavProps {
  siteMap: SiteMap;
  density: Density;
  onNavigate: (href: string) => void;
}

function SiteHeader({ siteMap, density, onNavigate }: NavProps) {
  const nav = siteMap.navigation.primary.filter((item) => visibleLink(item, density));
  return (
    <header class="fh-common-header">
      <div class="fh-header-container">
        <a class="fh-branding" href="/" title="Mergi la pagina de start" onClick={(e) => navClick(e, '/', onNavigate)}>
          <img
            class="fh-logo"
            src={resolveAsset(siteMap.branding.logo.src)}
            alt={siteMap.branding.logo.alt}
          />
          <span class="fh-branding-text">
            <h1>{siteMap.branding.shortLabel}</h1>
            <span>{siteMap.branding.fullName}</span>
          </span>
        </a>

        <nav class="header-nav" aria-label="Navigare principală">
          {nav.map((item) => (
            <a key={item.href} href={item.href} onClick={(e) => navClick(e, item.href, onNavigate)}>
              {item.label}
            </a>
          ))}
        </nav>

        <div class="header-actions">
          <a
            class="fh-btn fh-btn-accent"
            href={siteMap.navigation.primaryCta.href}
            onClick={(e) => navClick(e, siteMap.navigation.primaryCta.href, onNavigate)}
          >
            <span class="fh-btn-icon" aria-hidden="true">{iconGlyph(siteMap.navigation.primaryCta.icon)}</span>
            <span>{siteMap.navigation.primaryCta.label}</span>
          </a>
        </div>
      </div>
    </header>
  );
}

interface TemplateProps {
  page: SitePage;
  siteMap: SiteMap;
  density: Density;
  onNavigate: (href: string) => void;
}

function Template({ page, siteMap, density, onNavigate }: TemplateProps) {
  if (page.template === 'form') {
    return <FormPage page={page} siteMap={siteMap} />;
  }
  if (page.template === 'external') {
    return <ExternalPage page={page} siteMap={siteMap} />;
  }
  return <HomePage page={page} density={density} onNavigate={onNavigate} />;
}

function HomePage({ page, density, onNavigate }: Omit<TemplateProps, 'siteMap'>) {
  const sections = visibleSections(page, density);
  const primary = sections.find((section) => section.kind === 'task_grid');
  const rest = sections.filter((section) => section !== primary);
  const actions = (page.heroActions ?? []).filter((item) => visibleLink(item, density));

  return (
    <>
      <section class="hero" id="hero-section">
        <div class="container">
          <h1>{page.title}</h1>
          {page.sub ? <p class="subtitle">{page.sub}</p> : null}
          {actions.length > 0 ? <HeroActions actions={actions} onNavigate={onNavigate} /> : null}
        </div>
      </section>

      {primary ? <ContentSection section={primary} density={density} onNavigate={onNavigate} /> : null}

      {rest.map((section) => (
        <ContentSection
          key={`${page.path}-${section.title}`}
          section={section}
          density={density}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}

function HeroActions({
  actions,
  onNavigate,
}: {
  actions: ReadonlyArray<SiteLink>;
  onNavigate: (href: string) => void;
}) {
  return (
    <div class="cta-buttons">
      {actions.map((action, index) => (
        <a
          key={action.href}
          class={index === 0 ? 'btn btn-primary' : 'btn btn-secondary'}
          href={action.href}
          role="button"
          onClick={(e) => navClick(e, action.href, onNavigate)}
        >
          <span aria-hidden="true">{iconGlyph(action.icon)}</span>
          {action.label}
        </a>
      ))}
    </div>
  );
}

function ContentSection({
  section,
  density,
  onNavigate,
}: {
  section: SiteSection;
  density: Density;
  onNavigate: (href: string) => void;
}) {
  if (section.kind === 'faq') {
    return (
      <section class="info-card-wrapper" id="faq">
        <div class="container">
          <h2 class="fh-section-title">{section.title}</h2>
          <div class="faq-container">
            <Accordion
              items={section.items.map((item) => ({
                id: item.id,
                title: item.question,
                content: <p>{item.answer}</p>,
              }))}
              defaultOpen={density === 'bogat' ? [section.items[0]?.id ?? ''] : []}
            />
          </div>
        </div>
      </section>
    );
  }

  if (section.kind === 'task_grid') {
    return (
      <section id="cum-functioneaza" class="info-card-wrapper info-card-wrapper--muted">
        <div class="container">
          <h2 class="fh-section-title">{section.title}</h2>
          <div class="steps-grid">
            {section.items.map((item) => (
              <a
                key={item.href}
                class="step-card"
                href={item.href}
                onClick={(e) => navClick(e, item.href, onNavigate)}
              >
                <div class="step-icon-container" aria-hidden="true">{iconGlyph(item.icon)}</div>
                <div class="step-body">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="despre" class="info-card-wrapper">
      <div class="container">
        <div class="info-card">
          <div class="info-card-top">
            <div class="info-card-icon" aria-hidden="true">i</div>
            <div class="info-card-content">
              <h2>{section.title}</h2>
              {section.eyebrow ? <p>{section.eyebrow}</p> : null}
            </div>
          </div>
          <div class="fh-link-grid">
            {section.items.map((item) => (
              <a
                key={item.href}
                class="fh-link-card"
                href={item.href}
                onClick={(e) => navClick(e, item.href, onNavigate)}
              >
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FormPage({ page, siteMap }: { page: SitePage; siteMap: SiteMap }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompanyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const field = page.form?.fields[0];

  async function submit(e: JSX.TargetedEvent<HTMLFormElement, Event>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const found = await lookupCui(value);
      if (!found) {
        setError('Nu am găsit acest CUI în răspunsul ANAF.');
      } else {
        setResult(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu s-a putut verifica CUI-ul.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section class="info-card-wrapper">
      <div class="container">
        <div class="info-card fh-form-card">
          <div class="info-card-top">
            <img
              class="fh-form-logo"
              src={resolveAsset(siteMap.branding.logo.src)}
              alt={siteMap.branding.logo.alt}
            />
            <div class="info-card-content">
              <h2>{page.title}</h2>
              {page.sub ? <p>{page.sub}</p> : null}
            </div>
          </div>
          {field ? (
            <form class="fh-form" onSubmit={submit}>
              <label>
                <span>{field.label}</span>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  required={field.required}
                  pattern={field.pattern}
                  value={value}
                  onInput={(e) => setValue(e.currentTarget.value)}
                />
              </label>
              {field.helper ? <small>{field.helper}</small> : null}
              <Button type="submit" loading={loading}>{page.form?.submitLabel ?? 'Trimite'}</Button>
            </form>
          ) : null}
          {result ? (
            <div class="fh-result" role="status">
              <strong>{result.name}</strong>
              <p>CUI: {result.cui}</p>
              {result.address ? <p>{result.address}</p> : null}
              <p>TVA: {result.vatActive === null ? 'necunoscut' : result.vatActive ? 'activ' : 'inactiv'}</p>
            </div>
          ) : null}
          {error ? <div class="fh-result fh-result--error" role="alert">{error}</div> : null}
        </div>
      </div>
    </section>
  );
}

function ExternalPage({ page, siteMap }: { page: SitePage; siteMap: SiteMap }) {
  const target = page.externalUrl ?? `https://www.${siteMap.domain}/`;
  return (
    <section class="info-card-wrapper">
      <div class="container">
        <div class="info-card">
          <div class="info-card-content">
            <h2>{page.title}</h2>
            {page.sub ? <p>{page.sub}</p> : null}
          </div>
          <a class="btn btn-primary" href={target} target="_blank" rel="noopener noreferrer">
            Deschide pe {siteMap.domain}
          </a>
        </div>
      </div>
    </section>
  );
}

function SiteFooter({
  siteMap,
  onNavigate,
}: {
  siteMap: SiteMap;
  onNavigate: (href: string) => void;
}) {
  const institutionLinks = useMemo(() => siteMap.footer.slice(0, 4), [siteMap.footer]);
  const serviceLinks = useMemo(() => siteMap.navigation.primary.slice(0, 4), [siteMap.navigation.primary]);
  return (
    <footer class="fara-hartie-footer">
      <div class="fara-hartie-footer-content">
        <div class="fh-footer-grid">
          <div class="fh-footer-brand">
            <img
              src={resolveAsset(siteMap.branding.logo.src)}
              alt={siteMap.branding.logo.alt}
            />
            <span>
              <strong>{siteMap.branding.fullName}</strong>
              <small>{siteMap.branding.shortLabel}</small>
            </span>
          </div>

          <FooterColumn title="Servicii" links={serviceLinks} onNavigate={onNavigate} />
          <FooterColumn title="Instituție" links={institutionLinks} onNavigate={onNavigate} />
        </div>

        <div class="fh-footer-bottom">
          <p>© 2026 {siteMap.branding.fullName} - Toate drepturile rezervate</p>
          <span>Optimizat de ONEGOV</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  onNavigate,
}: {
  title: string;
  links: ReadonlyArray<SiteLink>;
  onNavigate: (href: string) => void;
}) {
  return (
    <div class="fh-footer-column">
      <h2>{title}</h2>
      <div class="fara-hartie-footer-links">
        {links.map((item) => (
          <a
            key={item.href}
            class="footer-link"
            href={item.href}
            onClick={(e) => navClick(e, item.href, onNavigate)}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function visibleSections(page: SitePage, density: Density): SiteSection[] {
  return (page.sections ?? [])
    .map((section) => filterSection(section, density))
    .filter((section): section is SiteSection => section !== null);
}

function navClick(
  e: JSX.TargetedMouseEvent<HTMLAnchorElement>,
  href: string,
  onNavigate: (href: string) => void,
): void {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  onNavigate(href);
}

function iconGlyph(icon?: SiteIcon): string {
  switch (icon) {
    case 'search': return 'CUI';
    case 'calendar': return 'DAT';
    case 'computer': return 'SPV';
    case 'help': return '?';
    case 'info': return 'i';
    case 'building': return 'SED';
    case 'document': return 'DOC';
    case 'shield': return 'OK';
    case 'money': return 'LEI';
    case 'external': return 'EXT';
    default: return 'ANAF';
  }
}
