/**
 * anaf.ro form-bridging helpers.
 *
 * v0.2 unlocks ONE narrow exception to the v0.1 "no form data touched" rule:
 * when the user explicitly submits a form THROUGH OUR UI, we may write the
 * captured values into the original page's form inputs and dispatch a
 * `submit` event so the original site's CSRF token, session cookies, and
 * anti-bot fingerprint all flow normally.
 *
 * Constraints (per task spec §H.1):
 *   - WRITE on intent only (user clicked our submit). Never read .value
 *     passively. Never iterate inputs. Never log form contents.
 *   - The bridge OWNS the original form's value writes — it never replaces
 *     or removes the form element. After dispatch, the original handler runs
 *     normally; navigation (or whatever the form does) happens through the
 *     site's own code.
 *   - If the original form can't be located, fall back to a navigation:
 *     build a search URL with the values appended as query params and call
 *     `location.assign`. This is the documented degraded path; it works
 *     even when the original page hasn't loaded its forms yet.
 *
 * v0.2.0 ships ONE bridge: CUI search. Other forms (declarations, payments,
 * login) come per-form in subsequent tasks.
 *
 * Extension contract (`submitForm`):
 *   submitForm({ kind: 'cui-search', cui: '12345' })
 *     1. Try to locate the original CUI search form via known selectors.
 *     2. Write `cui` into the form's input by name/id.
 *     3. Dispatch a `submit` event.
 *     4. If the form isn't there → location.assign to anaf's CUI lookup
 *        URL with the cui as a query param.
 */

/** All known form bridges. Discriminated by `kind`. */
export type BridgeRequest = { kind: 'cui-search'; cui: string };

/**
 * Result of a bridge submission. `submitted` is true when the original form
 * was located and the submit event dispatched; `navigated` is true when the
 * fallback navigation path fired. Returns `{ submitted: false, navigated:
 * false }` when both paths failed (e.g. invalid CUI).
 */
export interface BridgeResult {
  submitted: boolean;
  navigated: boolean;
  reason?: string;
}

/**
 * Public entry point. The App calls this when the user explicitly submits
 * a form in our UI. Returns a typed result so the App can display feedback
 * (toast or inline) when the navigation didn't fire.
 */
export function submitForm(req: BridgeRequest): BridgeResult {
  switch (req.kind) {
    case 'cui-search':
      return submitCuiSearch(req.cui);
  }
}

/**
 * The CUI-search bridge. v0.2.0 priority is correctness: when in doubt, we
 * navigate to the well-known anaf URL because the `webservicesp.anaf.ro`
 * REST endpoint is the actual source of truth and the legacy JSP form has
 * been moved/renamed multiple times.
 */
function submitCuiSearch(rawCui: string): BridgeResult {
  const cui = normaliseCui(rawCui);
  if (!cui) {
    return { submitted: false, navigated: false, reason: 'CUI invalid' };
  }

  // Attempt to find an original form first. Selectors are intentionally
  // forgiving — anaf reuses common naming across pages.
  const form = locateCuiForm();
  if (form) {
    const input = locateCuiInput(form);
    if (input) {
      input.value = cui;
      // Some anaf pages bind on `change` to validate; dispatch both so any
      // listeners fire as if the user typed.
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      // Use `requestSubmit` when available (it triggers HTMLFormElement
      // validation), falling back to `submit()` which skips validation but
      // works in older browsers.
      try {
        if (typeof (form as HTMLFormElement).requestSubmit === 'function') {
          (form as HTMLFormElement).requestSubmit();
        } else {
          (form as HTMLFormElement).submit();
        }
        return { submitted: true, navigated: false };
      } catch {
        // Fall through to navigation fallback.
      }
    }
  }

  // Navigation fallback. We use a known-good ANAF deep link that always
  // routes to the public CUI lookup page.
  try {
    const target = buildCuiSearchUrl(cui);
    location.assign(target);
    return { submitted: false, navigated: true };
  } catch {
    return { submitted: false, navigated: false, reason: 'navigation failed' };
  }
}

/**
 * Build the canonical anaf CUI lookup URL. Kept as a single source of truth
 * so both the navigation fallback and the App's "open in original site"
 * affordance use the same URL.
 *
 * The ANAF "Identificare contribuabil" search lives at this path.
 * (See SITES_COVERAGE.md §3.1 — anaf.ro / SPV cluster.)
 */
export function buildCuiSearchUrl(cui: string): string {
  const safe = encodeURIComponent(cui);
  return `https://webservicesp.anaf.ro/PlatitorTvaRest/api/v9/ws/tva?cui=${safe}`;
}

/**
 * A simpler, user-facing landing for the CUI lookup so the navigation
 * keeps the user on the human-readable anaf domain when the API URL would
 * be inappropriate.
 */
export function buildCuiHumanUrl(cui: string): string {
  const safe = encodeURIComponent(cui);
  // Use the demoanaf-style human URL pattern; the takeover module re-skins
  // it on the next page load.
  return `https://www.anaf.ro/anaf/internet/ANAF/?cui=${safe}`;
}

/** Strip whitespace, leading 'RO', and reject anything that isn't a 2-10 digit CUI. */
export function normaliseCui(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(/\s+/g, '').replace(/^RO/i, '');
  if (!/^\d{2,10}$/.test(cleaned)) return null;
  return cleaned;
}

/**
 * Locate the original page's CUI search form. Selectors are deliberately
 * over-broad and we filter by attributes; the goal is to find SOMETHING
 * usable across the many anaf page variants without enumerating every
 * historic form id. Returns `null` when nothing matches.
 */
function locateCuiForm(): HTMLFormElement | null {
  try {
    const candidates = document.querySelectorAll<HTMLFormElement>('form');
    for (const form of candidates) {
      // Heuristic: any form that has an input named cui/CUI is the one.
      const input = locateCuiInput(form);
      if (input) return form;
    }
  } catch {
    return null;
  }
  return null;
}

/** Locate an input named (or id'd) cui/CUI inside a form. */
function locateCuiInput(form: HTMLFormElement): HTMLInputElement | null {
  try {
    const byName = form.querySelector<HTMLInputElement>(
      'input[name="cui"], input[name="CUI"], input[id="cui"], input[id="CUI"]',
    );
    if (byName) return byName;
  } catch {
    return null;
  }
  return null;
}
