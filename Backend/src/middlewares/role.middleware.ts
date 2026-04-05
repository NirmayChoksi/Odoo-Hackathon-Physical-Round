import type { NextFunction, Request, Response } from "express";
import type { RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { fail } from "../utils/apiResponse";

/** Role names treated as customer / portal — cannot access /api/internal */
const PORTAL_ROLE_NAMES = new Set(
  ["portal user", "customer", "subscriber", "end user", "portal"].map((s) => s.toLowerCase())
);

function parseUserId(req: Request): number | null {
  const raw = req.headers["x-user-id"];
  const id = typeof raw === "string" ? Number(raw.trim()) : NaN;
  return Number.isInteger(id) && id >= 1 ? id : null;
}

/**
 * Loads staff user from DB (users + roles). Sets req.userId, req.roleName, req.isAdmin.
 * Blocks portal/customer roles from internal APIs.
 */
export async function requireInternalStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = parseUserId(req);
  if (!userId) {
    next(fail("Missing or invalid x-user-id header", 401));
    return;
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.user_id, LOWER(TRIM(r.role_name)) AS role_name
     FROM users u
     INNER JOIN roles r ON r.role_id = u.role_id
     WHERE u.user_id = ? AND u.status = 'ACTIVE'
     LIMIT 1`,
    [userId]
  );
  const row = rows[0];
  if (!row) {
    next(fail("User not found or inactive", 403));
    return;
  }

  const roleName = String(row.role_name ?? "");
  if (PORTAL_ROLE_NAMES.has(roleName)) {
    next(fail("Staff access required", 403));
    return;
  }

  req.userId = row.user_id as number;
  req.roleName = roleName;
  req.isAdmin = roleName === "admin" || roleName.endsWith(" admin") || roleName.startsWith("admin");

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAdmin) {
    next(fail("Admin access required", 403));
    return;
  }
  next();
}

/** Use on routers so async `requireInternalStaff` rejections reach error middleware */
export function requireInternalStaffSync(req: Request, res: Response, next: NextFunction): void {
  void requireInternalStaff(req, res, next).catch(next);
}
