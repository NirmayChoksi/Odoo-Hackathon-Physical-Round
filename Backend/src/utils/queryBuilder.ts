const SORT_ORDER = new Set(["asc", "desc"] as const);

export type SortOrder = "asc" | "desc";

export function normalizeSortOrder(raw: string | undefined, fallback: SortOrder = "asc"): SortOrder {
  const v = (raw || fallback).toLowerCase();
  return SORT_ORDER.has(v as SortOrder) ? (v as SortOrder) : fallback;
}

export function pickSortColumn(
  sortBy: string | undefined,
  allowed: readonly string[],
  fallback: string
): string {
  if (!sortBy) return fallback;
  const c = sortBy.replace(/[^a-zA-Z0-9_]/g, "");
  return allowed.includes(c) ? c : fallback;
}
