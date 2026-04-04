import type { Request } from "express";
import type { CreateContactBody, PatchContactBody } from "./contact.types";

export function parseCreateContact(
  req: Request
): { ok: true; value: CreateContactBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const contactName = b.contactName != null ? String(b.contactName).trim() : "";
  if (!contactName) return { ok: false, errors: ["contactName is required"] };
  return {
    ok: true,
    value: {
      contactName,
      email: b.email != null ? String(b.email).trim() : undefined,
      phone: b.phone != null ? String(b.phone).trim() : undefined,
      designation: b.designation != null ? String(b.designation).trim() : undefined
    }
  };
}

export function parsePatchContact(
  req: Request
): { ok: true; value: PatchContactBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: PatchContactBody = {};
  if (b.contactName !== undefined) out.contactName = String(b.contactName).trim();
  if (b.email !== undefined) out.email = String(b.email).trim();
  if (b.phone !== undefined) out.phone = String(b.phone).trim();
  if (b.designation !== undefined) out.designation = String(b.designation).trim();
  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}
