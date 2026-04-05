import type { Request } from "express";
import type { CreateUserBody, PatchUserBody } from "./user.types";

export function parseCreateUser(
  req: Request
): { ok: true; value: CreateUserBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const fullName = b.fullName != null ? String(b.fullName).trim() : "";
  const email = b.email != null ? String(b.email).trim() : "";
  const roleId = Number(b.roleId);
  const errors: string[] = [];

  if (!fullName) errors.push("fullName is required");
  if (!email) errors.push("email is required");
  if (isNaN(roleId) || roleId < 1) errors.push("roleId is required and must be a positive number");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      fullName,
      email,
      password: b.password != null ? String(b.password) : undefined,
      roleId,
      phone: b.phone != null ? String(b.phone).trim() : undefined,
      status: (b.status as CreateUserBody['status']) || 'ACTIVE'
    }
  };
}

export function parsePatchUser(
  req: Request
): { ok: true; value: PatchUserBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: PatchUserBody = {};
  if (b.fullName !== undefined) out.fullName = String(b.fullName).trim();
  if (b.email !== undefined) out.email = String(b.email).trim();
  if (b.password !== undefined) out.password = String(b.password);
  if (b.roleId !== undefined) out.roleId = Number(b.roleId);
  if (b.phone !== undefined) out.phone = String(b.phone).trim();
  if (b.status !== undefined) out.status = b.status as CreateUserBody['status'];

  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}
