import type { NextFunction, Request, Response } from 'express';
import type { ShopListQuery } from '../modules/external/shop/shop.types';

type Parser<T> = (req: Request) => { ok: true; value: T } | { ok: false; errors: string[] };

export function validateBody<T>(parser: Parser<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const r = parser(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: r.errors });
      return;
    }
    (req as Request & { validatedBody: T }).validatedBody = r.value;
    next();
  };
}

export function validateShopQuery(parser: Parser<ShopListQuery>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const r = parser(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: 'Invalid query', errors: r.errors });
      return;
    }
    req.shopQuery = r.value;
    next();
  };
}

/** Typed accessor after validateBody */
export function getValidatedBody<T>(req: Request): T {
  return (req as Request & { validatedBody: T }).validatedBody;
}
