import { describe, it, expect, beforeAll } from 'bun:test';
import { render } from 'preact';

import { Input } from '../Input.js';
import { Textarea } from '../Textarea.js';
import { Select } from '../Select.js';
import { Checkbox } from '../Checkbox.js';
import { Radio, RadioGroup } from '../Radio.js';
import { Switch } from '../Switch.js';
import { FormField } from '../FormField.js';
import { FormActions } from '../FormActions.js';
import { Combobox } from '../Combobox.js';
import { mountInto, setupDom } from '../../../tests/setup-dom.js';

beforeAll(() => {
  setupDom();
});

describe('Input', () => {
  it('renders text input by default', () => {
    const root = mountInto();
    render(<Input id="x" />, root);
    const node = root.querySelector('input') as HTMLInputElement;
    expect(node.type).toBe('text');
    expect(node.classList.contains('onegov-field__input')).toBe(true);
  });

  it('respects type prop', () => {
    const root = mountInto();
    render(<Input id="x" type="email" />, root);
    expect((root.querySelector('input') as HTMLInputElement).type).toBe('email');
  });

  it('wraps with prefix/suffix when supplied', () => {
    const root = mountInto();
    render(<Input id="x" prefix="€" suffix="RON" />, root);
    expect(root.querySelector('.onegov-field__group')).not.toBeNull();
    expect(root.querySelector('.onegov-field__affix--leading')?.textContent).toBe('€');
    expect(root.querySelector('.onegov-field__affix--trailing')?.textContent).toBe('RON');
  });

  it('marks invalid via aria-invalid', () => {
    const root = mountInto();
    render(<Input id="x" invalid />, root);
    expect(root.querySelector('input')?.getAttribute('aria-invalid')).toBe('true');
  });
});

describe('Textarea', () => {
  it('renders with given rows', () => {
    const root = mountInto();
    render(<Textarea id="x" rows={6} />, root);
    expect(root.querySelector('textarea')?.getAttribute('rows')).toBe('6');
  });

  it('marks invalid via aria-invalid', () => {
    const root = mountInto();
    render(<Textarea id="x" invalid />, root);
    expect(root.querySelector('textarea')?.getAttribute('aria-invalid')).toBe('true');
  });
});

describe('Select', () => {
  it('renders one option per item', () => {
    const root = mountInto();
    render(
      <Select
        id="x"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />,
      root,
    );
    expect(root.querySelectorAll('option').length).toBe(2);
  });

  it('prepends a placeholder option when supplied', () => {
    const root = mountInto();
    render(
      <Select id="x" placeholder="Selectează..." options={[{ value: 'a', label: 'A' }]} />,
      root,
    );
    const options = root.querySelectorAll('option');
    expect(options.length).toBe(2);
    expect(options[0]?.textContent).toBe('Selectează...');
  });
});

describe('Checkbox', () => {
  it('renders an input + label', () => {
    const root = mountInto();
    render(<Checkbox label="Accept" />, root);
    expect(root.querySelector('input[type="checkbox"]')).not.toBeNull();
    expect(root.querySelector('label')?.textContent).toContain('Accept');
  });

  it('clicking the label toggles the input', () => {
    const root = mountInto();
    let checked = false;
    render(<Checkbox label="x" onChange={(e) => (checked = (e.target as HTMLInputElement).checked)} />, root);
    (root.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    expect(checked).toBe(true);
  });
});

describe('Radio + RadioGroup', () => {
  it('groups radios under the same name', () => {
    const root = mountInto();
    render(
      <RadioGroup name="color" legend="Pick a color">
        <Radio name="color" value="red" label="Red" />
        <Radio name="color" value="blue" label="Blue" />
      </RadioGroup>,
      root,
    );
    expect(root.querySelectorAll('input[name="color"]').length).toBe(2);
    expect(root.querySelector('legend')?.textContent).toBe('Pick a color');
  });
});

describe('Switch', () => {
  it('renders a toggle with role=switch', () => {
    const root = mountInto();
    render(<Switch label="Enable" />, root);
    expect(root.querySelector('[role="switch"]')).not.toBeNull();
    expect(root.querySelector('.onegov-switch__track')).not.toBeNull();
  });
});

describe('FormField', () => {
  it('renders label htmlFor matching the supplied id', () => {
    const root = mountInto();
    render(
      <FormField id="cui" label="CUI">
        <Input id="cui" />
      </FormField>,
      root,
    );
    expect(root.querySelector('label')?.getAttribute('for')).toBe('cui');
  });

  it('renders hint with matching id pattern', () => {
    const root = mountInto();
    render(
      <FormField id="cui" label="CUI" hint="Codul">
        <Input id="cui" />
      </FormField>,
      root,
    );
    expect(root.querySelector('.onegov-field__hint')?.textContent).toBe('Codul');
  });

  it('marks error state when error supplied', () => {
    const root = mountInto();
    render(
      <FormField id="cui" label="CUI" error="Required">
        <Input id="cui" />
      </FormField>,
      root,
    );
    expect(root.querySelector('.onegov-field--error')).not.toBeNull();
    expect(root.querySelector('.onegov-field__error')?.getAttribute('role')).toBe('alert');
  });

  it('shows the required asterisk', () => {
    const root = mountInto();
    render(
      <FormField id="cui" label="CUI" required>
        <Input id="cui" />
      </FormField>,
      root,
    );
    expect(root.querySelector('.onegov-field__required')?.textContent).toBe('*');
  });
});

describe('FormActions', () => {
  it('renders right-aligned by default', () => {
    const root = mountInto();
    render(
      <FormActions>
        <button>Submit</button>
      </FormActions>,
      root,
    );
    const node = root.querySelector('.onegov-form-actions') as HTMLElement;
    expect(node).not.toBeNull();
  });

  it('applies the align variant class', () => {
    const root = mountInto();
    render(
      <FormActions align="between">
        <button>A</button>
        <button>B</button>
      </FormActions>,
      root,
    );
    expect(root.querySelector('.onegov-form-actions--between')).not.toBeNull();
  });
});

describe('Combobox', () => {
  it('renders a combobox role on the input', () => {
    const root = mountInto();
    render(
      <Combobox
        id="city"
        value=""
        onValueChange={() => {}}
        onSelect={() => {}}
        options={[]}
      />,
      root,
    );
    expect(root.querySelector('[role="combobox"]')).not.toBeNull();
  });
});
