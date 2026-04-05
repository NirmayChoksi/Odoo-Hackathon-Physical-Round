/** Money helpers for shop / cart / checkout (2 decimal places). */

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function lineSubtotal(unitPrice: number, extraPrice: number, quantity: number): number {
  return roundMoney((unitPrice + extraPrice) * quantity);
}

export function lineTax(subtotal: number, taxPercent: number): number {
  if (taxPercent <= 0) return 0;
  return roundMoney((subtotal * taxPercent) / 100);
}

export type DiscountInput = { discount_type: "FIXED" | "PERCENTAGE"; discount_value: number };

export function discountOnSubtotal(subtotal: number, d: DiscountInput): number {
  if (subtotal <= 0) return 0;
  if (d.discount_type === "PERCENTAGE") {
    return roundMoney(Math.min(subtotal, (subtotal * d.discount_value) / 100));
  }
  return roundMoney(Math.min(subtotal, d.discount_value));
}

/** Split cart-level discount across lines by subtotal weight. */
export function allocateDiscountToLines(
  lines: { subtotal: number }[],
  totalDiscount: number
): number[] {
  const subSum = lines.reduce((s, l) => s + l.subtotal, 0);
  if (subSum <= 0 || totalDiscount <= 0) return lines.map(() => 0);
  let allocated = 0;
  const out: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    const isLast = i === lines.length - 1;
    const share = isLast
      ? roundMoney(totalDiscount - allocated)
      : roundMoney((totalDiscount * lines[i].subtotal) / subSum);
    allocated = roundMoney(allocated + share);
    out.push(share);
  }
  return out;
}
