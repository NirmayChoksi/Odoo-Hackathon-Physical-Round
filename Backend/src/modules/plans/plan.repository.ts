import { pool } from "../../config/db";
import type { RecurringPlanRow } from "./plan.types";

export const planRepository = {
  async findActiveById(planId: number): Promise<RecurringPlanRow | null> {
    const [rows] = await pool.query<RecurringPlanRow[]>(
      `SELECT * FROM recurring_plans WHERE plan_id = :id AND status = 'ACTIVE' LIMIT 1`,
      { id: planId }
    );
    return rows[0] ?? null;
  }
};
