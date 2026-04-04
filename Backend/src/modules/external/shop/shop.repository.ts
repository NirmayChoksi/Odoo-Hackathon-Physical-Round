import type { RowDataPacket } from 'mysql2';
import { pool } from '../../../config/db';
import { offset } from '../../../utils/pagination';
import type {
  ShopFilters,
  ShopListQuery,
  ShopProduct,
  ShopProductDetail,
  ProductPlan,
} from './shop.types';

interface ProductListRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  product_type: string;
  sales_price: string;
  short_description: string | null;
  image_url: string | null;
  description: string | null;
  terms_and_conditions?: string | null;
  default_plan_id: number | null;
  default_plan_name: string | null;
  plan_price: string | null;
  billing_period: string | null;
  display_price: string;
  created_at: Date;
  total_count: number;
}

export const shopRepository = {
  async listProducts(query: ShopListQuery): Promise<{ items: ShopProduct[]; total: number }> {
    const lim = query.limit;
    const off = offset(query.page, lim);
    const params: Record<string, string | number> = {
      lim,
      off,
    };

    const where: string[] = ["p.status = 'ACTIVE'"];
    if (query.search) {
      where.push(
        '(p.product_name LIKE :search OR p.short_description LIKE :search OR p.description LIKE :search)',
      );
      params.search = `%${query.search}%`;
    }
    if (query.productType) {
      where.push('p.product_type = :productType');
      params.productType = query.productType;
    }
    if (query.minPrice !== undefined) {
      where.push('COALESCE(rp.price, p.sales_price) >= :minPrice');
      params.minPrice = query.minPrice;
    }
    if (query.maxPrice !== undefined) {
      where.push('COALESCE(rp.price, p.sales_price) <= :maxPrice');
      params.maxPrice = query.maxPrice;
    }
    if (query.billingPeriod) {
      where.push(`EXISTS (
        SELECT 1 FROM product_plans pp2
        INNER JOIN recurring_plans rp2 ON rp2.plan_id = pp2.plan_id AND rp2.status = 'ACTIVE'
        WHERE pp2.product_id = p.product_id AND pp2.status = 'ACTIVE'
          AND rp2.billing_period = :billingPeriod
      )`);
      params.billingPeriod = query.billingPeriod;
    }

    const sortCol =
      query.sortBy === 'product_name'
        ? 'p.product_name'
        : query.sortBy === 'price'
          ? 'display_price'
          : 'p.created_at';
    const order = query.sortOrder.toUpperCase();

    const sql = `
      SELECT
        p.product_id,
        p.product_name,
        p.product_type,
        p.sales_price,
        p.short_description,
        p.image_url,
        p.description,
        rp.plan_id AS default_plan_id,
        rp.plan_name AS default_plan_name,
        rp.price AS plan_price,
        rp.billing_period,
        CAST(COALESCE(rp.price, p.sales_price) AS DECIMAL(12,2)) AS display_price,
        p.created_at,
        COUNT(*) OVER() AS total_count
      FROM products p
      LEFT JOIN product_plans pp
        ON pp.product_id = p.product_id AND pp.status = 'ACTIVE' AND pp.is_default = 1
      LEFT JOIN recurring_plans rp
        ON rp.plan_id = pp.plan_id AND rp.status = 'ACTIVE'
      WHERE ${where.join(' AND ')}
      ORDER BY ${sortCol} ${order}
      LIMIT :lim OFFSET :off
    `;

    const [rows] = await pool.query<ProductListRow[]>(sql, params);
    const total = rows[0]?.total_count ?? 0;
    const items: ShopProduct[] = rows.map((r) => ({
      product_id: r.product_id,
      product_name: r.product_name,
      product_type: r.product_type,
      sales_price: r.sales_price,
      short_description: r.short_description,
      image_url: r.image_url,
      description: r.description,
      default_plan_id: r.default_plan_id,
      default_plan_name: r.default_plan_name,
      plan_price: r.plan_price,
      billing_period: r.billing_period,
      display_price: String(r.display_price),
      created_at: r.created_at,
    }));
    return { items, total: Number(total) };
  },

  async getFilters(): Promise<ShopFilters> {
    const [[typeRows], [priceRows], [periodRows]] = await Promise.all([
      pool.query<RowDataPacket[]>(
        `SELECT DISTINCT product_type AS v FROM products WHERE status = 'ACTIVE' ORDER BY v`,
      ),
      pool.query<RowDataPacket[]>(
        `SELECT
           MIN(COALESCE(rp.price, p.sales_price)) AS min_p,
           MAX(COALESCE(rp.price, p.sales_price)) AS max_p
         FROM products p
         LEFT JOIN product_plans pp ON pp.product_id = p.product_id AND pp.status = 'ACTIVE' AND pp.is_default = 1
         LEFT JOIN recurring_plans rp ON rp.plan_id = pp.plan_id AND rp.status = 'ACTIVE'
         WHERE p.status = 'ACTIVE'`,
      ),
      pool.query<RowDataPacket[]>(
        `SELECT DISTINCT rp.billing_period AS v
         FROM recurring_plans rp
         INNER JOIN product_plans pp ON pp.plan_id = rp.plan_id AND pp.status = 'ACTIVE'
         INNER JOIN products p ON p.product_id = pp.product_id AND p.status = 'ACTIVE'
         WHERE rp.status = 'ACTIVE'
         ORDER BY v`,
      ),
    ]);

    const productTypes = typeRows.map((r) => String(r.v));
    const min = priceRows[0]?.min_p != null ? Number(priceRows[0].min_p) : 0;
    const max = priceRows[0]?.max_p != null ? Number(priceRows[0].max_p) : 0;
    const billingPeriods = periodRows.map((r) => String(r.v));

    return {
      productTypes,
      priceRange: { min, max },
      billingPeriods,
    };
  },

  async getProductById(productId: number): Promise<ShopProductDetail | null> {
    const [prodRows] = await pool.query<ProductListRow[]>(
      `SELECT
        p.product_id,
        p.product_name,
        p.product_type,
        p.sales_price,
        p.short_description,
        p.image_url,
        p.description,
        p.terms_and_conditions,
        rp.plan_id AS default_plan_id,
        rp.plan_name AS default_plan_name,
        rp.price AS plan_price,
        rp.billing_period,
        CAST(COALESCE(rp.price, p.sales_price) AS DECIMAL(12,2)) AS display_price,
        p.created_at,
        0 AS total_count
      FROM products p
      LEFT JOIN product_plans pp
        ON pp.product_id = p.product_id AND pp.status = 'ACTIVE' AND pp.is_default = 1
      LEFT JOIN recurring_plans rp
        ON rp.plan_id = pp.plan_id AND rp.status = 'ACTIVE'
      WHERE p.product_id = :id AND p.status = 'ACTIVE'`,
      { id: productId },
    );
    const p = prodRows[0];
    if (!p) return null;

    const [varRows] = await pool.query<RowDataPacket[]>(
      `SELECT variant_id, attribute_name, attribute_value, extra_price, status
       FROM product_variants WHERE product_id = :id AND status = 'ACTIVE'`,
      { id: productId },
    );

    return {
      product_id: p.product_id,
      product_name: p.product_name,
      product_type: p.product_type,
      sales_price: p.sales_price,
      short_description: p.short_description,
      image_url: p.image_url,
      description: p.description,
      default_plan_id: p.default_plan_id,
      default_plan_name: p.default_plan_name,
      plan_price: p.plan_price,
      billing_period: p.billing_period,
      display_price: String(p.display_price),
      created_at: p.created_at,
      terms_and_conditions: p.terms_and_conditions ?? null,
      variants: varRows.map((v) => ({
        variant_id: v.variant_id,
        attribute_name: v.attribute_name,
        attribute_value: v.attribute_value,
        extra_price: String(v.extra_price),
        status: v.status,
      })),
    };
  },

  async getPlansForProduct(productId: number): Promise<ProductPlan[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        pp.product_plan_id,
        pp.plan_id,
        pp.is_default,
        rp.plan_name,
        rp.price,
        rp.billing_period
      FROM product_plans pp
      INNER JOIN recurring_plans rp ON rp.plan_id = pp.plan_id AND rp.status = 'ACTIVE'
      WHERE pp.product_id = :productId AND pp.status = 'ACTIVE'
      ORDER BY pp.is_default DESC, rp.price ASC`,
      { productId },
    );
    return rows.map((r) => ({
      product_plan_id: r.product_plan_id,
      plan_id: r.plan_id,
      plan_name: r.plan_name,
      price: String(r.price),
      billing_period: r.billing_period,
      is_default: Boolean(r.is_default),
    }));
  },

  async listVariants(productId: number) {
    const [varRows] = await pool.query<RowDataPacket[]>(
      `SELECT variant_id, attribute_name, attribute_value, extra_price, status
       FROM product_variants WHERE product_id = :id AND status = 'ACTIVE' ORDER BY variant_id`,
      { id: productId }
    );
    return varRows.map((v) => ({
      variant_id: v.variant_id,
      attribute_name: v.attribute_name,
      attribute_value: v.attribute_value,
      extra_price: String(v.extra_price),
      status: v.status
    }));
  },

  async listFeatured(limit = 8): Promise<ShopProduct[]> {
    const [rows] = await pool.query<ProductListRow[]>(
      `
      SELECT
        p.product_id,
        p.product_name,
        p.product_type,
        p.sales_price,
        p.short_description,
        p.image_url,
        p.description,
        rp.plan_id AS default_plan_id,
        rp.plan_name AS default_plan_name,
        rp.price AS plan_price,
        rp.billing_period,
        CAST(COALESCE(rp.price, p.sales_price) AS DECIMAL(12,2)) AS display_price,
        p.created_at,
        0 AS total_count
      FROM products p
      LEFT JOIN product_plans pp
        ON pp.product_id = p.product_id AND pp.status = 'ACTIVE' AND pp.is_default = 1
      LEFT JOIN recurring_plans rp
        ON rp.plan_id = pp.plan_id AND rp.status = 'ACTIVE'
      WHERE p.status = 'ACTIVE'
      ORDER BY p.created_at DESC
      LIMIT :lim
    `,
      { lim: limit }
    );
    return rows.map((r) => ({
      product_id: r.product_id,
      product_name: r.product_name,
      product_type: r.product_type,
      sales_price: r.sales_price,
      short_description: r.short_description,
      image_url: r.image_url,
      description: r.description,
      default_plan_id: r.default_plan_id,
      default_plan_name: r.default_plan_name,
      plan_price: r.plan_price,
      billing_period: r.billing_period,
      display_price: String(r.display_price),
      created_at: r.created_at
    }));
  },

  async getProductImages(productId: number): Promise<{ image_url: string | null; sort_order: number }[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT image_url FROM products WHERE product_id = :id AND status = 'ACTIVE' LIMIT 1`,
      { id: productId }
    );
    const url = rows[0]?.image_url != null ? String(rows[0].image_url) : null;
    if (!url) return [];
    return [{ image_url: url, sort_order: 0 }];
  }
};
