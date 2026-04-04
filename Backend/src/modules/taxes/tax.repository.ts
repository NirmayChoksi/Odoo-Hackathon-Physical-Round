import type { RowDataPacket } from "mysql2";
import { pool } from "../../config/db";

export const taxRepository = {
  /** Largest active percentage used as default cart/checkout tax rate. */
  async getDefaultTaxPercent(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT MAX(tax_percentage) AS mx FROM taxes WHERE status = 'ACTIVE'`
    );
    const v = rows[0]?.mx;
    return v != null ? Number(v) : 0;
  }
};
