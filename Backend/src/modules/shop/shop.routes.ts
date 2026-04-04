import { Router } from 'express';
import { asyncHandler } from '../../../middlewares/error.middleware';
import { validateShopQuery } from '../../../middlewares/validate.middleware';
import { parseShopListQuery } from './shop.validation';
import { shopController } from './shop.controller';

const router = Router();

router.get(
  '/products',
  validateShopQuery(parseShopListQuery),
  asyncHandler(shopController.listProducts.bind(shopController)),
);

router.get('/filters', asyncHandler(shopController.filters.bind(shopController)));

router.get(
  '/products/:productId/plans',
  asyncHandler(shopController.productPlans.bind(shopController)),
);

router.get('/products/:productId', asyncHandler(shopController.productDetail.bind(shopController)));

export default router;
