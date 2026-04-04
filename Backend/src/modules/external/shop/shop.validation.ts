import type { Request } from 'express';
import { clampLimit, clampPage } from '../../../utils/pagination';
import { normalizeSortOrder, pickSortColumn } from '../../../utils/queryBuilder';
import type { BillingPeriod, ShopListQuery } from './shop.types';

const BILLING: Set<string> = new Set(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']);
const SORT_COLUMNS = ['product_name', 'price', 'created_at'] as const;

function parseNum(q: Record<string, unknown>, key: string): number | undefined {
  const v = q[key];
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseStr(q: Record<string, unknown>, key: string): string | undefined {
  const v = q[key];
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

export function parseShopListQuery(
  req: Request,
): { ok: true; value: ShopListQuery } | { ok: false; errors: string[] } {
  const q = req.query as Record<string, unknown>;
  const errors: string[] = [];

  const page = clampPage(parseNum(q, 'page') ?? 1);
  const limit = clampLimit(parseNum(q, 'limit') ?? 20);

  const minPrice = parseNum(q, 'minPrice');
  const maxPrice = parseNum(q, 'maxPrice');
  if (minPrice !== undefined && minPrice < 0) errors.push('minPrice must be >= 0');
  if (maxPrice !== undefined && maxPrice < 0) errors.push('maxPrice must be >= 0');
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    errors.push('minPrice cannot exceed maxPrice');
  }

  const billingRaw = parseStr(q, 'billingPeriod')?.toUpperCase();
  let billingPeriod: BillingPeriod | undefined;
  if (billingRaw) {
    if (BILLING.has(billingRaw)) billingPeriod = billingRaw as BillingPeriod;
    else errors.push('billingPeriod must be DAILY, WEEKLY, MONTHLY, or YEARLY');
  }

  const sortBy = pickSortColumn(
    parseStr(q, 'sortBy'),
    SORT_COLUMNS,
    'created_at',
  ) as ShopListQuery['sortBy'];
  const sortOrder = normalizeSortOrder(parseStr(q, 'sortOrder'), 'desc');

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      page,
      limit,
      search: parseStr(q, 'search'),
      productType: parseStr(q, 'productType') || parseStr(q, 'category'),
      minPrice,
      maxPrice,
      billingPeriod,
      sortBy,
      sortOrder,
    },
  };
}
