import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Form } from '../Form.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';
import type { FormFieldDescriptor } from '../types.js';

beforeAll(() => {
  setupDom();
});

const sampleFields: FormFieldDescriptor[] = [
  { name: 'cui', label: 'CUI', type: 'text', placeholder: 'Ex: 14841555' },
  { name: 'note', type: 'textarea', label: 'Observații' },
  {
    name: 'an',
    type: 'select',
    label: 'An',
    options: [
      { value: '2024', label: '2024' },
      { value: '2025', label: '2025' },
    ],
  },
];

describe('Form (READ-ONLY in v0.1)', () => {
  it('renders one input/textarea/select per field', () => {
    const root = mountInto();
    render(<Form fields={sampleFields} persona="standard" />, root);
    expect(root.querySelector('input[name="cui"]')).not.toBeNull();
    expect(root.querySelector('textarea[name="note"]')).not.toBeNull();
    expect(root.querySelector('select[name="an"]')).not.toBeNull();
  });

  it('renders labels for every field', () => {
    const root = mountInto();
    render(<Form fields={sampleFields} persona="standard" />, root);
    const labels = Array.from(root.querySelectorAll('label')).map((l) => l.textContent);
    expect(labels.some((t) => t?.startsWith('CUI'))).toBe(true);
    expect(labels.some((t) => t?.startsWith('Observații'))).toBe(true);
    expect(labels.some((t) => t?.startsWith('An'))).toBe(true);
  });

  it('marks every input as readOnly (invariant #2)', () => {
    const root = mountInto();
    render(<Form fields={sampleFields} persona="standard" />, root);
    const input = root.querySelector('input[name="cui"]');
    const textarea = root.querySelector('textarea[name="note"]');
    expect(input?.hasAttribute('readonly')).toBe(true);
    expect(textarea?.hasAttribute('readonly')).toBe(true);
  });

  it('does NOT attach an onSubmit handler to the form (invariant #2)', () => {
    const root = mountInto();
    render(<Form fields={sampleFields} persona="standard" />, root);
    const form = root.querySelector('form');
    expect(form).not.toBeNull();
    // Preact forwards `onSubmit` as a property on the DOM element. Since we
    // never pass one, the property must be absent or null.
    const formAny = form as unknown as { onsubmit: unknown };
    expect(formAny.onsubmit ?? null).toBeNull();
  });

  it('renders the read-only banner', () => {
    const root = mountInto();
    render(<Form fields={sampleFields} persona="standard" />, root);
    expect(root.querySelector('.onegov-field__readonly-banner')).not.toBeNull();
  });

  it('tolerates empty fields array', () => {
    const root = mountInto();
    render(<Form fields={[]} persona="standard" />, root);
    expect(root.querySelector('form')).not.toBeNull();
    expect(root.querySelectorAll('input').length).toBe(0);
  });

  it('renders the * marker for required fields', () => {
    const root = mountInto();
    render(
      <Form
        fields={[{ name: 'x', type: 'text', label: 'X', required: true }]}
        persona="standard"
      />,
      root,
    );
    const label = root.querySelector('label');
    expect(label?.textContent).toContain('*');
  });

  it('falls back to field name when label is missing', () => {
    const root = mountInto();
    render(
      <Form fields={[{ name: 'unnamed', type: 'text' }]} persona="standard" />,
      root,
    );
    expect(root.querySelector('label')?.textContent).toContain('unnamed');
  });
});
