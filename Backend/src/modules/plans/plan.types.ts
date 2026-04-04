import type { RowDataPacket } from "mysql2";

export interface RecurringPlanRow extends RowDataPacket {
  plan_id: number;
  plan_name: string;
  price: string;
  billing_period: string;
  minimum_quantity: number;
  status: string;
}
