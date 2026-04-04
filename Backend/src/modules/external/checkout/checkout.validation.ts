import type { Request } from "express";
import type { PlaceOrderBody, SavePaymentBody, SelectAddressBody } from "./checkout.types";
import type { SaveAddressBody } from "../profile/profile.types";

function str(v: unknown, key: string, errors: string[]): string | undefined {
  if (v === undefined || v === null) {
    errors.push(`${key} is required`);
    return undefined;
  }
  const s = String(v).trim();
  if (!s) errors.push(`${key} is required`);
  return s || undefined;
}

export function parseSaveAddress(req: Request): { ok: true; value: SaveAddressBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const errors: string[] = [];
  const fullName = str(b.fullName, "fullName", errors);
  const phone = str(b.phone, "phone", errors);
  const addressLine1 = str(b.addressLine1, "addressLine1", errors);
  const city = str(b.city, "city", errors);
  const state = str(b.state, "state", errors);
  const postalCode = str(b.postalCode, "postalCode", errors);
  const country = str(b.country, "country", errors);
  const addressLine2 = b.addressLine2 != null ? String(b.addressLine2).trim() : undefined;
  const isDefault = Boolean(b.isDefault);
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      fullName: fullName!,
      phone: phone!,
      addressLine1: addressLine1!,
      addressLine2: addressLine2 || undefined,
      city: city!,
      state: state!,
      postalCode: postalCode!,
      country: country!,
      isDefault
    }
  };
}

export function parsePatchAddress(req: Request): { ok: true; value: Partial<SaveAddressBody> & { isDefault?: boolean } } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const out: Partial<SaveAddressBody> & { isDefault?: boolean } = {};
  if (b.fullName !== undefined) out.fullName = String(b.fullName).trim();
  if (b.phone !== undefined) out.phone = String(b.phone).trim();
  if (b.addressLine1 !== undefined) out.addressLine1 = String(b.addressLine1).trim();
  if (b.addressLine2 !== undefined) out.addressLine2 = String(b.addressLine2).trim();
  if (b.city !== undefined) out.city = String(b.city).trim();
  if (b.state !== undefined) out.state = String(b.state).trim();
  if (b.postalCode !== undefined) out.postalCode = String(b.postalCode).trim();
  if (b.country !== undefined) out.country = String(b.country).trim();
  if (b.isDefault !== undefined) out.isDefault = Boolean(b.isDefault);
  if (Object.keys(out).length === 0) {
    return { ok: false, errors: ["At least one field is required"] };
  }
  return { ok: true, value: out };
}

export function parseSavePayment(req: Request): { ok: true; value: SavePaymentBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const errors: string[] = [];
  const paymentMethod = str(b.paymentMethod, "paymentMethod", errors);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { paymentMethod: paymentMethod! } };
}

export function parseSelectAddress(req: Request): { ok: true; value: SelectAddressBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const id = Number(b.addressId);
  if (!Number.isInteger(id) || id < 1) {
    return { ok: false, errors: ["addressId is required"] };
  }
  return { ok: true, value: { addressId: id } };
}

export function parsePlaceOrder(req: Request): { ok: true; value: PlaceOrderBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  let addressId: number | undefined;
  if (b.addressId !== undefined && b.addressId !== null && b.addressId !== "") {
    const id = Number(b.addressId);
    if (!Number.isInteger(id) || id < 1) {
      return { ok: false, errors: ["addressId must be a positive integer"] };
    }
    addressId = id;
  }
  const paymentMethod =
    b.paymentMethod != null && b.paymentMethod !== ""
      ? String(b.paymentMethod).trim()
      : undefined;
  return { ok: true, value: { addressId, paymentMethod } };
}
