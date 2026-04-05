import type { ResultSetHeader, RowDataPacket } from "mysql2";
import type { Pool, PoolConnection } from "mysql2/promise";
import { pool } from "../../../config/db";
import { offset } from "../../../utils/pagination";
import type {
  CreatePaymentTermBody,
  PatchPaymentTermBody,
  PaymentTermDto,
  PaymentTermInstallmentDto,
  PaymentTermInstallmentInput,
  PaymentTermListQuery,
  PaymentTermMethodDto,
  PaymentTermMethodInput,
  PaymentTermPageData,
} from "./paymentTerm.types";

function bool(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}

function mapTermRow(row: RowDataPacket): PaymentTermDto {
  return {
    paymentTermId: Number(row.payment_term_id),
    termName: String(row.term_name),
    description: row.description != null ? String(row.description) : null,
    dueType: row.due_type,
    days: row.days != null ? Number(row.days) : null,
    graceDays: Number(row.grace_days ?? 0),
    startFrom: row.start_from,
    isDefault: bool(row.is_default),
    status: row.status,
    enableLateFee: bool(row.enable_late_fee),
    lateFeeType: row.late_fee_type ?? null,
    lateFeeValue: row.late_fee_value != null ? Number(row.late_fee_value) : null,
    lateFeeAfterDays: row.late_fee_after_days != null ? Number(row.late_fee_after_days) : null,
    enableEarlyDiscount: bool(row.enable_early_discount),
    earlyDiscountType: row.early_discount_type ?? null,
    earlyDiscountValue: row.early_discount_value != null ? Number(row.early_discount_value) : null,
    earlyDiscountWithinDays:
      row.early_discount_within_days != null ? Number(row.early_discount_within_days) : null,
    notes: row.notes != null ? String(row.notes) : null,
    internalRemarks: row.internal_remarks != null ? String(row.internal_remarks) : null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

function mapInstallmentRow(row: RowDataPacket): PaymentTermInstallmentDto {
  return {
    installmentId: Number(row.installment_id),
    paymentTermId: Number(row.payment_term_id),
    installmentNumber: Number(row.installment_number),
    percentage: Number(row.percentage),
    dueAfterDays: Number(row.due_after_days),
    description: row.description != null ? String(row.description) : null,
  };
}

function mapMethodRow(row: RowDataPacket): PaymentTermMethodDto {
  return {
    paymentTermMethodId: Number(row.payment_term_method_id),
    paymentTermId: Number(row.payment_term_id),
    paymentMethod: row.payment_method,
    isDefault: bool(row.is_default),
  };
}

async function clearAllDefaults(conn: Pool | PoolConnection): Promise<void> {
  await conn.query(`UPDATE payment_terms SET is_default = FALSE`);
}

function termInsertValues(body: CreatePaymentTermBody): unknown[] {
  return [
    body.termName,
    body.description ?? null,
    body.dueType,
    body.days ?? null,
    body.graceDays ?? 0,
    body.startFrom ?? "INVOICE_DATE",
    body.isDefault ? 1 : 0,
    body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    body.enableLateFee ? 1 : 0,
    body.lateFeeType ?? null,
    body.lateFeeValue ?? null,
    body.lateFeeAfterDays ?? null,
    body.enableEarlyDiscount ? 1 : 0,
    body.earlyDiscountType ?? null,
    body.earlyDiscountValue ?? null,
    body.earlyDiscountWithinDays ?? null,
    body.notes ?? null,
    body.internalRemarks ?? null,
  ];
}

export const paymentTermRepository = {
  async list(q: PaymentTermListQuery): Promise<{ rows: PaymentTermDto[]; total: number }> {
    const off = offset(q.page, q.limit);
    const where: string[] = ["1=1"];
    const params: unknown[] = [];
    if (q.search) {
      where.push(`(term_name LIKE ? OR description LIKE ?)`);
      params.push(`%${q.search}%`, `%${q.search}%`);
    }
    if (q.status) {
      where.push(`status = ?`);
      params.push(q.status);
    }
    const w = where.join(" AND ");
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS c FROM payment_terms WHERE ${w}`,
      params
    );
    const total = Number(countRows[0]?.c ?? 0);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM payment_terms WHERE ${w} ORDER BY payment_term_id DESC LIMIT ? OFFSET ?`,
      [...params, q.limit, off]
    );
    return { rows: rows.map(mapTermRow), total };
  },

  async getById(paymentTermId: number): Promise<PaymentTermDto | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM payment_terms WHERE payment_term_id = ? LIMIT 1`,
      [paymentTermId]
    );
    return rows[0] ? mapTermRow(rows[0]) : null;
  },

  async getPageData(paymentTermId: number): Promise<PaymentTermPageData | null> {
    const term = await this.getById(paymentTermId);
    if (!term) return null;
    const [instRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM payment_term_installments WHERE payment_term_id = ? ORDER BY installment_number`,
      [paymentTermId]
    );
    const [methRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM payment_term_methods WHERE payment_term_id = ? ORDER BY payment_term_method_id`,
      [paymentTermId]
    );
    return {
      paymentTerm: term,
      installments: instRows.map(mapInstallmentRow),
      methods: methRows.map(mapMethodRow),
    };
  },

  async insertInstallmentsBatch(
    conn: PoolConnection,
    paymentTermId: number,
    items: PaymentTermInstallmentInput[]
  ): Promise<void> {
    for (const it of items) {
      await conn.query<ResultSetHeader>(
        `INSERT INTO payment_term_installments (payment_term_id, installment_number, percentage, due_after_days, description)
         VALUES (?, ?, ?, ?, ?)`,
        [paymentTermId, it.installmentNumber, it.percentage, it.dueAfterDays, it.description ?? null]
      );
    }
  },

  async insertMethodsBatch(
    conn: PoolConnection,
    paymentTermId: number,
    items: PaymentTermMethodInput[]
  ): Promise<void> {
    for (const it of items) {
      await conn.query<ResultSetHeader>(
        `INSERT INTO payment_term_methods (payment_term_id, payment_method, is_default) VALUES (?, ?, ?)`,
        [paymentTermId, it.paymentMethod, it.isDefault ? 1 : 0]
      );
    }
  },

  async create(body: CreatePaymentTermBody): Promise<number> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      if (body.isDefault) {
        await clearAllDefaults(conn);
      }
      const vals = termInsertValues(body);
      const [res] = await conn.query<ResultSetHeader>(
        `INSERT INTO payment_terms (
          term_name, description, due_type, days, grace_days, start_from, is_default, status,
          enable_late_fee, late_fee_type, late_fee_value, late_fee_after_days,
          enable_early_discount, early_discount_type, early_discount_value, early_discount_within_days,
          notes, internal_remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        vals
      );
      const id = res.insertId;
      if (body.installments?.length) {
        await this.insertInstallmentsBatch(conn, id, body.installments);
      }
      if (body.methods?.length) {
        await this.insertMethodsBatch(conn, id, body.methods);
      }
      await conn.commit();
      return id;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async deleteInstallmentsForTerm(conn: PoolConnection, paymentTermId: number): Promise<void> {
    await conn.query(`DELETE FROM payment_term_installments WHERE payment_term_id = ?`, [paymentTermId]);
  },

  async deleteMethodsForTerm(conn: PoolConnection, paymentTermId: number): Promise<void> {
    await conn.query(`DELETE FROM payment_term_methods WHERE payment_term_id = ?`, [paymentTermId]);
  },

  async update(paymentTermId: number, body: PatchPaymentTermBody): Promise<boolean> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [exRows] = await conn.query<RowDataPacket[]>(
        `SELECT payment_term_id FROM payment_terms WHERE payment_term_id = ? LIMIT 1`,
        [paymentTermId]
      );
      if (!exRows.length) {
        await conn.rollback();
        return false;
      }
      if (body.isDefault === true) {
        await clearAllDefaults(conn);
      }
      const sets: string[] = [];
      const vals: unknown[] = [];
      const add = (col: string, v: unknown) => {
        sets.push(`${col} = ?`);
        vals.push(v);
      };
      if (body.termName !== undefined) add("term_name", body.termName);
      if (body.description !== undefined) add("description", body.description);
      if (body.dueType !== undefined) add("due_type", body.dueType);
      if (body.days !== undefined) add("days", body.days);
      if (body.graceDays !== undefined) add("grace_days", body.graceDays);
      if (body.startFrom !== undefined) add("start_from", body.startFrom);
      if (body.isDefault !== undefined) add("is_default", body.isDefault ? 1 : 0);
      if (body.status !== undefined) add("status", body.status);
      if (body.enableLateFee !== undefined) add("enable_late_fee", body.enableLateFee ? 1 : 0);
      if (body.lateFeeType !== undefined) add("late_fee_type", body.lateFeeType);
      if (body.lateFeeValue !== undefined) add("late_fee_value", body.lateFeeValue);
      if (body.lateFeeAfterDays !== undefined) add("late_fee_after_days", body.lateFeeAfterDays);
      if (body.enableEarlyDiscount !== undefined) add("enable_early_discount", body.enableEarlyDiscount ? 1 : 0);
      if (body.earlyDiscountType !== undefined) add("early_discount_type", body.earlyDiscountType);
      if (body.earlyDiscountValue !== undefined) add("early_discount_value", body.earlyDiscountValue);
      if (body.earlyDiscountWithinDays !== undefined) add("early_discount_within_days", body.earlyDiscountWithinDays);
      if (body.notes !== undefined) add("notes", body.notes);
      if (body.internalRemarks !== undefined) add("internal_remarks", body.internalRemarks);

      if (sets.length) {
        vals.push(paymentTermId);
        const [r] = await conn.query<ResultSetHeader>(
          `UPDATE payment_terms SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE payment_term_id = ?`,
          vals
        );
        if (r.affectedRows === 0) {
          await conn.rollback();
          return false;
        }
      }

      if (body.installments !== undefined) {
        await this.deleteInstallmentsForTerm(conn, paymentTermId);
        if (body.installments.length) {
          await this.insertInstallmentsBatch(conn, paymentTermId, body.installments);
        }
      }

      if (body.methods !== undefined) {
        await this.deleteMethodsForTerm(conn, paymentTermId);
        if (body.methods.length) {
          await this.insertMethodsBatch(conn, paymentTermId, body.methods);
        }
      }

      await conn.commit();
      return true;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  async remove(paymentTermId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(`DELETE FROM payment_terms WHERE payment_term_id = ?`, [
      paymentTermId,
    ]);
    return r.affectedRows > 0;
  },

  async getInstallmentById(installmentId: number): Promise<PaymentTermInstallmentDto | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM payment_term_installments WHERE installment_id = ? LIMIT 1`,
      [installmentId]
    );
    return rows[0] ? mapInstallmentRow(rows[0]) : null;
  },

  async addInstallment(paymentTermId: number, row: PaymentTermInstallmentInput): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO payment_term_installments (payment_term_id, installment_number, percentage, due_after_days, description)
       VALUES (?, ?, ?, ?, ?)`,
      [paymentTermId, row.installmentNumber, row.percentage, row.dueAfterDays, row.description ?? null]
    );
    return res.insertId;
  },

  async patchInstallment(installmentId: number, patch: Partial<PaymentTermInstallmentInput>): Promise<boolean> {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (patch.installmentNumber !== undefined) {
      sets.push("installment_number = ?");
      vals.push(patch.installmentNumber);
    }
    if (patch.percentage !== undefined) {
      sets.push("percentage = ?");
      vals.push(patch.percentage);
    }
    if (patch.dueAfterDays !== undefined) {
      sets.push("due_after_days = ?");
      vals.push(patch.dueAfterDays);
    }
    if (patch.description !== undefined) {
      sets.push("description = ?");
      vals.push(patch.description);
    }
    if (!sets.length) return false;
    vals.push(installmentId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE payment_term_installments SET ${sets.join(", ")} WHERE installment_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async deleteInstallment(installmentId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `DELETE FROM payment_term_installments WHERE installment_id = ?`,
      [installmentId]
    );
    return r.affectedRows > 0;
  },

  async addMethod(paymentTermId: number, row: PaymentTermMethodInput): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO payment_term_methods (payment_term_id, payment_method, is_default) VALUES (?, ?, ?)`,
      [paymentTermId, row.paymentMethod, row.isDefault ? 1 : 0]
    );
    return res.insertId;
  },

  async deleteMethod(paymentTermMethodId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `DELETE FROM payment_term_methods WHERE payment_term_method_id = ?`,
      [paymentTermMethodId]
    );
    return r.affectedRows > 0;
  },

  async clearMethodDefaultsForTerm(paymentTermId: number): Promise<void> {
    await pool.query(`UPDATE payment_term_methods SET is_default = FALSE WHERE payment_term_id = ?`, [
      paymentTermId,
    ]);
  },

  async getMethodById(paymentTermMethodId: number): Promise<PaymentTermMethodDto | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM payment_term_methods WHERE payment_term_method_id = ? LIMIT 1`,
      [paymentTermMethodId]
    );
    return rows[0] ? mapMethodRow(rows[0]) : null;
  },
};
