/**
 * Content script — trust/safety layer.
 *
 * This script no longer replaces or redesigns gov pages. It preserves the live
 * DOM and adds only safety affordances: full-page lookalike warning, sensitive
 * data submit guard, and risky form-action checks.
 */

import type { DomainStatus } from '@rapidcheck/core/types';
import { assessSubmitRisk } from '@rapidcheck/core/risk';
import { detectSensitiveData } from '@rapidcheck/core/sensitive-data';

import type { GetStatusReply, GetStatusRequest } from '../messages.js';

const STYLE_ID = 'rapidcheck-trust-style';
const WARNING_ID = 'rapidcheck-trust-warning';
const DISMISSED_KEY_PREFIX = 'rapidcheck-dismissed-lookalike:';

interface Settings {
  protectionEnabled: boolean;
}

async function sendMessage(req: GetStatusRequest): Promise<GetStatusReply | null> {
  try {
    const reply = (await chrome.runtime.sendMessage(req)) as GetStatusReply | undefined;
    return reply ?? null;
  } catch {
    return null;
  }
}

async function statusForUrl(url: string): Promise<DomainStatus> {
  const reply = await sendMessage({ type: 'get-status', url });
  return reply?.status ?? { kind: 'unknown' };
}

async function readSettings(): Promise<Settings> {
  try {
    const stored = await chrome.storage.local.get(['protectionEnabled']);
    return { protectionEnabled: stored['protectionEnabled'] !== false };
  } catch {
    return { protectionEnabled: true };
  }
}

function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #rapidcheck-trust-warning {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: grid;
      place-items: center;
      padding: 24px;
      background: rgba(10, 14, 31, 0.74);
      color: #111720;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    }
    .rapidcheck-trust-card {
      max-width: 620px;
      border: 1px solid #f4b8b8;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
      overflow: hidden;
    }
    .rapidcheck-trust-card__header {
      padding: 18px 22px;
      background: linear-gradient(135deg, #c62828 0%, #6700a0 100%);
      color: #fff;
      font-weight: 800;
      font-size: 18px;
    }
    .rapidcheck-trust-card__body {
      padding: 22px;
      line-height: 1.55;
    }
    .rapidcheck-trust-card__body p { margin: 0 0 12px; }
    .rapidcheck-trust-card__actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      padding: 0 22px 22px;
    }
    .rapidcheck-trust-btn {
      border: 1px solid #c7cfdb;
      border-radius: 999px;
      padding: 10px 14px;
      background: #fff;
      color: #2243df;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
    }
    .rapidcheck-trust-btn--primary {
      border-color: #2243df;
      background: linear-gradient(135deg, #6700a0 0%, #2243df 46%, #0077ff 100%);
      color: #fff;
    }
  `;
  (document.head ?? document.documentElement).appendChild(style);
}

function showLookalikeWarning(status: Extract<DomainStatus, { kind: 'lookalike' }>): void {
  const dismissedKey = `${DISMISSED_KEY_PREFIX}${location.hostname}`;
  if (sessionStorage.getItem(dismissedKey) === '1') return;
  if (document.getElementById(WARNING_ID)) return;
  injectStyle();

  const official = `https://${status.nearest.domain}/`;
  const overlay = document.createElement('div');
  overlay.id = WARNING_ID;
  overlay.setAttribute('role', 'alertdialog');
  overlay.setAttribute('aria-modal', 'true');

  const card = document.createElement('section');
  card.className = 'rapidcheck-trust-card';
  const header = document.createElement('div');
  header.className = 'rapidcheck-trust-card__header';
  header.textContent = 'Atenție: domeniu posibil fals';
  const body = document.createElement('div');
  body.className = 'rapidcheck-trust-card__body';
  const p1 = document.createElement('p');
  p1.textContent = `${location.hostname} seamănă cu domeniul oficial ${status.nearest.domain}, dar nu este același.`;
  const p2 = document.createElement('p');
  p2.textContent = 'Nu introduce CNP, CUI, date bancare sau parole până nu verifici domeniul.';
  body.append(p1, p2);

  const actions = document.createElement('div');
  actions.className = 'rapidcheck-trust-card__actions';
  const officialLink = document.createElement('a');
  officialLink.className = 'rapidcheck-trust-btn rapidcheck-trust-btn--primary';
  officialLink.href = official;
  officialLink.textContent = `Deschide ${status.nearest.domain}`;
  const continueButton = document.createElement('button');
  continueButton.className = 'rapidcheck-trust-btn';
  continueButton.type = 'button';
  continueButton.textContent = 'Continuă pe riscul meu';
  continueButton.addEventListener('click', () => {
    sessionStorage.setItem(dismissedKey, '1');
    overlay.remove();
  });
  actions.append(officialLink, continueButton);
  card.append(header, body, actions);
  overlay.append(card);
  document.documentElement.appendChild(overlay);
  continueButton.focus();
}

function valuesForSubmit(form: HTMLFormElement): string[] {
  const controls = Array.from(form.elements).filter(
    (el): el is HTMLInputElement | HTMLTextAreaElement =>
      el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement,
  );
  return controls
    .filter((el) => !(el instanceof HTMLInputElement && el.type === 'password'))
    .map((el) => el.value)
    .filter((v) => v.trim().length > 0);
}

function installSubmitGuard(pageStatus: DomainStatus): void {
  document.addEventListener(
    'submit',
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const actionUrl = new URL(form.getAttribute('action') || location.href, location.href);
      const sensitiveMatches = detectSensitiveData(valuesForSubmit(form));
      if (
        pageStatus.kind !== 'lookalike' &&
        sensitiveMatches.length === 0 &&
        actionUrl.origin === location.origin
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      void (async () => {
        const actionStatus = await statusForUrl(actionUrl.href);
        const risk = assessSubmitRisk({
          pageStatus,
          actionStatus,
          sensitiveMatches,
          isHttps: location.protocol === 'https:',
          sameOrigin: actionUrl.origin === location.origin,
        });
        if (risk.level === 'safe') {
          HTMLFormElement.prototype.submit.call(form);
          return;
        }
        const message = [
          risk.level === 'block'
            ? 'RapidCheck a blocat trimiterea formularului.'
            : 'RapidCheck a detectat un risc înainte de trimitere.',
          ...risk.reasons,
          risk.level === 'caution' ? 'Continui?' : '',
        ]
          .filter(Boolean)
          .join('\n');
        if (risk.level === 'block' || !window.confirm(message)) {
          return;
        }
        HTMLFormElement.prototype.submit.call(form);
      })();
    },
    true,
  );
}

async function main(): Promise<void> {
  const settings = await readSettings();
  if (!settings.protectionEnabled) return;
  let url: URL;
  try {
    url = new URL(location.href);
  } catch {
    return;
  }
  const status = await statusForUrl(url.href);
  if (status.kind === 'lookalike') showLookalikeWarning(status);
  installSubmitGuard(status);
}

void main();

export {};
