/**
 * anaf.ro CUI lookup page — composed from `@onegov/ui` primitives.
 *
 * Two states:
 *   - no CUI yet → big SearchBox with helper text + recent searches hint
 *   - CUI in URL → show a structured DefinitionList placeholder + a clear
 *     "Verifică pe ANAF" button that bridges to the public webservice.
 *
 * v0.2.0 does NOT call the ANAF webservice from here — bridge.ts navigates
 * to the public anaf URL and the user sees the response on the original
 * page (which gets re-skinned again on next nav). Calling the API
 * (relaxed invariant #4 per task spec §H.4) is queued for a fast follow.
 */

import { useState } from 'preact/hooks';
import {
  AppShell,
  Container,
  Stack,
  Cluster,
  Heading,
  Paragraph,
  Text,
  SearchBox,
  Card,
  CardBody,
  Button,
  DefinitionList,
  Callout,
  Badge,
  Footer,
  FooterColumn,
  Breadcrumb,
} from '@onegov/ui';

import type { AnafContext } from './context.js';
import type { SiteRuntime } from '../types.js';
import { submitForm, normaliseCui, buildCuiHumanUrl } from './bridge.js';

interface Props {
  ctx: AnafContext;
  runtime: SiteRuntime;
  initialCui?: string;
}

export function Cui({ ctx, runtime, initialCui }: Props) {
  const [query, setQuery] = useState(initialCui ?? '');
  const [feedback, setFeedback] = useState<'idle' | 'invalid'>('idle');

  function handleSearch(value: string) {
    const normalised = normaliseCui(value);
    if (!normalised) {
      setFeedback('invalid');
      return;
    }
    setFeedback('idle');
    submitForm({ kind: 'cui-search', cui: normalised });
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
          <FooterColumn title="Despre verificare CUI">
            <Paragraph muted>
              Datele provin din registrele publice ANAF. Verifică starea TVA, denumirea
              și sediul oficial al unei firme.
            </Paragraph>
          </FooterColumn>
        </Footer>
      }
    >
      <Container width="lg" class="anaf-cui">
        <Stack gap="xl">
          <Breadcrumb
            items={[
              { label: 'ANAF', href: 'https://www.anaf.ro/anaf/internet/ANAF/' },
              { label: 'Servicii online', href: 'https://www.anaf.ro/anaf/internet/ANAF/servicii_online' },
              { label: 'Verificare CUI' },
            ]}
          />

          <Stack gap="md">
            <Cluster gap="sm">
              <Badge tone="info" pill>
                Verificare publică
              </Badge>
              {ctx.pageTitle ? (
                <Text size="sm" tone="muted">
                  {ctx.pageTitle}
                </Text>
              ) : null}
            </Cluster>

            <Heading level={1}>Verifică un CUI</Heading>
            <Paragraph variant="lead">
              Introdu codul unic de înregistrare al unei firme pentru a vedea informațiile
              publice și starea TVA.
            </Paragraph>

            <div class="anaf-cui__search">
              <SearchBox
                value={query}
                onValueChange={(v) => {
                  setQuery(v);
                  if (feedback === 'invalid') setFeedback('idle');
                }}
                onSubmit={handleSearch}
                placeholder="ex: 14841555 sau RO14841555"
                submitLabel="Verifică"
              />
            </div>

            {feedback === 'invalid' ? (
              <Callout tone="warning" title="CUI invalid">
                Introdu un CUI între 2 și 10 cifre (cu sau fără prefixul „RO”).
              </Callout>
            ) : null}
          </Stack>

          {initialCui ? (
            <Card variant="premium" class="anaf-card">
              <CardBody>
                <Stack gap="md">
                  <Cluster justify="between">
                    <Heading level={2}>CUI {initialCui}</Heading>
                    <Badge tone="info">verificare în curs</Badge>
                  </Cluster>
                  <DefinitionList
                    items={[
                      { term: 'CUI', description: initialCui },
                      {
                        term: 'Sursă',
                        description: (
                          <Text size="sm" mono>
                            webservicesp.anaf.ro
                          </Text>
                        ),
                      },
                      {
                        term: 'Status',
                        description: (
                          <Text size="sm" tone="muted">
                            Apasă „Deschide pe ANAF” pentru detalii live.
                          </Text>
                        ),
                      },
                    ]}
                  />
                  <Cluster gap="sm">
                    <Button onClick={() => location.assign(buildCuiHumanUrl(initialCui))}>
                      Deschide pe ANAF →
                    </Button>
                    <Button variant="ghost" onClick={() => setQuery('')}>
                      Caută alt CUI
                    </Button>
                  </Cluster>
                </Stack>
              </CardBody>
            </Card>
          ) : (
            <Card variant="premium" class="anaf-card">
              <CardBody>
                <Stack gap="sm">
                  <Heading level={3}>Cum funcționează?</Heading>
                  <Paragraph muted>
                    onegov bridge-uiește căutarea către sistemul ANAF original.
                    Sesiunea, token-urile CSRF și restul mecanismelor anti-bot funcționează
                    nemodificat — vezi rezultatul real, doar într-o interfață modernă.
                  </Paragraph>
                </Stack>
              </CardBody>
            </Card>
          )}
        </Stack>
      </Container>
    </AppShell>
  );
}
