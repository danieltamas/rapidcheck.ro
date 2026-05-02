/**
 * Local type shim for the `psl` package.
 *
 * `psl` ships its declarations under `types/index.d.ts` but its package.json
 * `exports` map only routes the runtime entry, so TS's `Bundler` resolution
 * cannot reach them. Until upstream adds a `types` condition, we re-declare
 * the (very small) surface we actually use.
 *
 * Source of truth: node_modules/psl/types/index.d.ts.
 */

declare module 'psl' {
  export interface ParsedDomain {
    input: string;
    tld: string | null;
    sld: string | null;
    domain: string | null;
    subdomain: string | null;
    listed: boolean;
  }

  export interface PslErrorResult {
    input: string;
    error: { code: string; message: string };
  }

  export function parse(input: string): ParsedDomain | PslErrorResult;
  export function get(domain: string): string | null;
  export function isValid(domain: string): boolean;
}
