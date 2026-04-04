import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import type { SaveAddressBody } from "./profile.types";

export const profileRepository = {
  async getProfile(userId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT user_id, full_name, email, phone, role_id, status, created_at
       FROM users WHERE user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] ?? null;
  },

  async updateProfile(
    userId: number,
    fields: { full_name?: string; email?: string; phone?: string | null }
  ): Promise<void> {
    const parts: string[] = [];
    const vals: unknown[] = [];
    if (fields.full_name !== undefined) {
      parts.push("full_name = ?");
      vals.push(fields.full_name);
    }
    if (fields.email !== undefined) {
      parts.push("email = ?");
      vals.push(fields.email);
    }
    if (fields.phone !== undefined) {
      parts.push("phone = ?");
      vals.push(fields.phone);
    }
    if (!parts.length) return;
    vals.push(userId);
    await pool.query(`UPDATE users SET ${parts.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`, vals);
  },

  async emailTakenByOther(email: string, excludeUserId: number): Promise<boolean> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 1 FROM users WHERE email = ? AND user_id <> ? LIMIT 1`,
      [email, excludeUserId]
    );
    return rows.length > 0;
  },

  async listAddresses(userId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, address_id DESC`,
      [userId]
    );
    return rows;
  },

  async insertAddress(userId: number, body: SaveAddressBody): Promise<number> {
    const conn = await pool.getConnection();
    try {
      if (body.isDefault) {
        await conn.query(`UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`, [userId]);
      }
      const [res] = await conn.query<ResultSetHeader>(
        `INSERT INTO user_addresses (
          user_id, full_name, phone, address_line1, address_line2, city, state, postal_code, country, is_default
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          body.fullName,
          body.phone,
          body.addressLine1,
          body.addressLine2 ?? null,
          body.city,
          body.state,
          body.postalCode,
          body.country,
          body.isDefault ? 1 : 0
        ]
      );
      return res.insertId;
    } finally {
      conn.release();
    }
  },

  async getAddressForUser(addressId: number, userId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM user_addresses WHERE address_id = ? AND user_id = ? LIMIT 1`,
      [addressId, userId]
    );
    return rows[0] ?? null;
  },

  async updateAddress(
    userId: number,
    addressId: number,
    body: Partial<SaveAddressBody> & { isDefault?: boolean }
  ): Promise<boolean> {
    const existing = await this.getAddressForUser(addressId, userId);
    if (!existing) return false;

    const conn = await pool.getConnection();
    try {
      if (body.isDefault) {
        await conn.query(`UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`, [userId]);
      }
      const sets: string[] = [];
      const vals: unknown[] = [];
      const add = (col: string, v: unknown) => {
        sets.push(`${col} = ?`);
        vals.push(v);
      };
      if (body.fullName !== undefined) add("full_name", body.fullName);
      if (body.phone !== undefined) add("phone", body.phone);
      if (body.addressLine1 !== undefined) add("address_line1", body.addressLine1);
      if (body.addressLine2 !== undefined) add("address_line2", body.addressLine2);
      if (body.city !== undefined) add("city", body.city);
      if (body.state !== undefined) add("state", body.state);
      if (body.postalCode !== undefined) add("postal_code", body.postalCode);
      if (body.country !== undefined) add("country", body.country);
      if (body.isDefault !== undefined) add("is_default", body.isDefault ? 1 : 0);
      if (sets.length) {
        vals.push(addressId, userId);
        await conn.query(
          `UPDATE user_addresses SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE address_id = ? AND user_id = ?`,
          vals
        );
      }
      return true;
    } finally {
      conn.release();
    }
  },

  async deleteAddress(userId: number, addressId: number): Promise<boolean> {
    const [res] = await pool.query<ResultSetHeader>(
      `DELETE FROM user_addresses WHERE address_id = ? AND user_id = ?`,
      [addressId, userId]
    );
    return res.affectedRows > 0;
  },

  async setDefaultAddress(userId: number, addressId: number): Promise<boolean> {
    const ok = await this.getAddressForUser(addressId, userId);
    if (!ok) return false;
    const conn = await pool.getConnection();
    try {
      await conn.query(`UPDATE user_addresses SET is_default = 0 WHERE user_id = ?`, [userId]);
      await conn.query(`UPDATE user_addresses SET is_default = 1, updated_at = CURRENT_TIMESTAMP WHERE address_id = ?`, [
        addressId
      ]);
      return true;
    } finally {
      conn.release();
    }
  }
};
