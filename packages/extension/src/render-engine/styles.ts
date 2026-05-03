export const RENDER_ENGINE_CSS = `
#onegov-bar-root,
#onegov-app {
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--gov-text-black, #1a1a1a);
}

#onegov-bar-root {
  position: sticky;
  top: 0;
  z-index: 2147483647;
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  background: #ffffff;
  color: #1a1a1a;
  border-bottom: 1px solid #cccccc;
  box-sizing: border-box;
}

.onegov-runtime-bar {
  min-height: 44px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 6px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-sizing: border-box;
}

.onegov-runtime-bar__copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.onegov-runtime-bar__title {
  color: #004990;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
}

.onegov-runtime-bar__meta {
  color: #666666;
  font-size: 12px;
  line-height: 1.25;
}

.onegov-runtime-bar__action {
  border: 1px solid #004990;
  border-radius: 50px;
  background: #ffffff;
  color: #004990;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.onegov-runtime-bar__action:hover {
  background: #f0f4f8;
}

.onegov-runtime-bar[data-active="false"] .onegov-runtime-bar__action {
  background: #f2c200;
  border-color: #f2c200;
  color: #004990;
}

#onegov-app {
  --gov-primary-blue: #004990;
  --gov-secondary-blue: #0079c1;
  --gov-accent-yellow: #f2c200;
  --gov-text-black: #1a1a1a;
  --gov-text-muted: #666666;
  --gov-border-light: #cccccc;
  --gov-bg-white: #ffffff;
  --gov-bg-light: #f8f8f8;
  --gov-bg-very-light: #f0f4f8;
  --gov-radius-lg: 12px;
  min-height: 100vh;
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  background: var(--gov-bg-very-light);
  box-sizing: border-box;
}

.onegov-fh-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--gov-bg-very-light);
  line-height: 1.6;
}

.onegov-fh-page main {
  flex: 1;
}

.fh-common-header {
  background: var(--gov-primary-blue, #004990);
  color: white;
  position: sticky;
  top: 44px;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  box-sizing: border-box;
  width: 100vw;
  max-width: 100vw;
}

.fh-header-container {
  width: 100%;
  max-width: none;
  margin: 0;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 0 30px;
  box-sizing: border-box;
}

.fh-branding {
  display: flex;
  align-items: center;
  gap: 15px;
  text-decoration: none;
  color: white;
  flex-shrink: 0;
  min-width: 0;
}

.fh-branding-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.fh-branding h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  white-space: nowrap;
  color: white;
  letter-spacing: -0.01em;
  line-height: 1.1;
}

.fh-branding-text span {
  max-width: 320px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  line-height: 1.2;
}

.fh-logo {
  height: 48px;
  width: auto;
  max-width: 86px;
  object-fit: contain;
  background: #ffffff;
  border-radius: 4px;
}

.header-nav {
  display: flex;
  gap: 40px;
  align-items: center;
  flex: 1;
  justify-content: center;
  margin: 0 30px;
}

.header-nav a {
  font-size: 16px;
  color: white;
  opacity: 0.85;
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 500;
  white-space: nowrap;
  border-radius: 999px;
  padding: 8px 14px;
}

.header-nav a:hover {
  opacity: 1;
  color: var(--gov-accent-yellow, #f2c200);
  background: rgba(255, 255, 255, 0.1);
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-shrink: 0;
}

.fh-btn {
  padding: 12px 24px;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  cursor: pointer;
}

.fh-btn-accent {
  background: var(--gov-accent-yellow, #f2c200);
  color: var(--gov-primary-blue, #004990);
}

.fh-btn-accent:hover {
  background: #f5e000;
  transform: translateY(-1px);
}

.fh-btn-icon {
  font-size: 12px;
  font-weight: 800;
}

.hero {
  background: var(--gov-bg-white);
  padding: 60px 30px;
  text-align: center;
}

.hero h1 {
  font-size: 36px;
  font-weight: 600;
  color: #111827;
  margin: 0 auto 24px;
  line-height: 1.25;
  max-width: 720px;
  letter-spacing: -0.025em;
}

.hero .subtitle {
  font-size: 18px;
  color: #4b5563;
  line-height: 1.6;
  max-width: 700px;
  margin: 0 auto 40px;
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 14px 28px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 2px solid transparent;
  box-sizing: border-box;
}

.btn-primary {
  background: var(--gov-primary-blue);
  color: white;
  border-color: var(--gov-primary-blue);
}

.btn-primary:hover {
  background: var(--gov-secondary-blue);
  border-color: var(--gov-secondary-blue);
}

.btn-secondary {
  background: transparent;
  color: var(--gov-primary-blue);
  border-color: var(--gov-primary-blue);
}

.btn-secondary:hover {
  background: var(--gov-bg-light);
}

.onegov-fh-page .container {
  max-width: 1200px;
  margin: 0 auto;
}

.info-card-wrapper {
  padding: 40px 30px;
}

.info-card-wrapper--muted {
  background: #f9fafb;
}

.fh-section-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 48px;
  text-align: center;
  letter-spacing: -0.025em;
}

.info-card {
  background: var(--gov-bg-white);
  border: 1px solid var(--gov-border-light);
  border-radius: 2px;
  padding: 30px;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.info-card-top {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.info-card-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: var(--gov-primary-blue);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.info-card-content h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px;
  letter-spacing: -0.02em;
}

.info-card-content p {
  font-size: 16px;
  color: var(--gov-text-muted);
  line-height: 1.7;
  margin: 0;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.step-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: var(--gov-radius-lg, 12px);
  padding: 30px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  height: 100%;
  box-sizing: border-box;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.step-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.step-icon-container {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  background: #f3f4f6;
  color: var(--gov-primary-blue);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 800;
}

.step-card:hover .step-icon-container {
  background: var(--gov-primary-blue);
  color: white;
}

.step-body h3 {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.step-body p {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
  font-size: 15px;
}

.fh-link-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.fh-link-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: inherit;
  text-decoration: none;
  transition: all 0.2s ease;
}

.fh-link-card:hover {
  background: #f9fafb;
  border-color: var(--gov-primary-blue);
}

.fh-link-card strong {
  color: #111827;
  font-size: 16px;
}

.fh-link-card span {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.55;
}

.faq-container {
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.faq-container .onegov-accordion {
  border: 0;
  border-radius: 0;
}

.faq-container .onegov-accordion-item {
  background: white;
}

.faq-container .onegov-accordion-item + .onegov-accordion-item {
  border-top: 1px solid #e5e7eb;
}

.faq-container .onegov-accordion-item__trigger {
  padding: 24px 30px;
  background: white;
  color: #111827;
  font-size: 17px;
}

.faq-container .onegov-accordion-item__trigger:hover,
.faq-container .onegov-accordion-item__trigger--open {
  background: #f9fafb;
}

.faq-container .onegov-accordion-item__chevron {
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  color: var(--gov-primary-blue);
  background: #f3f4f6;
  border-radius: 50%;
  padding: 4px;
}

.faq-container .onegov-accordion-item--open .onegov-accordion-item__chevron {
  background: var(--gov-primary-blue);
  color: white;
}

.faq-container .onegov-accordion-item__panel-inner {
  padding: 0 30px;
  color: #4b5563;
  line-height: 1.7;
  font-size: 15px;
}

.faq-container .onegov-accordion-item__panel--open .onegov-accordion-item__panel-inner {
  padding: 0 30px 24px;
}

.fh-form-card {
  max-width: 720px;
}

.fh-form-logo {
  width: 72px;
  height: 56px;
  object-fit: contain;
  flex: 0 0 auto;
}

.fh-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fh-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #111827;
  font-weight: 600;
}

.fh-form input {
  border: 1px solid #cccccc;
  border-radius: 50px;
  padding: 14px 18px;
  font: inherit;
}

.fh-form input:focus {
  outline: 2px solid var(--gov-accent-yellow);
  outline-offset: 2px;
  border-color: var(--gov-primary-blue);
}

.fh-form small {
  color: var(--gov-text-muted);
}

.fh-result {
  padding: 16px;
  border-left: 4px solid var(--gov-primary-blue);
  background: #f0f4f8;
}

.fh-result p {
  margin: 4px 0 0;
}

.fh-result--error {
  border-left-color: #c8102e;
  background: #fde8ec;
}

.fara-hartie-footer {
  background: var(--gov-primary-blue);
  color: white;
  padding: 20px 30px;
  text-align: left;
  font-size: 14px;
  margin-top: auto;
  border-top: 3px solid var(--gov-accent-yellow);
  width: 100vw;
  max-width: 100vw;
  box-sizing: border-box;
  flex-shrink: 0;
}

.fara-hartie-footer-content {
  max-width: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0;
}

.fh-footer-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) repeat(2, minmax(180px, 1fr));
  gap: 32px;
  width: 100%;
}

.fh-footer-brand {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.fh-footer-brand img {
  width: 72px;
  height: 56px;
  object-fit: contain;
  background: #ffffff;
  border-radius: 4px;
  flex: 0 0 auto;
}

.fh-footer-brand span {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fh-footer-brand strong {
  color: white;
  font-size: 16px;
  line-height: 1.3;
}

.fh-footer-brand small {
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.fh-footer-column h2 {
  margin: 0 0 12px;
  color: white;
  font-size: 15px;
  font-weight: 700;
}

.fh-footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  padding-top: 16px;
}

.fara-hartie-footer p {
  margin: 0;
  font-weight: 500;
  color: white;
  opacity: 0.95;
  white-space: normal;
  flex: 0 1 auto;
}

.fara-hartie-footer-links {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-direction: column;
}

.fara-hartie-footer .footer-link {
  color: white;
  text-decoration: none;
  opacity: 0.9;
  transition: opacity 0.2s ease;
  font-weight: 500;
  white-space: nowrap;
}

.fara-hartie-footer .footer-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.fara-hartie-footer .footer-separator {
  color: white;
  opacity: 0.6;
}

@media (max-width: 1024px) {
  .header-nav {
    gap: 15px;
  }
}

@media (max-width: 850px) {
  .fh-header-container {
    height: auto;
    min-height: 80px;
    flex-wrap: wrap;
    padding-top: 14px;
    padding-bottom: 14px;
  }

  .header-nav {
    order: 3;
    width: 100%;
    margin: 0;
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .header-actions {
    margin-left: auto;
  }

  .steps-grid,
  .fh-link-grid,
  .fh-footer-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .onegov-runtime-bar {
    align-items: flex-start;
    flex-direction: column;
    padding: 8px 20px;
  }

  .fh-common-header {
    top: 76px;
  }

  .hero {
    padding: 40px 20px;
  }

  .hero h1 {
    font-size: 32px;
  }

  .hero .subtitle {
    font-size: 16px;
  }

  .info-card-wrapper {
    padding: 30px 20px;
  }

  .info-card {
    padding: 25px;
  }

  .info-card-top {
    flex-direction: column;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 600px) {
  .fh-header-container {
    padding: 14px 15px;
  }

  .fh-logo {
    height: 44px;
    max-width: 76px;
  }

  .fh-branding-text span {
    display: none;
  }

  .fh-btn {
    padding: 0;
    width: 44px;
    height: 44px;
    border-radius: 50%;
  }

  .fh-btn span:not(.fh-btn-icon) {
    display: none;
  }
}
`;
