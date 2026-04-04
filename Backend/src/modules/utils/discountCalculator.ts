import { discountOnSubtotal, type DiscountInput } from "../../utils/priceCalculator";

export function calculateCartDiscount(subtotal: number, discount: DiscountInput): number {
  return discountOnSubtotal(subtotal, discount);
}

export type { DiscountInput };
