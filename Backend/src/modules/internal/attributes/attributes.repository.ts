import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { offset } from "../../../utils/pagination";
import type { CreateAttributeBody, PatchAttributeBody } from "./attributes.types";

export const attributesRepository = {
  async list(): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM product_attributes ORDER BY attribute_id DESC`
    );
    return rows;
  },

  async getWithValues(attributeId: number): Promise<RowDataPacket[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.*, v.value_id, v.value, v.extra_price
       FROM product_attributes a
       LEFT JOIN product_attribute_values v ON a.attribute_id = v.attribute_id
       WHERE a.attribute_id = ?`,
      [attributeId]
    );
    return rows;
  },

  async insert(name: string): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO product_attributes (name) VALUES (?)`,
      [name]
    );
    return res.insertId;
  },

  async insertValue(attributeId: number, value: string, extraPrice: number): Promise<number> {
    const [res] = await pool.query<ResultSetHeader>(
      `INSERT INTO product_attribute_values (attribute_id, value, extra_price) VALUES (?, ?, ?)`,
      [attributeId, value, extraPrice]
    );
    return res.insertId;
  },

  async update(attributeId: number, name: string): Promise<void> {
    await pool.query(`UPDATE product_attributes SET name = ? WHERE attribute_id = ?`, [name, attributeId]);
  },

  async updateValue(valueId: number, value: string, extraPrice: number): Promise<void> {
    await pool.query(
      `UPDATE product_attribute_values SET value = ?, extra_price = ? WHERE value_id = ?`,
      [value, extraPrice, valueId]
    );
  },

  async deleteValue(valueId: number): Promise<void> {
    await pool.query(`DELETE FROM product_attribute_values WHERE value_id = ?`, [valueId]);
  },

  async delete(attributeId: number): Promise<boolean> {
    const [r] = await pool.query<ResultSetHeader>(
      `DELETE FROM product_attributes WHERE attribute_id = ?`,
      [attributeId]
    );
    return r.affectedRows > 0;
  }
};
