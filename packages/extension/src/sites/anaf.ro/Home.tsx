/**
 * anaf.ro Home page — composed from `@onegov/ui` primitives.
 *
 * Layout (per task spec §D):
 *   AppShell (status bar lives outside, in App.tsx)
 *     Container width=lg
 *       Hero
 *         "Bun venit la ANAF"
 *         "Agenția Națională de Administrare Fiscală — Servicii fiscale online"
 *         SearchBox: "Verifică un CUI sau caută un serviciu..."
 *       CardGrid cols=3 — Servicii principale
 *         Verifică un CUI
 *         Calendar fiscal
 *         Servicii online
 *       Accordion (collapsed in Simplu, open in Bogat) — Mai multe
 *         Asistență fiscală, Info publice, Integritate, ...
 *       Footer (slim) — original ANAF identity, link to "ascunde →"
 *
 * Density rules:
 *   minimal:  hero only + 1 primary action (CUI search) — Mai multe collapsed
 *   simplu:   hero + 3 service cards + Mai multe collapsed (default)
 *   bogat:    hero + all cards expanded + Mai multe pre-open
 */

import { useState } from 'preact/hooks';
import {
  AppShell,
  Container,
  Hero,
  SearchBox,
  CardGrid,
  Card,
  CardBody,
  Stack,
  Cluster,
  Heading,
  Paragraph,
  Text,
  Footer,
  FooterColumn,
  Accordion,
  Badge,
  Button,
} from '@onegov/ui';
import type { AccordionItem } from '@onegov/ui';

import type { AnafContext } from './context.js';
import type { SiteRuntime } from '../types.js';
import { submitForm } from './bridge.js';

interface Props {
  ctx: AnafContext;
  runtime: SiteRuntime;
  /** When the route classified as 'external' the section name is surfaced here. */
  sectionHint?: string;
}

interface ServiceCard {
  title: string;
  description: string;
  href: string;
  cta: string;
  primary?: boolean;
}

const SERVICES: ReadonlyArray<ServiceCard> = [
  {
    title: 'Verifică un CUI',
    description:
      'Confirmă rapid o firmă plătitoare de TVA folosind CUI/CIF-ul.',
    href: '/anaf/internet/ANAF/?route=cui',
    cta: 'Caută CUI',
    primary: true,
  },
  {
    title: 'Calendar fiscal',
    description:
      'Termenele importante și obligațiile lunii curente, fără surprize.',
    href: 'https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili/calendar_fiscal',
    cta: 'Vezi calendarul',
  },
  {
    title: 'Servicii online',
    description:
      'SPV, declarații, plăți și formulare electronice — toate la un click.',
    href: 'https://www.anaf.ro/anaf/internet/ANAF/servicii_online',
    cta: 'Mergi la servicii',
  },
];

const SECONDARY_LINKS: ReadonlyArray<{ title: string; href: string; description: string }> = [
  {
    title: 'Asistență fiscală',
    description: 'Telefon, e-mail, întrebări frecvente, acte normative.',
    href: 'https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili',
  },
  {
    title: 'Informații publice',
    description: 'Solicitări Legea 544/2001, declarații de avere, transparență.',
    href: 'https://www.anaf.ro/anaf/internet/ANAF/info_publice',
  },
  {
    title: 'Integritate',
    description: 'Cod etic, sesizări, conflicte de interese.',
    href: 'https://www.anaf.ro/anaf/internet/ANAF/integritate',
  },
  {
    title: 'Programe & proiecte',
    description: 'Modernizare ANAF și proiecte cu finanțare europeană.',
    href: 'https://www.anaf.ro/anaf/internet/ANAF/proiecte',
  },
  {
    title: 'Sancțiuni internaționale',
    description: 'Liste consolidate, alerte, ghiduri de aplicare.',
    href: 'https://www.anaf.ro/anaf/internet/ANAF/sanctiuni',
  },
  {
    title: 'Contact & sedii',
    description: 'Adresele administrațiilor județene, program de lucru.',
    href: 'https://www.anaf.ro/anaf/internet/ANAF/contact',
  },
];

const NEWS_LINKS: ReadonlyArray<{ title: string; href: string }> = [
  {
    title: 'Comunicate de presă',
    href: 'https://www.anaf.ro/anaf/internet/ANAF/comunicate_presa',
  },
  {
    title: 'Transparență decizională',
    href: 'https://www.anaf.ro/anaf/internet/ANAF/transparenta_decizionala',
  },
];

export function Home({ ctx, runtime, sectionHint }: Props) {
  const [query, setQuery] = useState('');
  const density = runtime.density;

  const showServices = density !== 'minimal';
  const showSecondary = density !== 'minimal';
  const accordionInitial: AccordionItem[] = SECONDARY_LINKS.map((link) => ({
    id: link.href,
    title: link.title,
    content: (
      <Stack gap="sm">
        <Paragraph muted>{link.description}</Paragraph>
        <Cluster gap="sm">
          <Button variant="link" onClick={() => navigate(link.href)}>
            Deschide pe anaf.ro
          </Button>
        </Cluster>
      </Stack>
    ),
  }));

  function handleSearch(value: string) {
    const v = value.trim();
    if (!v) return;
    const result = submitForm({ kind: 'cui-search', cui: v });
    if (result.submitted || result.navigated) return;
    // Validation/normalisation failed — show inline hint via a tiny state
    // toggle. (We don't need a full toast for v0.2.0.)
    setQuery(v);
  }

  function handleServiceClick(service: ServiceCard) {
    if (service.href.startsWith('/')) {
      // Internal anaf route — let our bridge handle it (CUI search etc.)
      if (service.title === 'Verifică un CUI') {
        // Focus the search box (rendered above) by re-firing on empty state.
        const el = document.querySelector('input[type="search"]');
        if (el && 'focus' in el) (el as HTMLInputElement).focus();
        return;
      }
    }
    navigate(service.href);
  }

  return (
    <AppShell
      footer={
        <Footer
          bottom={
            <Cluster justify="between" gap="md">
              <Text size="xs" tone="muted">
                © Agenția Națională de Administrare Fiscală
              </Text>
              <Text size="xs" tone="muted">
                Această pagină este redată de onegov ·{' '}
                <button
                  type="button"
                  class="anaf-link-button"
                  onClick={runtime.showOriginal}
                >
                  ascunde →
                </button>
              </Text>
            </Cluster>
          }
        >
          <FooterColumn title="ANAF">
            <ul class="anaf-link-list">
              <li>
                <a href="https://www.anaf.ro/anaf/internet/ANAF/despre_anaf">
                  Despre ANAF
                </a>
              </li>
              <li>
                <a href="https://www.anaf.ro/anaf/internet/ANAF/contact">
                  Contact & sedii
                </a>
              </li>
              <li>
                <a href="https://www.anaf.ro/anaf/internet/ANAF/info_publice">
                  Informații publice
                </a>
              </li>
            </ul>
          </FooterColumn>
          <FooterColumn title="Servicii">
            <ul class="anaf-link-list">
              <li>
                <a href="https://www.anaf.ro/anaf/internet/ANAF/servicii_online">
                  Servicii online
                </a>
              </li>
              <li>
                <a href="https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili/calendar_fiscal">
                  Calendar fiscal
                </a>
              </li>
              <li>
                <a href="https://www.anaf.ro/anaf/internet/ANAF/spv">SPV</a>
              </li>
            </ul>
          </FooterColumn>
          <FooterColumn title="Noutăți">
            <ul class="anaf-link-list">
              {NEWS_LINKS.map((n) => (
                <li key={n.href}>
                  <a href={n.href}>{n.title}</a>
                </li>
              ))}
            </ul>
          </FooterColumn>
        </Footer>
      }
    >
      <Container width="lg" class="anaf-home">
        <Stack gap="xl">
          {sectionHint ? (
            <Cluster gap="sm">
              <Badge tone="info" pill>
                {`secțiune: ${sectionHint}`}
              </Badge>
              {ctx.pageTitle ? (
                <Text size="sm" tone="muted">
                  {ctx.pageTitle}
                </Text>
              ) : null}
            </Cluster>
          ) : null}

          <Hero
            eyebrow="Agenția Națională de Administrare Fiscală"
            title="Bun venit la ANAF"
            description="Servicii fiscale online — verifică o firmă, găsește un serviciu, planifică-ți obligațiile."
            actions={
              <div class="anaf-hero-search">
                <SearchBox
                  value={query}
                  onValueChange={setQuery}
                  onSubmit={handleSearch}
                  placeholder="Verifică un CUI sau caută un serviciu..."
                  submitLabel="Caută"
                />
                <Text size="xs" tone="muted">
                  Introdu un CUI (ex: 14841555) sau apasă Enter pentru a căuta.
                </Text>
              </div>
            }
          />

          {showServices ? (
            <Stack gap="md">
              <Heading level={2} eyebrow="Servicii principale">
                Ce poți face acum
              </Heading>
              <CardGrid cols={3}>
                {SERVICES.map((service) => (
                  <Card
                    key={service.title}
                    variant="interactive"
                    class={service.primary ? 'anaf-card anaf-card--primary' : 'anaf-card'}
                    onClick={() => handleServiceClick(service)}
                    role="link"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      const ev = e as unknown as KeyboardEvent;
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        handleServiceClick(service);
                      }
                    }}
                  >
                    <CardBody>
                      <Stack gap="sm">
                        <Heading level={3}>{service.title}</Heading>
                        <Paragraph muted>{service.description}</Paragraph>
                        <Cluster gap="xs">
                          <Text size="sm" weight="semibold" tone="primary">
                            {service.cta} →
                          </Text>
                        </Cluster>
                      </Stack>
                    </CardBody>
                  </Card>
                ))}
              </CardGrid>
            </Stack>
          ) : (
            <Cluster justify="center">
              <Button onClick={() => handleServiceClick(SERVICES[0]!)}>
                Verifică un CUI →
              </Button>
            </Cluster>
          )}

          {showSecondary ? (
            <Stack gap="md">
              <Heading level={2} eyebrow="Mai multe">
                Toate serviciile
              </Heading>
              <Accordion
                items={accordionInitial}
                multiple
                defaultOpen={density === 'bogat' ? accordionInitial.map((i) => i.id) : []}
              />
            </Stack>
          ) : null}

          {density === 'bogat' ? (
            <Stack gap="md">
              <Heading level={2} eyebrow="Noutăți">
                Comunicate și transparență
              </Heading>
              <CardGrid cols={2}>
                {NEWS_LINKS.map((n) => (
                  <Card
                    key={n.href}
                    variant="premium"
                    class="anaf-card"
                    onClick={() => navigate(n.href)}
                    role="link"
                    tabIndex={0}
                  >
                    <CardBody>
                      <Stack gap="xs">
                        <Heading level={3}>{n.title}</Heading>
                        <Text size="sm" tone="primary" weight="semibold">
                          deschide pe anaf.ro →
                        </Text>
                      </Stack>
                    </CardBody>
                  </Card>
                ))}
              </CardGrid>
            </Stack>
          ) : null}
        </Stack>
      </Container>
    </AppShell>
  );
}

/** Encapsulated `location.assign` for testability. */
function navigate(href: string): void {
  try {
    location.assign(href);
  } catch {
    // jsdom / happy-dom in tests sometimes refuse cross-origin navigation;
    // swallow so the App stays alive for the user.
  }
}
