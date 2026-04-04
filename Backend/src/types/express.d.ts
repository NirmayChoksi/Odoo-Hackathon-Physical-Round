import type { ShopListQuery } from '../modules/external/shop/shop.types';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      shopQuery?: ShopListQuery;
    }
  }
}

export {};
