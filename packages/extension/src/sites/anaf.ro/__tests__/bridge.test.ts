/**
 * Bridge tests — form-bridging contract.
 *
 * Three cases:
 *   - Valid CUI + matching original form → original input written, submit
 *     dispatched, result.submitted = true.
 *   - Valid CUI + no matching form → navigation fallback fires.
 *   - Invalid CUI → result indicates failure, no DOM mutation.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';

import { setupDom } from '../../../../../ui/tests/setup-dom.js';
import { submitForm, normaliseCui, buildCuiHumanUrl, buildCuiSearchUrl } from '../bridge.js';

beforeAll(() => {
  setupDom();
});

let assignSpy: ReturnType<typeof mock>;
let originalAssign: typeof location.assign;

beforeEach(() => {
  document.body.innerHTML = '';
  // Stub location.assign so the test never actually navigates the test
  // window. happy-dom may throw cross-origin SecurityErrors otherwise.
  originalAssign = location.assign.bind(location);
  assignSpy = mock(() => {});
  Object.defineProperty(location, 'assign', {
    configurable: true,
    writable: true,
    value: assignSpy,
  });
});

afterEach(() => {
  Object.defineProperty(location, 'assign', {
    configurable: true,
    writable: true,
    value: originalAssign,
  });
  document.body.innerHTML = '';
});

describe('normaliseCui', () => {
  it('strips RO prefix + whitespace', () => {
    expect(normaliseCui('RO 14 841 555')).toBe('14841555');
    expect(normaliseCui('ro12345')).toBe('12345');
    expect(normaliseCui('14841555')).toBe('14841555');
  });

  it('rejects non-numeric or out-of-range', () => {
    expect(normaliseCui('')).toBeNull();
    expect(normaliseCui('abc')).toBeNull();
    expect(normaliseCui('1')).toBeNull();
    expect(normaliseCui('12345678901')).toBeNull();
  });
});

describe('buildCuiSearchUrl / buildCuiHumanUrl', () => {
  it('encodes the CUI into the URLs', () => {
    expect(buildCuiSearchUrl('14841555')).toBe(
      'https://webservicesp.anaf.ro/PlatitorTvaRest/api/v9/ws/tva?cui=14841555',
    );
    expect(buildCuiHumanUrl('14841555')).toBe(
      'https://www.anaf.ro/anaf/internet/ANAF/?cui=14841555',
    );
  });
});

describe('submitForm — cui-search', () => {
  it('writes the input + dispatches submit when an original form is present', () => {
    document.body.innerHTML = `
      <form id="anaf-cui-form" action="/lookup" method="post">
        <input type="text" name="cui" value="" />
        <button type="submit">Caută</button>
      </form>
    `;
    const input = document.querySelector('input[name="cui"]') as HTMLInputElement;
    const submitSpy = mock();
    const requestSubmitSpy = mock();
    const form = document.getElementById('anaf-cui-form') as HTMLFormElement;
    // The bridge prefers `requestSubmit` (it triggers HTML5 form validation)
    // and falls back to `submit`. We stub both so we can assert which path
    // fired and avoid happy-dom's relative-URL navigation.
    form.submit = submitSpy as unknown as typeof form.submit;
    (form as { requestSubmit?: () => void }).requestSubmit =
      requestSubmitSpy as unknown as () => void;

    const result = submitForm({ kind: 'cui-search', cui: '14841555' });
    expect(result).toEqual({ submitted: true, navigated: false });
    expect(input.value).toBe('14841555');
    expect(requestSubmitSpy).toHaveBeenCalledTimes(1);
    expect(submitSpy).not.toHaveBeenCalled();
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it('falls back to navigation when no form exists', () => {
    document.body.innerHTML = '<div>no forms here</div>';
    const result = submitForm({ kind: 'cui-search', cui: '14841555' });
    expect(result).toEqual({ submitted: false, navigated: true });
    expect(assignSpy).toHaveBeenCalledTimes(1);
    const arg = assignSpy.mock.calls[0]?.[0];
    expect(typeof arg).toBe('string');
  });

  it('falls back to navigation when input lacks the cui name/id', () => {
    document.body.innerHTML = `
      <form><input type="text" name="other" /></form>
    `;
    const result = submitForm({ kind: 'cui-search', cui: '14841555' });
    expect(result.navigated).toBe(true);
  });

  it('rejects an invalid CUI without DOM mutation', () => {
    document.body.innerHTML = `
      <form><input type="text" name="cui" value="x" /></form>
    `;
    const before = document.body.outerHTML;
    const result = submitForm({ kind: 'cui-search', cui: 'not-a-cui' });
    expect(result.submitted).toBe(false);
    expect(result.navigated).toBe(false);
    expect(result.reason).toBe('CUI invalid');
    expect(document.body.outerHTML).toBe(before);
  });

  it('strips RO prefix before lookup', () => {
    document.body.innerHTML = `
      <form id="f"><input type="text" name="cui" value="" /></form>
    `;
    const form = document.getElementById('f') as HTMLFormElement;
    form.submit = mock() as unknown as typeof form.submit;
    submitForm({ kind: 'cui-search', cui: 'RO 14841555' });
    const input = document.querySelector('input[name="cui"]') as HTMLInputElement;
    expect(input.value).toBe('14841555');
  });
});
