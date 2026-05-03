import type { SiteMap } from './schema.js';

export const ANAF_SITE_MAP: SiteMap = {
  version: '0.3.0',
  domain: 'anaf.ro',
  branding: {
    logo: {
      src: 'asset:anaf-logo',
      alt: 'Logo ANAF',
    },
    fullName: 'Agenția Națională de Administrare Fiscală',
    shortLabel: 'ANAF',
    accentColor: '#003B73',
  },
  navigation: {
    primary: [
      { label: 'Servicii online', href: '/servicii-online', icon: 'computer' },
      { label: 'Asistență contribuabili', href: '/asistenta-fiscala', icon: 'help' },
      { label: 'Info publice', href: '/info-publice', icon: 'info', density: 'simplu' },
      { label: 'Contact', href: '/contact', icon: 'building', density: 'bogat' },
    ],
    primaryCta: { label: 'Verifică un CUI', href: '/cui-lookup', icon: 'search' },
  },
  footer: [
    { label: 'Despre ANAF', href: '/despre-anaf' },
    { label: 'Contact & sedii', href: '/contact' },
    { label: 'Transparență decizională', href: '/transparenta' },
    { label: 'Deschide site-ul ANAF', href: 'https://www.anaf.ro/anaf/internet/ANAF/', icon: 'external' },
  ],
  pages: {
    '/': {
      path: '/',
      template: 'home',
      title: 'Servicii fiscale online',
      sub: 'Găsește rapid serviciul ANAF de care ai nevoie, fără să cauți prin structura vechiului portal.',
      heroActions: [
        { label: 'Verifică un CUI', href: '/cui-lookup', icon: 'search' },
        { label: 'Calendar fiscal', href: '/calendar-fiscal', icon: 'calendar' },
        { label: 'Servicii online', href: '/servicii-online', icon: 'computer', density: 'simplu' },
      ],
      sections: [
        {
          kind: 'task_grid',
          eyebrow: 'Pentru cetățeni și firme',
          title: 'Cele mai folosite servicii',
          items: [
            {
              icon: 'search',
              title: 'Verifică un CUI',
              description: 'Confirmă rapid datele fiscale publice pentru o firmă.',
              href: '/cui-lookup',
            },
            {
              icon: 'calendar',
              title: 'Calendar fiscal',
              description: 'Vezi termenele importante și obligațiile fiscale curente.',
              href: '/calendar-fiscal',
            },
            {
              icon: 'computer',
              title: 'Spațiul Privat Virtual',
              description: 'Intră în serviciile digitale ANAF pentru declarații, mesaje și documente.',
              href: '/spv',
            },
            {
              icon: 'money',
              title: 'Plăți și obligații',
              description: 'Găsește rapid informații despre plăți, taxe și obligații fiscale.',
              href: '/plati-si-obligatii',
              density: 'simplu',
            },
          ],
        },
        {
          kind: 'link_group',
          eyebrow: 'Hartă servicii',
          title: 'Navigare după nevoie',
          items: [
            {
              icon: 'help',
              title: 'Asistență fiscală',
              description: 'Ghiduri, întrebări frecvente și canale de contact pentru contribuabili.',
              href: '/asistenta-fiscala',
              density: 'simplu',
            },
            {
              icon: 'info',
              title: 'Informații publice',
              description: 'Transparență, solicitări publice și informații instituționale.',
              href: '/info-publice',
              density: 'simplu',
            },
            {
              icon: 'shield',
              title: 'Integritate',
              description: 'Cod etic, sesizări și informații despre conflicte de interese.',
              href: '/integritate',
              density: 'bogat',
            },
            {
              icon: 'document',
              title: 'Formulare și declarații',
              description: 'Acces către declarații, formulare electronice și instrucțiuni.',
              href: '/formulare',
              density: 'bogat',
            },
            {
              icon: 'building',
              title: 'Administrații județene',
              description: 'Program, adrese și date de contact pentru structurile teritoriale.',
              href: '/contact',
              density: 'bogat',
            },
          ],
        },
        {
          kind: 'faq',
          eyebrow: 'Întrebări frecvente',
          title: 'Răspunsuri rapide',
          items: [
            {
              id: 'spv',
              question: 'Cum intru în Spațiul Privat Virtual?',
              answer: 'Folosește pagina Servicii online pentru acces la SPV și autentificare pe fluxul oficial ANAF.',
            },
            {
              id: 'cui',
              question: 'Ce pot verifica folosind CUI-ul unei firme?',
              answer: 'Poți verifica informații fiscale publice și statusul disponibil prin serviciile ANAF.',
              density: 'simplu',
            },
            {
              id: 'site-original',
              question: 'Pot folosi în continuare site-ul original?',
              answer: 'Da. Dezactivează interfața ONEGOV din bara de sus, iar pagina originală rămâne sub aceeași bară de activare.',
              density: 'bogat',
            },
          ],
        },
      ],
    },
    '/cui-lookup': {
      path: '/cui-lookup',
      template: 'form',
      title: 'Verifică un CUI',
      sub: 'Introdu CUI/CIF-ul firmei pentru o verificare rapidă prin serviciile ANAF.',
      form: {
        fields: [
          {
            name: 'cui',
            label: 'CUI / CIF',
            type: 'search',
            required: true,
            pattern: '^\\d{2,10}$',
            helper: 'Exemplu: 14841555. Nu include prefixul RO.',
          },
        ],
        submitLabel: 'Caută CUI',
        handler: 'anaf.lookupCui',
      },
    },
    '/calendar-fiscal': {
      path: '/calendar-fiscal',
      template: 'list',
      title: 'Calendar fiscal',
      sub: 'Termene și obligații fiscale importante.',
      sections: [
        {
          kind: 'task_grid',
          title: 'Acțiuni utile',
          items: [
            {
              icon: 'calendar',
              title: 'Deschide calendarul ANAF',
              description: 'Pagina oficială ANAF pentru calendarul fiscal.',
              href: 'https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili/calendar_fiscal',
            },
          ],
        },
      ],
    },
    '/servicii-online': {
      path: '/servicii-online',
      template: 'external',
      title: 'Servicii online',
      sub: 'Această secțiune va fi reconstruită în ONEGOV. Până atunci, deschide pagina oficială ANAF.',
      externalUrl: 'https://www.anaf.ro/anaf/internet/ANAF/servicii_online',
    },
    '/asistenta-fiscala': {
      path: '/asistenta-fiscala',
      template: 'external',
      title: 'Asistență contribuabili',
      sub: 'Ghiduri, contact și informații oficiale pentru contribuabili.',
      externalUrl: 'https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili',
    },
    '/info-publice': {
      path: '/info-publice',
      template: 'external',
      title: 'Informații publice',
      sub: 'Transparență, solicitări publice și informații instituționale ANAF.',
      externalUrl: 'https://www.anaf.ro/anaf/internet/ANAF/info_publice',
    },
    '/external': {
      path: '/external',
      template: 'external',
      title: 'În curând în ONEGOV',
      sub: 'Pagina există pe ANAF, dar nu are încă o interfață reconstruită.',
      externalUrl: 'https://www.anaf.ro/anaf/internet/ANAF/',
    },
  },
  urlPatterns: [
    { match: '^/?$', page: '/' },
    { match: '^/anaf/internet/ANAF/?$', page: '/' },
    { match: '^/anaf/internet/ANAF/acasa.*$', page: '/' },
    { match: 'cui|tva|platitor|verificare', page: '/cui-lookup' },
    { match: 'calendar[_-]?fiscal', page: '/calendar-fiscal' },
    { match: 'servicii[_-]?online', page: '/servicii-online' },
    { match: 'asistenta|asisten', page: '/asistenta-fiscala' },
    { match: 'info[_-]?publice', page: '/info-publice' },
    { match: '.*', page: '/external' },
  ],
};
