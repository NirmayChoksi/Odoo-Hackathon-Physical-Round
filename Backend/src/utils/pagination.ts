export function clampPage(page: number): number {
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

export function clampLimit(limit: number, max = 100): number {
  if (!Number.isFinite(limit) || limit < 1) return 20;
  return Math.min(Math.floor(limit), max);
}

export function offset(page: number, limit: number): number {
  return (clampPage(page) - 1) * clampLimit(limit);
}
