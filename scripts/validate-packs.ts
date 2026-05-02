#!/usr/bin/env bun
/**
 * Validate every JSON file in `rule-packs/` against the rule-pack schema.
 *
 * Track 5 (this script) extends the Track 1 stub from a JSON.parse-only check
 * to a real shape validator. Track 2 owns the canonical Zod schema in
 * `@onegov/core` (still a stub at the time of writing). Until that lands, this
 * script ships its own inline validators that mirror the contracts in
 * `packages/core/src/types.ts` exactly:
 *
 *   - `_verified-domains.json` validates against the `VerifiedDomainList` shape
 *     (`version`, `updatedAt`, `domains[]` of `{ domain, category, addedAt, source }`).
 *   - Every other `*.json` validates against the `RulePack` shape (`$schema`,
 *     `domain`, `version`, `routes[]` of `{ match.pattern, layout, extract[],
 *     personas? }`). Every extract rule must have `id`, `selector`, `type`.
 *     Optional `_comment` fields are explicitly tolerated on routes and rules.
 *
 * Exits 0 on success, 1 on any failure. Failures are pretty-printed with the
 * dotted JSON path that failed (e.g. `routes[1].extract[3].selector`).
 *
 * When @onegov/core ships a Zod-backed `validate()`, this script should be
 * trimmed back to a thin wrapper that calls it. See DONE-05 report for the
 * upgrade hand-off.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';

// ---------- Helpers ----------

interface ValidationError {
  path: string;
  message: string;
}

class Validator {
  private readonly errors: ValidationError[] = [];

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  list(): ValidationError[] {
    return this.errors;
  }

  fail(path: string, message: string): void {
    this.errors.push({ path, message });
  }

  isObject(value: unknown, path: string): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      this.fail(path, `expected object, got ${describe(value)}`);
      return false;
    }
    return true;
  }

  isArray(value: unknown, path: string): value is unknown[] {
    if (!Array.isArray(value)) {
      this.fail(path, `expected array, got ${describe(value)}`);
      return false;
    }
    return true;
  }

  isNonEmptyString(value: unknown, path: string): value is string {
    if (typeof value !== 'string' || value.length === 0) {
      this.fail(path, `expected non-empty string, got ${describe(value)}`);
      return false;
    }
    return true;
  }

  isOptionalNonEmptyString(value: unknown, path: string): boolean {
    if (value === undefined) return true;
    return this.isNonEmptyString(value, path);
  }

  isOneOf<T extends string>(value: unknown, choices: readonly T[], path: string): value is T {
    if (typeof value !== 'string' || !choices.includes(value as T)) {
      this.fail(path, `expected one of ${JSON.stringify(choices)}, got ${describe(value)}`);
      return false;
    }
    return true;
  }
}

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `array(${value.length})`;
  return typeof value;
}

// ---------- Schemas ----------

const EXTRACT_TYPES = ['heading', 'paragraph', 'list', 'table', 'form', 'link', 'image'] as const;

const PERSONAS = ['pensioner', 'standard', 'pro', 'journalist'] as const;

function validateExtractRule(v: Validator, rule: unknown, path: string): void {
  if (!v.isObject(rule, path)) return;
  v.isNonEmptyString(rule.id, `${path}.id`);
  v.isNonEmptyString(rule.selector, `${path}.selector`);
  v.isOneOf(rule.type, EXTRACT_TYPES, `${path}.type`);
  if (rule.attrs !== undefined) {
    if (v.isObject(rule.attrs, `${path}.attrs`)) {
      for (const [key, val] of Object.entries(rule.attrs)) {
        if (typeof val !== 'string') {
          v.fail(`${path}.attrs.${key}`, `expected string, got ${describe(val)}`);
        }
      }
    }
  }
  if (rule.multiple !== undefined && typeof rule.multiple !== 'boolean') {
    v.fail(`${path}.multiple`, `expected boolean, got ${describe(rule.multiple)}`);
  }
  // `_comment` is tolerated as an authoring nicety; must be a string when present.
  if (rule._comment !== undefined && typeof rule._comment !== 'string') {
    v.fail(`${path}._comment`, `expected string, got ${describe(rule._comment)}`);
  }
}

function validatePersonaOverride(v: Validator, override: unknown, path: string): void {
  if (!v.isObject(override, path)) return;
  if (override.layout !== undefined) v.isNonEmptyString(override.layout, `${path}.layout`);
  for (const field of ['hide', 'emphasize'] as const) {
    if (override[field] !== undefined) {
      if (v.isArray(override[field], `${path}.${field}`)) {
        (override[field] as unknown[]).forEach((id, i) => {
          v.isNonEmptyString(id, `${path}.${field}[${i}]`);
        });
      }
    }
  }
  if (override._comment !== undefined && typeof override._comment !== 'string') {
    v.fail(`${path}._comment`, `expected string, got ${describe(override._comment)}`);
  }
}

function validateRoute(v: Validator, route: unknown, path: string): void {
  if (!v.isObject(route, path)) return;
  // _comment is tolerated at the route level (per task spec — selector source
  // documentation lives in a leading _comment field on each route).
  if (route._comment !== undefined && typeof route._comment !== 'string') {
    v.fail(`${path}._comment`, `expected string, got ${describe(route._comment)}`);
  }
  if (v.isObject(route.match, `${path}.match`)) {
    v.isNonEmptyString(route.match.pattern, `${path}.match.pattern`);
    // Validate the pattern compiles as a RegExp.
    if (typeof route.match.pattern === 'string') {
      try {
        new RegExp(route.match.pattern);
      } catch (err) {
        v.fail(
          `${path}.match.pattern`,
          `not a valid RegExp: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
  v.isNonEmptyString(route.layout, `${path}.layout`);
  if (v.isArray(route.extract, `${path}.extract`)) {
    if (route.extract.length === 0) {
      v.fail(`${path}.extract`, 'expected at least one extract rule');
    }
    const seenIds = new Set<string>();
    route.extract.forEach((rule, i) => {
      validateExtractRule(v, rule, `${path}.extract[${i}]`);
      if (
        typeof rule === 'object' &&
        rule !== null &&
        typeof (rule as Record<string, unknown>).id === 'string'
      ) {
        const id = (rule as Record<string, string>).id;
        if (seenIds.has(id)) {
          v.fail(`${path}.extract[${i}].id`, `duplicate id "${id}" in route`);
        }
        seenIds.add(id);
      }
    });
  }
  if (route.personas !== undefined) {
    if (v.isObject(route.personas, `${path}.personas`)) {
      for (const [key, override] of Object.entries(route.personas)) {
        if (!PERSONAS.includes(key as (typeof PERSONAS)[number])) {
          v.fail(
            `${path}.personas.${key}`,
            `unknown persona; expected one of ${JSON.stringify(PERSONAS)}`,
          );
          continue;
        }
        validatePersonaOverride(v, override, `${path}.personas.${key}`);
      }
    }
  }
}

function validateRulePack(data: unknown, fileName: string): ValidationError[] {
  const v = new Validator();
  if (!v.isObject(data, '$root')) return v.list();
  v.isNonEmptyString(data.$schema, '$root.$schema');
  v.isNonEmptyString(data.domain, '$root.domain');
  v.isNonEmptyString(data.version, '$root.version');
  // The `domain` field must match the file name (sans `.json`).
  if (typeof data.domain === 'string') {
    const expected = fileName.replace(/\.json$/, '');
    if (data.domain !== expected) {
      v.fail('$root.domain', `expected to match file name "${expected}", got "${data.domain}"`);
    }
  }
  if (v.isArray(data.routes, '$root.routes')) {
    if (data.routes.length === 0) {
      v.fail('$root.routes', 'expected at least one route');
    }
    data.routes.forEach((route, i) => {
      validateRoute(v, route, `$root.routes[${i}]`);
    });
  }
  return v.list();
}

function validateVerifiedDomainList(data: unknown): ValidationError[] {
  const v = new Validator();
  if (!v.isObject(data, '$root')) return v.list();
  v.isNonEmptyString(data.version, '$root.version');
  v.isNonEmptyString(data.updatedAt, '$root.updatedAt');
  if (v.isArray(data.domains, '$root.domains')) {
    const seenDomains = new Set<string>();
    data.domains.forEach((entry, i) => {
      const path = `$root.domains[${i}]`;
      if (!v.isObject(entry, path)) return;
      v.isNonEmptyString(entry.domain, `${path}.domain`);
      v.isOneOf(entry.category, ['gov', 'public-interest'], `${path}.category`);
      v.isNonEmptyString(entry.addedAt, `${path}.addedAt`);
      v.isNonEmptyString(entry.source, `${path}.source`);
      // ISO-8601 date check (YYYY-MM-DD).
      if (typeof entry.addedAt === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(entry.addedAt)) {
        v.fail(`${path}.addedAt`, `expected ISO date YYYY-MM-DD, got "${entry.addedAt}"`);
      }
      // Domain must look like an eTLD+1 (no scheme, no path, no leading www.).
      if (typeof entry.domain === 'string') {
        if (/^https?:|\//.test(entry.domain)) {
          v.fail(`${path}.domain`, `expected eTLD+1, got URL "${entry.domain}"`);
        }
        if (entry.domain.startsWith('www.')) {
          v.fail(`${path}.domain`, `eTLD+1 must not include "www." prefix; got "${entry.domain}"`);
        }
        if (seenDomains.has(entry.domain)) {
          v.fail(`${path}.domain`, `duplicate domain "${entry.domain}"`);
        }
        seenDomains.add(entry.domain);
      }
      // Source must be a fetchable URL.
      if (typeof entry.source === 'string' && !/^https?:\/\//.test(entry.source)) {
        v.fail(`${path}.source`, `expected http(s) URL, got "${entry.source}"`);
      }
    });
  }
  return v.list();
}

// ---------- Entry point ----------

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const packsDir = resolve(repoRoot, 'rule-packs');

if (!existsSync(packsDir)) {
  // eslint-disable-next-line no-console
  console.log('[validate-packs] no rule-packs/ directory yet — nothing to do');
  process.exit(0);
}

const failures: Array<{ file: string; errors: ValidationError[] }> = [];
let checked = 0;

for (const entry of readdirSync(packsDir).sort()) {
  const full = resolve(packsDir, entry);
  if (!statSync(full).isFile()) continue;
  if (extname(entry) !== '.json') continue;
  checked += 1;

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(full, 'utf8'));
  } catch (err) {
    failures.push({
      file: entry,
      errors: [
        {
          path: '$root',
          message: `not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    });
    continue;
  }

  const errors =
    entry === '_verified-domains.json'
      ? validateVerifiedDomainList(parsed)
      : validateRulePack(parsed, entry);

  if (errors.length > 0) {
    failures.push({ file: entry, errors });
  }
}

if (failures.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`[validate-packs] FAIL — ${failures.length} file(s) with errors:`);
  for (const f of failures) {
    // eslint-disable-next-line no-console
    console.error(`\n  ${f.file}:`);
    for (const err of f.errors) {
      // eslint-disable-next-line no-console
      console.error(`    - ${err.path}: ${err.message}`);
    }
  }
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`[validate-packs] OK — ${checked} file(s) checked`);
