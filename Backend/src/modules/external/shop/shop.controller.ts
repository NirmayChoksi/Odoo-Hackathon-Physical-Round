import type { Request, Response } from 'express';
import { fail, success } from '../../../utils/apiResponse';
import { shopService } from './shop.service';

export const shopController = {
  async listProducts(req: Request, res: Response): Promise<void> {
    const q = req.shopQuery!;
    const { items, total } = await shopService.listProducts(q);
    res.json(
      success({
        products: items,
        pagination: {
          page: q.page,
          limit: q.limit,
          total,
          totalPages: Math.ceil(total / q.limit) || 0,
        },
      }),
    );
  },

  async filters(_req: Request, res: Response): Promise<void> {
    const data = await shopService.getFilters();
    res.json(success({ ...data, categories: data.productTypes }));
  },

  async productDetail(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.productId);
    if (!Number.isInteger(id) || id < 1) {
      throw fail('Invalid productId', 400);
    }
    const product = await shopService.getProduct(id);
    if (!product) {
      throw fail('Product not found', 404);
    }
    res.json(success(product));
  },

  async productPlans(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.productId);
    if (!Number.isInteger(id) || id < 1) {
      throw fail('Invalid productId', 400);
    }
    const product = await shopService.getProduct(id);
    if (!product) {
      throw fail('Product not found', 404);
    }
    const plans = await shopService.getProductPlans(id);
    res.json(success({ product_id: id, plans }));
  },

  async productVariants(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.productId);
    if (!Number.isInteger(id) || id < 1) {
      throw fail('Invalid productId', 400);
    }
    const product = await shopService.getProduct(id);
    if (!product) {
      throw fail('Product not found', 404);
    }
    const variants = await shopService.getProductVariants(id);
    res.json(success({ product_id: id, variants }));
  },

  async featured(req: Request, res: Response): Promise<void> {
    const lim = Number(req.query.limit);
    const limit = Number.isInteger(lim) && lim > 0 && lim <= 50 ? lim : 8;
    const products = await shopService.listFeatured(limit);
    res.json(success({ products }));
  },

  async productImages(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.productId);
    if (!Number.isInteger(id) || id < 1) {
      throw fail('Invalid productId', 400);
    }
    const product = await shopService.getProduct(id);
    if (!product) {
      throw fail('Product not found', 404);
    }
    const images = await shopService.getProductImages(id);
    res.json(success({ product_id: id, images }));
  }
};
