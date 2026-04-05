import { lineTax, roundMoney } from "../../utils/priceCalculator";

export function calculateLineTax(subtotal: number, taxPercent: number): number {
  return lineTax(subtotal, taxPercent);
}

export { roundMoney };
