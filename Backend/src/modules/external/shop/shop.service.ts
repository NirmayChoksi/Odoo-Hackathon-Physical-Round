import { shopRepository } from "./shop.repository";
import type { ShopListQuery } from "./shop.types";

export const shopService = {
  listProducts(query: ShopListQuery) {
    return shopRepository.listProducts(query);
  },

  getFilters() {
    return shopRepository.getFilters();
  },

  getProduct(productId: number) {
    return shopRepository.getProductById(productId);
  },

  getProductPlans(productId: number) {
    return shopRepository.getPlansForProduct(productId);
  },

  getProductVariants(productId: number) {
    return shopRepository.listVariants(productId);
  },

  listFeatured(limit?: number) {
    return shopRepository.listFeatured(limit ?? 8);
  },

  getProductImages(productId: number) {
    return shopRepository.getProductImages(productId);
  }
};
