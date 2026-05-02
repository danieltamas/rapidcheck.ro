/**
 * Form — READ-ONLY visual rendering in v0.1.
 *
 * Per invariant #2 (no form data is touched), this component renders fields
 * as a visual approximation only. Inputs are marked `readOnly` and `disabled`
 * is NOT used (so screen readers still announce them as form fields). There
 * is NO `onSubmit` handler. The `<form>` element exists only for semantics;
 * its `action` attribute is set to the rule-pack-supplied value but the
 * element itself is wrapped so the user cannot submit (no `<button
 * type=submit>` is rendered).
 *
 * Every value passes through JSX, so Preact escapes it. Rule-pack-derived
 * data never reaches `innerHTML`.
 */

import type { Persona } from '@onegov/core';

import type { FormFieldDescriptor } from './types.js';

interface Props {
  fields: FormFieldDescriptor[];
  persona: Persona;
  id?: string;
  action?: string;
}

function renderField(field: FormFieldDescriptor) {
  const inputId = `onegov-field-${field.name}`;
  const labelText = field.label ?? field.name;

  let control;
  if (field.type === 'textarea') {
    control = (
      <textarea
        id={inputId}
        name={field.name}
        class="onegov-field__textarea"
        readOnly
        rows={4}
        aria-readonly="true"
        placeholder={field.placeholder ?? ''}
        value={field.value ?? ''}
      />
    );
  } else if (field.type === 'select') {
    const opts = field.options ?? [];
    control = (
      <select
        id={inputId}
        name={field.name}
        class="onegov-field__select"
        aria-readonly="true"
        disabled
        value={field.value ?? ''}
      >
        {opts.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        id={inputId}
        name={field.name}
        class="onegov-field__input"
        type={field.type}
        readOnly
        aria-readonly="true"
        placeholder={field.placeholder ?? ''}
        value={field.value ?? ''}
      />
    );
  }

  return (
    <div class="onegov-field" key={field.name}>
      <label class="onegov-field__label" htmlFor={inputId}>
        {labelText}
        {field.required ? ' *' : null}
      </label>
      {control}
      {field.hint ? <span class="onegov-field__hint">{field.hint}</span> : null}
    </div>
  );
}

export function Form({ fields, persona, id, action }: Props) {
  return (
    <div data-persona={persona}>
      <p class="onegov-field__readonly-banner">
        Vizualizare. Datele se introduc în formularul original al site-ului.
      </p>
      <form
        id={id}
        class="onegov-form"
        action={action}
        method="get"
        aria-readonly="true"
        // Intentional: NO onSubmit handler — invariant #2 (no form data touched).
      >
        {fields.map((field) => renderField(field))}
      </form>
    </div>
  );
}
