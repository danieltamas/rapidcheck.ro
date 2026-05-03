/**
 * anaf.ro module-scoped styles.
 *
 * Composed on top of the @onegov/ui theme tokens — never overrides the
 * design system. Lives as a literal CSS string so it ships in the content
 * bundle without a build-time CSS pipeline.
 *
 * Convention: every selector is prefixed `.anaf-` to avoid colliding with
 * design-system classes (`onegov-*`).
 */

export const ANAF_CSS = `
.anaf-shell {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  font-family: var(--onegov-font-base);
  color: var(--onegov-color-text);
  background: var(--onegov-color-bg);
}

/* StatusBar — slim, white, subtle bottom border */
.anaf-shell[data-mode="minimal"] { pointer-events: none; }
.anaf-shell[data-mode="minimal"] .anaf-statusbar { pointer-events: auto; }
.anaf-statusbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 1px solid var(--onegov-color-neutral-200);
  height: 48px;
  display: flex;
  align-items: center;
}
.anaf-statusbar__inner {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--onegov-sp-5);
}
.anaf-statusbar__row {
  width: 100%;
}
.anaf-statusbar__brand {
  align-items: center;
  gap: var(--onegov-sp-2);
}
.anaf-statusbar__logo {
  display: inline-flex;
  align-items: center;
}
.anaf-statusbar__sep {
  color: var(--onegov-color-subtle);
  font-size: var(--onegov-fs-md);
}

/* Density chip */
.anaf-density-chip {
  display: inline-flex;
  border: 1px solid var(--onegov-color-border);
  border-radius: var(--onegov-radius-full);
  padding: 2px;
  background: var(--onegov-color-surface);
}
.anaf-density-chip__option {
  appearance: none;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--onegov-fs-xs);
  font-weight: var(--onegov-fw-medium);
  color: var(--onegov-color-muted);
  padding: 4px 12px;
  border-radius: var(--onegov-radius-full);
  cursor: pointer;
  transition: background var(--onegov-duration-fast) var(--onegov-ease-standard),
              color var(--onegov-duration-fast) var(--onegov-ease-standard);
}
.anaf-density-chip__option:hover {
  color: var(--onegov-color-text);
}
.anaf-density-chip__option--selected {
  background: var(--onegov-color-primary);
  color: var(--onegov-color-primary-contrast);
}
@media (prefers-reduced-motion: reduce) {
  .anaf-density-chip__option {
    transition: none;
  }
}

/* Home page */
.anaf-home {
  padding: var(--onegov-sp-12) var(--onegov-sp-5);
}
.anaf-cui {
  padding: var(--onegov-sp-10) var(--onegov-sp-5);
}
.anaf-hero-search {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--onegov-sp-2);
}
.anaf-hero-search > .onegov-searchbox-host {
  width: 100%;
}
.anaf-hero-search input[type="search"] {
  font-size: var(--onegov-fs-lg);
}
.anaf-cui__search {
  max-width: 640px;
}

/* Service cards — subtle accent ring on the primary card */
.anaf-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.anaf-card.anaf-card--primary {
  border-color: var(--onegov-color-primary-soft);
  box-shadow: 0 0 0 1px var(--onegov-color-primary-soft) inset;
}

/* Plain link list inside footer columns */
.anaf-link-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--onegov-sp-2);
}
.anaf-link-list a {
  color: var(--onegov-color-text);
  text-decoration: none;
  font-size: var(--onegov-fs-sm);
}
.anaf-link-list a:hover {
  color: var(--onegov-color-primary);
  text-decoration: underline;
}

/* Inline link-style button (e.g. footer "ascunde →") */
.anaf-link-button {
  appearance: none;
  border: 0;
  background: transparent;
  font: inherit;
  color: var(--onegov-color-primary);
  cursor: pointer;
  padding: 0;
}
.anaf-link-button:hover {
  text-decoration: underline;
}

/* Mobile tweaks */
@media (max-width: 640px) {
  .anaf-shell[data-mode="minimal"] { pointer-events: none; }
.anaf-shell[data-mode="minimal"] .anaf-statusbar { pointer-events: auto; }
.anaf-statusbar {
    height: auto;
    padding: var(--onegov-sp-2) 0;
  }
  .anaf-statusbar__row {
    flex-direction: column;
    align-items: stretch;
    gap: var(--onegov-sp-2);
  }
  .anaf-home, .anaf-cui {
    padding: var(--onegov-sp-6) var(--onegov-sp-3);
  }
  .anaf-density-chip__option {
    padding: 6px 10px;
  }
}
`;
