import type { Request } from "express";
import { num, str } from "../../../utils/validation";
import type { CreateAttributeBody, PatchAttributeBody } from "./attributes.types";

export function parseCreateAttribute(req: Request): { ok: true; value: CreateAttributeBody } | { ok: false; errors: string[] } {
  const b = req.body;
  const name = str(b.name);
  if (!name) return { ok: false, errors: ["name is required"] };

  const values: { valueName: string; extraPrice: number }[] = [];
  if (Array.isArray(b.values)) {
    for (const v of b.values) {
      if (v.valueName) {
        values.push({
          valueName: str(v.valueName)!,
          extraPrice: num(v.extraPrice) || 0
        });
      }
    }
  }

  return {
    ok: true,
    value: { name, values }
  };
}

export function parsePatchAttribute(req: Request): { ok: true; value: PatchAttributeBody } | { ok: false; errors: string[] } {
  const b = req.body;
  const out: PatchAttributeBody = {};

  if (b.name !== undefined) out.name = str(b.name);
  if (Array.isArray(b.values)) {
    out.values = b.values
      .filter((v: any) => v.valueName)
      .map((v: any) => ({
        valueName: str(v.valueName)!,
        extraPrice: num(v.extraPrice) || 0
      }));
  }

  if (Object.keys(out).length === 0) return { ok: false, errors: ["At least one field is required"] };
  return { ok: true, value: out };
}
