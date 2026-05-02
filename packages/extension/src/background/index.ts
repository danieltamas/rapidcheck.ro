/**
 * Background service worker.
 *
 * STATUS: Stub. Track 4 wires the icon state machine:
 *   - chrome.webNavigation.onCommitted → verifyDomain(hostname, list) → setIcon
 *   - chrome.runtime.onMessage routing between popup ↔ content script
 *
 * The stub prints a one-line install marker so loading-it-clean is observable
 * in the service-worker console, and otherwise idles. No polling, no alarms.
 *
 * No fetch, no remote code, no `eval` — invariants 3 and 4 hold trivially
 * because the worker does nothing in v0.1's first day.
 */

chrome.runtime.onInstalled.addListener(() => {
  // eslint-disable-next-line no-console
  console.info('[onegov] background installed (v0.1 scaffold — Track 4 not yet wired)');
});

export {};
