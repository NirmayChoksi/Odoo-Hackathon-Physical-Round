import { z } from "zod";
import { clampLimit, clampPage } from "./pagination";

/**
 * Runtime validation for values that end up in SQL (via bound parameters or whitelisted fragments).
 * Zod rejects unexpected shapes, overlong strings, and disallowed enum values before they reach repositories.
 */

export function firstQueryValue(v: unknown): unknown {
  if (Array.isArray(v)) return v[0];
  return v;
}

function numFromQuery(v: unknown, fallback: number): number {
  const x = firstQueryValue(v);
  if (x === undefined || x === null || x === "") return fallback;
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

export function zQueryPage(defaultPage = 1) {
  return z.preprocess((v) => numFromQuery(v, defaultPage), z.number()).transform((n) => clampPage(n));
}

export function zQueryLimit(defaultLimit: number, max = 100) {
  return z.preprocess((v) => numFromQuery(v, defaultLimit), z.number()).transform((n) => clampLimit(n, max));
}

/** Optional search / filter text: trim, max length, no NUL (avoids odd DB/driver behavior). */
export function optionalSearch(maxLen: number) {
  return z.preprocess((v) => {
    const x = firstQueryValue(v);
    if (x === undefined || x === null || x === "") return undefined;
    const s = String(x).trim();
    if (!s) return undefined;
    return s.length > maxLen ? s.slice(0, maxLen) : s;
  }, z.union([z.undefined(), z.string().max(maxLen).refine((s) => !s.includes("\0"), "Invalid characters")]));
}

/** Optional positive integer from query (invalid or missing → undefined, matching previous parsers). */
export const optionalPositiveIntQuery = z.preprocess((v) => {
  const x = firstQueryValue(v);
  if (x === undefined || x === null || x === "") return undefined;
  const n = Number(x);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return undefined;
  return n;
}, z.number().int().positive().optional());

export const optionalNonNegativeNumber = z.preprocess((v) => {
  const x = firstQueryValue(v);
  if (x === undefined || x === null || x === "") return undefined;
  const n = Number(x);
  if (!Number.isFinite(n)) return undefined;
  return n;
}, z.number().finite().nonnegative().optional());

export function optionalUpperEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess((v) => {
    const x = firstQueryValue(v);
    if (x === undefined || x === null || x === "") return undefined;
    return String(x).trim().toUpperCase();
  }, z.enum(values).optional());
}

export function zodQueryParse<T>(
  schema: z.ZodType<T>,
  data: unknown
): { ok: true; value: T } | { ok: false; errors: string[] } {
  const r = schema.safeParse(data);
  if (r.success) return { ok: true, value: r.data };
  return {
    ok: false,
    errors: r.error.issues.map((e) => (e.path.length ? `${e.path.join(".")}: ` : "") + e.message),
  };
}
