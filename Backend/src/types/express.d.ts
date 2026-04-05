import type { ShopListQuery } from '../modules/external/shop/shop.types';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      shopQuery?: ShopListQuery;
      /** Lowercased role_name from DB (internal APIs) */
      roleName?: string;
      isAdmin?: boolean;
    }
  }
}

export {};
