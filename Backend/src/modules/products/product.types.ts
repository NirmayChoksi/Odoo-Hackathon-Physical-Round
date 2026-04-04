import type { RowDataPacket } from "mysql2";

export interface ProductRow extends RowDataPacket {
  product_id: number;
  product_name: string;
  product_type: string;
  sales_price: string;
  cost_price: string;
  description: string | null;
  image_url: string | null;
  short_description: string | null;
  is_recurring: 0 | 1;
  status: string;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}
