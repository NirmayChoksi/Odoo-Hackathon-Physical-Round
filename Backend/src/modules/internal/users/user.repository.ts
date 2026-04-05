import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import type { CreateUserBody, PatchUserBody } from "./user.types";
import bcrypt from "bcryptjs";

export const userRepository = {
  async listAll(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.user_id, u.full_name, u.email, u.role_id, r.role_name, u.phone, u.status, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       ORDER BY u.user_id DESC`
    );
    return rows;
  },

  async getById(userId: number): Promise<RowDataPacket | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT u.user_id, u.full_name, u.email, u.role_id, r.role_name, u.phone, u.status, u.created_at
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = ? LIMIT 1`,
      [userId]
    );
    return rows[0] ?? null;
  },

  async insert(body: CreateUserBody): Promise<number> {
    const rounds = 10;
    const password = body.password || "Password@123";
    const passwordHash = await bcrypt.hash(password, rounds);

    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (full_name, email, password_hash, role_id, phone, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [body.fullName, body.email, passwordHash, body.roleId, body.phone ?? null, body.status || "ACTIVE"]
    );
    return res.insertId;
  },

  async update(userId: number, body: PatchUserBody): Promise<boolean> {
    const sets: string[] = [];
    const vals: unknown[] = [];

    if (body.fullName !== undefined) {
      sets.push("full_name = ?");
      vals.push(body.fullName);
    }
    if (body.email !== undefined) {
      sets.push("email = ?");
      vals.push(body.email);
    }
    if (body.password !== undefined) {
      const passwordHash = await bcrypt.hash(body.password, 10);
      sets.push("password_hash = ?");
      vals.push(passwordHash);
    }
    if (body.roleId !== undefined) {
      sets.push("role_id = ?");
      vals.push(body.roleId);
    }
    if (body.phone !== undefined) {
      sets.push("phone = ?");
      vals.push(body.phone || null);
    }
    if (body.status !== undefined) {
      sets.push("status = ?");
      vals.push(body.status);
    }

    if (!sets.length) return false;

    vals.push(userId);
    const [r] = await pool.query<ResultSetHeader>(
      `UPDATE users SET ${sets.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      vals
    );
    return r.affectedRows > 0;
  },

  async delete(userId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(`DELETE FROM users WHERE user_id = ?`, [userId]);
    return r.affectedRows > 0;
  }
};
