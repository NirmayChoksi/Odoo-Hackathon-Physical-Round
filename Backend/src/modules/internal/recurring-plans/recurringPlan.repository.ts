import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { offset } from "../../../utils/pagination";
import type { CreatePlanBody, PatchPlanBody, PlanListQuery } from "./recurringPlan.types";

export const recurringPlanRepository = {
  async list(q: PlanListQuery): Promise<{ rows: RowDataPacket[]; total: number }> {
    const off = offset(q.page, q.limit);
    const where: string[] = ["1=1"];
    const params: unknown[] = [];
    if (q.search) {
      where.push(`plan_name LIKE ?`);
      params.push(`%${q.search}%`);
    }
    if (q.status) {
      where.push(`status = ?`);
      params.push(q.status);
    }
    const w = where.join(" AND ");
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM recurring_plans WHERE ${w}`,
      params
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM recurring_plans WHERE ${w} ORDER BY plan_id DESC LIMIT ? OFFSET ?`,
      [...params, q.limit, off]
    );
    return { rows, total };
  },

  async getById(planId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM recurring_plans WHERE plan_id = ? LIMIT 1`,
      [planId]
    );
    return rows[0] ?? null;
  },

  async insert(body: CreatePlanBody): Promise<number> {
    const status = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO recurring_plans (
        plan_name, price, billing_period, minimum_quantity, start_date, end_date,
        auto_close, closable, pausable, renewable, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.planName,
        body.price,
        body.billingPeriod,
        body.minimumQuantity ?? 1,
        body.startDate || null,
        body.endDate || null,
        body.autoClose !== false ? 1 : 0,
        body.closable !== false ? 1 : 0,
        body.pausable !== false ? 1 : 0,
        body.renewable !== false ? 1 : 0,
        status
      ]
    );
    return res.insertId;
  },

  async update(planId: number, body: PatchPlanBody): Promise<boolean> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    const add = (c: string, v: unknown) => {
      sets.push(`${c} = ?`);
      vals.push(v);
    };
    if (body.planName !== undefined) add("plan_name", body.planName);
    if (body.price !== undefined) add("price", body.price);
    if (body.billingPeriod !== undefined) add("billing_period", body.billingPeriod);
    if (body.minimumQuantity !== undefined) add("minimum_quantity", body.minimumQuantity);
    if (body.startDate !== undefined) add("start_date", body.startDate || null);
    if (body.endDate !== undefined) add("end_date", body.endDate || null);
    if (body.autoClose !== undefined) add("auto_close", body.autoClose ? 1 : 0);
    if (body.closable !== undefined) add("closable", body.closable ? 1 : 0);
    if (body.pausable !== undefined) add("pausable", body.pausable ? 1 : 0);
    if (body.renewable !== undefined) add("renewable", body.renewable ? 1 : 0);
    if (body.status !== undefined) add("status", body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE");
    if (!sets.length) return false;
    vals.push(planId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE recurring_plans SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE plan_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async softDelete(planId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE recurring_plans SET status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP WHERE plan_id = ?`,
      [planId]
    );
    return r.affectedRows > 0;
  }
};
