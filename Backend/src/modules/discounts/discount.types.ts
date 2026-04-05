import type { RowDataPacket } from "mysql2";

export interface DiscountRow extends RowDataPacket {
  discount_id: number;
  discount_name: string;
  coupon_code: string | null;
  discount_type: "FIXED" | "PERCENTAGE";
  discount_value: string;
  minimum_purchase: string;
  minimum_quantity: number;
  start_date: Date | null;
  end_date: Date | null;
  limit_usage: number | null;
  used_count: number;
  status: string;
}
