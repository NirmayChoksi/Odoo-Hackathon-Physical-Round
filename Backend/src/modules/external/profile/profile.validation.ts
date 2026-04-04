import type { Request } from "express";
import type { UpdateProfileBody } from "./profile.types";

export function parseUpdateProfile(
  req: Request
): { ok: true; value: UpdateProfileBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: UpdateProfileBody = {};
  if (b.fullName !== undefined) out.fullName = String(b.fullName).trim();
  if (b.email !== undefined) out.email = String(b.email).trim();
  if (b.phone !== undefined) {
    if (b.phone === null) out.phone = "";
    else out.phone = String(b.phone).trim();
  }
  if (Object.keys(out).length === 0) {
    return { ok: false, errors: ["At least one field is required"] };
  }
  if (out.fullName !== undefined && !out.fullName) {
    return { ok: false, errors: ["fullName cannot be empty"] };
  }
  if (out.email !== undefined) {
    if (!out.email) return { ok: false, errors: ["email cannot be empty"] };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) {
      return { ok: false, errors: ["Invalid email"] };
    }
  }
  return { ok: true, value: out };
}

export { parsePatchAddress, parseSaveAddress } from "../checkout/checkout.validation";
