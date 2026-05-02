/**
 * Rule-pack loader + validator test suite.
 *
 * The validator is the type contract enforced at runtime — every shipped
 * rule pack passes through it before the renderer sees a single byte. Bugs
 * here let malformed packs into the pipeline (best case: render glitch;
 * worst case: an attacker-controlled selector reaches the extractor).
 *
 * Coverage matches the task spec:
 *   - happy-path validation produces a typed RulePack
 *   - missing required fields throw ZodError
 *   - wrong enum value throws ZodError
 *   - extra unknown fields throw ZodError (because of `.strict()`)
 *   - loadBundled with a throwing fetcher returns null (pack-missing path)
 *   - loadBundled with a fetcher returning malformed JSON re-throws
 *     (build-time defect path)
 */

import { describe, expect, it } from 'bun:test';
import { ZodError } from 'zod';

import { loadBundled, validate } from '../src/rule-pack-loader.js';
import type { RulePack } from '../src/index.js';

const VALID_PACK: unknown = {
  $schema: 'https://onegov.ro/schemas/rule-pack-v1.json',
  domain: 'anaf.ro',
  version: '0.1.0',
  routes: [
    {
      match: { pattern: '^/$' },
      layout: 'landing',
      extract: [
        {
          id: 'page-title',
          selector: 'h1',
          type: 'heading',
          attrs: { text: 'textContent' },
        },
        {
          id: 'main-actions',
          selector: 'nav.principal a',
          type: 'link',
          multiple: true,
          attrs: { text: 'textContent', href: 'href' },
        },
      ],
      personas: {
        pensioner: {
          layout: 'landing-simplified',
          hide: ['secondary-nav'],
          emphasize: ['main-actions'],
        },
      },
    },
  ],
};

describe('validate()', () => {
  it('accepts a fully-formed rule pack and returns the typed shape', () => {
    const pack: RulePack = validate(VALID_PACK);
    expect(pack.domain).toBe('anaf.ro');
    expect(pack.routes).toHaveLength(1);
    expect(pack.routes[0]?.extract).toHaveLength(2);
    expect(pack.routes[0]?.personas?.pensioner?.layout).toBe('landing-simplified');
  });

  it('throws ZodError on missing required field (no `domain`)', () => {
    const broken = { ...(VALID_PACK as Record<string, unknown>) };
    delete broken['domain'];
    expect(() => validate(broken)).toThrow(ZodError);
  });

  it('throws ZodError on missing required field (no `routes`)', () => {
    const broken = { ...(VALID_PACK as Record<string, unknown>) };
    delete broken['routes'];
    expect(() => validate(broken)).toThrow(ZodError);
  });

  it('throws ZodError when extract.type is not in the allowed enum', () => {
    const broken = JSON.parse(JSON.stringify(VALID_PACK)) as Record<string, unknown>;
    const routes = broken['routes'] as Array<Record<string, unknown>>;
    const extract = routes[0]?.['extract'] as Array<Record<string, unknown>>;
    if (extract[0]) extract[0]['type'] = 'invalid';
    expect(() => validate(broken)).toThrow(ZodError);
  });

  it('throws ZodError on extra unknown root field (.strict())', () => {
    const broken = { ...(VALID_PACK as Record<string, unknown>), extraField: 'nope' };
    expect(() => validate(broken)).toThrow(ZodError);
  });

  it('throws ZodError on extra unknown nested field inside route.match', () => {
    const broken = JSON.parse(JSON.stringify(VALID_PACK)) as Record<string, unknown>;
    const routes = broken['routes'] as Array<Record<string, unknown>>;
    const matchObj = routes[0]?.['match'] as Record<string, unknown>;
    matchObj['unexpected'] = 'value';
    expect(() => validate(broken)).toThrow(ZodError);
  });

  it('throws on non-object input (null)', () => {
    expect(() => validate(null)).toThrow(ZodError);
  });

  it('throws on non-object input (string)', () => {
    expect(() => validate('not a pack')).toThrow(ZodError);
  });

  it('rejects empty `id` on extract rule', () => {
    const broken = JSON.parse(JSON.stringify(VALID_PACK)) as Record<string, unknown>;
    const routes = broken['routes'] as Array<Record<string, unknown>>;
    const extract = routes[0]?.['extract'] as Array<Record<string, unknown>>;
    if (extract[0]) extract[0]['id'] = '';
    expect(() => validate(broken)).toThrow(ZodError);
  });

  it('accepts a pack with no personas (optional field)', () => {
    const minimal = JSON.parse(JSON.stringify(VALID_PACK)) as Record<string, unknown>;
    const routes = minimal['routes'] as Array<Record<string, unknown>>;
    delete routes[0]?.['personas'];
    const pack = validate(minimal);
    expect(pack.routes[0]?.personas).toBeUndefined();
  });
});

describe('loadBundled()', () => {
  it('returns the validated pack when the fetcher succeeds', async () => {
    const fetcher = async (url: string): Promise<unknown> => {
      expect(url).toBe('rule-packs/anaf.ro.json');
      return VALID_PACK;
    };
    const pack = await loadBundled('anaf.ro', fetcher);
    expect(pack).not.toBeNull();
    expect(pack?.domain).toBe('anaf.ro');
  });

  it('returns null when the fetcher throws (pack missing)', async () => {
    const pack = await loadBundled('does-not-exist.ro', async () => {
      throw new Error('404');
    });
    expect(pack).toBeNull();
  });

  it('returns null when the fetcher rejects with a non-Error value', async () => {
    const pack = await loadBundled('weird.ro', () => Promise.reject('string rejection'));
    expect(pack).toBeNull();
  });

  it('rethrows when the fetcher returns malformed JSON (build-time defect)', async () => {
    // A bundled pack that fails validation IS a build-time defect — it should
    // surface as an exception so CI catches it. Only fetcher-side errors are
    // swallowed (treated as "no pack for this domain").
    await expect(
      loadBundled('broken.ro', async () => ({ malformed: true })),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('passes the correct path to the fetcher', async () => {
    let observedUrl = '';
    const fetcher = async (url: string): Promise<unknown> => {
      observedUrl = url;
      return VALID_PACK;
    };
    await loadBundled('ghiseul.ro', fetcher);
    expect(observedUrl).toBe('rule-packs/ghiseul.ro.json');
  });
});
