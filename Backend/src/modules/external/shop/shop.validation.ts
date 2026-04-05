import type { Request } from "express";
import { z } from "zod";
import type { ShopListQuery } from "./shop.types";
import {
  firstQueryValue,
  optionalNonNegativeNumber,
  optionalSearch,
  optionalUpperEnum,
  zodQueryParse,
  zQueryLimit,
  zQueryPage,
} from "../../../utils/zodSql";

const shopListQuerySchema = z
  .object({
    page: zQueryPage(1),
    limit: zQueryLimit(20),
    search: optionalSearch(500),
    productType: optionalSearch(120),
    category: optionalSearch(120),
    minPrice: optionalNonNegativeNumber,
    maxPrice: optionalNonNegativeNumber,
    billingPeriod: optionalUpperEnum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
    sortBy: z.preprocess((v) => {
      const x = firstQueryValue(v);
      if (x === undefined || x === null) return "created_at";
      const c = String(x).trim().replace(/[^a-zA-Z0-9_]/g, "");
      return ["product_name", "price", "created_at"].includes(c) ? c : "created_at";
    }, z.enum(["product_name", "price", "created_at"])),
    sortOrder: z.preprocess((v) => {
      const x = firstQueryValue(v);
      const s = typeof x === "string" ? x.trim().toLowerCase() : "";
      if (s === "asc" || s === "desc") return s;
      return "desc";
    }, z.enum(["asc", "desc"])),
  })
  .superRefine((data, ctx) => {
    if (data.minPrice !== undefined && data.maxPrice !== undefined && data.minPrice > data.maxPrice) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "minPrice cannot exceed maxPrice", path: ["maxPrice"] });
    }
  })
  .transform(
    (d): ShopListQuery => ({
      page: d.page,
      limit: d.limit,
      search: d.search,
      productType: d.productType ?? d.category,
      minPrice: d.minPrice,
      maxPrice: d.maxPrice,
      billingPeriod: d.billingPeriod,
      sortBy: d.sortBy,
      sortOrder: d.sortOrder,
    })
  );

export function parseShopListQuery(
  req: Request
): { ok: true; value: ShopListQuery } | { ok: false; errors: string[] } {
  return zodQueryParse(shopListQuerySchema, req.query);
}
