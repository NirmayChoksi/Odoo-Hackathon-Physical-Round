import { pool } from '../../config/db';
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { UserRow, PasswordResetRow } from './auth.types';

export const authRepository = {
  async findUserByEmail(email: string): Promise<UserRow | null> {
    const [users] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
    return users.length > 0 ? (users[0] as UserRow) : null;
  },

  async createUser(user: Partial<UserRow>): Promise<void> {
    await pool.query<ResultSetHeader>(
      'INSERT INTO users (full_name, email, password_hash, role_id, phone) VALUES (?, ?, ?, ?, ?)',
      [user.full_name, user.email, user.password_hash, user.role_id, user.phone || null]
    );
  },

  async updateUserPassword(userId: number, passwordHash: string): Promise<void> {
    await pool.query<ResultSetHeader>('UPDATE users SET password_hash = ? WHERE user_id = ?', [passwordHash, userId]);
  },

  async createPasswordReset(reset: Omit<PasswordResetRow, 'reset_id' | 'used_flag'>): Promise<void> {
    await pool.query<ResultSetHeader>(
      'INSERT INTO password_resets (user_id, reset_token, expiry_time) VALUES (?, ?, ?)',
      [reset.user_id, reset.reset_token, reset.expiry_time]
    );
  },

  async findValidResetToken(tokenHash: string, email: string): Promise<{ reset_id: number; user_id: number } | null> {
    const [tokens] = await pool.query<RowDataPacket[]>(
      `SELECT r.reset_id, r.user_id 
       FROM password_resets r 
       JOIN users u ON r.user_id = u.user_id 
       WHERE r.reset_token = ? AND u.email = ? AND r.used_flag = FALSE AND r.expiry_time > NOW()`,
      [tokenHash, email]
    );
    return tokens.length > 0 ? { reset_id: tokens[0].reset_id, user_id: tokens[0].user_id } : null;
  },

  async markResetTokenAsUsed(resetId: number): Promise<void> {
    await pool.query<ResultSetHeader>('UPDATE password_resets SET used_flag = TRUE WHERE reset_id = ?', [resetId]);
  }
};

