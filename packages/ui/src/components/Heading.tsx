/**
 * Heading — renders an `<h1>` / `<h2>` / `<h3>` styled by persona tokens.
 *
 * Persona behaviour:
 *   - `pensioner` adds `--pensioner` class for slightly tighter letter-spacing
 *   - `pro` shrinks size via `--onegov-font-size-h*` token (no class change)
 *   - `journalist` and `standard` use the default
 *
 * Text is rendered via JSX, so Preact escapes it. Never accepts HTML.
 */

import type { Persona } from '@onegov/core';

interface Props {
  text: string;
  level?: 1 | 2 | 3;
  persona: Persona;
}

export function Heading({ text, level = 1, persona }: Props) {
  const baseClass = level === 1 ? 'onegov-h1' : level === 2 ? 'onegov-h2' : 'onegov-h3';
  const personaClass = persona === 'pensioner' ? `${baseClass}--pensioner` : '';
  const cls = personaClass ? `${baseClass} ${personaClass}` : baseClass;

  if (level === 2) {
    return (
      <h2 class={cls} data-persona={persona}>
        {text}
      </h2>
    );
  }
  if (level === 3) {
    return (
      <h3 class={cls} data-persona={persona}>
        {text}
      </h3>
    );
  }
  return (
    <h1 class={cls} data-persona={persona}>
      {text}
    </h1>
  );
}
