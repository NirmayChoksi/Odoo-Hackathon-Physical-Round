import type { NextFunction, Request, Response } from "express";
import { fail } from "../utils/apiResponse";

/**
 * MVP: identifies the user via `x-user-id` header (numeric).
 * Replace with JWT verification in production.
 */
export function requireUser(req: Request, _res: Response, next: NextFunction): void {
  const raw = req.headers["x-user-id"];
  const id = typeof raw === "string" ? Number(raw.trim()) : NaN;
  if (!Number.isInteger(id) || id < 1) {
    next(fail("Missing or invalid x-user-id header", 401));
    return;
  }
  req.userId = id;
  next();
}
