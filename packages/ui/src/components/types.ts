/**
 * Component-local supporting types.
 *
 * The core type contract (`@onegov/core`) is the source of truth for shared
 * shapes (Persona, SemanticTree, etc.). This file holds shapes that ONLY the
 * UI components need — none of these are passed across package boundaries.
 *
 * Constraints:
 *   - No DOM types beyond what Preact's JSX needs.
 *   - No re-exports of `@onegov/core` types — import them directly where used.
 */

/**
 * Render-only descriptor for a form field. The Form component renders these
 * as visual stubs (per invariant #2: no form data is touched in v0.1).
 *
 *   - `name`         field name (used as label fallback if `label` is absent)
 *   - `label`        visible label
 *   - `type`         input type — limited to safe primitives only; no
 *                    `password` (we never render secrets), no `file`
 *                    (passthrough is a content-script concern)
 *   - `value`        optional initial value (rendered for visibility only)
 *   - `placeholder`  optional placeholder text
 *   - `hint`         optional helper line shown below the field
 *   - `required`     visually marks the label; does NOT enforce anything
 *   - `options`      for `type: 'select'` only — list of {value, label}
 */
export interface FormFieldDescriptor {
  name: string;
  label?: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'number' | 'date' | 'textarea' | 'select';
  value?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  options?: ReadonlyArray<{ value: string; label: string }>;
}
