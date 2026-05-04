/**
 * Background service worker — Path C.
 *
 * Per-tab badge state machine (✓ green for verified, ! red for lookalike,
 * blank for unknown). The actual takeover is done by the content script;
 * the SW paints the toolbar so the user knows RapidCheck is active.
 *
 * No CSS injection. No augmentation messages. Master toggle is storage-driven —
 * popup writes `extensionEnabled`; the content script subscribes and reloads.
 */

import type { VerifiedDomainList } from '@rapidcheck/core';
import { loadDirectory, type VerifiedDirectory } from '@rapidcheck/directory';

import { decideTabState, badgeStyle, type TabState } from './decide-icon.js';
import { registerMessageHandlers, type MessageContext } from './messaging.js';
import { BUNDLED_MERKLE_ROOT, loadRemoteDirectory } from './remote-directory.js';
import verifiedList from '../../../../rule-packs/_verified-domains.json';

const BUNDLED_DIRECTORY = loadDirectory();
let activeDirectory = BUNDLED_DIRECTORY;
let activeRoster = buildRoster(verifiedList as unknown as VerifiedDomainList, activeDirectory);
let activeIntegrity: MessageContext['integrity'] = {
  source: 'bundled',
  bundledMerkleRoot: BUNDLED_MERKLE_ROOT,
  activeMerkleRoot: BUNDLED_MERKLE_ROOT,
  updatedAt: BUNDLED_DIRECTORY.updatedAt,
};
let lastRemoteRefreshAttempt = 0;
const REMOTE_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

function buildRoster(base: VerifiedDomainList, directory: VerifiedDirectory): VerifiedDomainList {
  const seen = new Set<string>();
  const domains: VerifiedDomainList['domains'] = [];
  for (const domain of base.domains) {
    if (seen.has(domain.domain)) continue;
    seen.add(domain.domain);
    domains.push(domain);
  }
  for (const entity of directory.entities) {
    for (const domain of entity.domains) {
      if (seen.has(domain)) continue;
      seen.add(domain);
      domains.push({
        domain,
        category:
          entity.category === 'bank' || entity.category === 'mobile-operator' || entity.category === 'utility'
            ? 'public-interest'
            : 'gov',
        addedAt: entity.lastVerifiedAt,
        source: entity.sourceUrls[0]!,
      });
    }
  }
  return { version: base.version, updatedAt: base.updatedAt, domains };
}

function applyIconForUrl(tabId: number, url: string | undefined): void {
  if (!url) return;
  const state: TabState = decideTabState(url, activeRoster);
  const badge = badgeStyle(state);
  void chrome.action.setBadgeText({ tabId, text: badge.text }).catch(() => {});
  if (badge.text !== '') {
    void chrome.action
      .setBadgeBackgroundColor({ tabId, color: badge.backgroundColor })
      .catch(() => {});
  }
}

chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId !== 0) return;
  applyIconForUrl(details.tabId, details.url);
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs
    .get(tabId)
    .then((tab) => applyIconForUrl(tabId, tab.url))
    .catch(() => {});
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs
    .query({})
    .then((tabs) => {
      for (const tab of tabs) {
        if (typeof tab.id === 'number') applyIconForUrl(tab.id, tab.url);
      }
    })
    .catch(() => {});
});

async function refreshRemoteDirectoryIfNeeded(): Promise<void> {
  const now = Date.now();
  if (now - lastRemoteRefreshAttempt < REMOTE_REFRESH_INTERVAL_MS) return;
  lastRemoteRefreshAttempt = now;
  const update = await loadRemoteDirectory();
  if (!update) return;
  activeDirectory = update.directory;
  activeRoster = buildRoster(verifiedList as unknown as VerifiedDomainList, activeDirectory);
  activeIntegrity = {
    source: update.source,
    bundledMerkleRoot: BUNDLED_MERKLE_ROOT,
    activeMerkleRoot: update.merkleRoot,
    remoteMerkleRoot: update.remoteMerkleRoot,
    updatedAt: update.updatedAt,
  };
}

registerMessageHandlers(async () => {
  await refreshRemoteDirectoryIfNeeded();
  return { roster: activeRoster, directory: activeDirectory, integrity: activeIntegrity };
});

export {};
