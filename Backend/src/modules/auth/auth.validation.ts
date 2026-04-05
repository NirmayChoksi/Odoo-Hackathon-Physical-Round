import type { Request } from "express";
import { isValidEmail, isStrongPassword } from "../../shared/validators";
import type { SignupBody, LoginBody, ResetPasswordBody, VerifyResetBody } from "./auth.types";

export function parseSignup(req: Request): { ok: true; value: SignupBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const errors: string[] = [];

  const email = typeof b.email === "string" ? b.email.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const full_name = typeof b.full_name === "string" ? b.full_name.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : null;

  if (!email || !password || !full_name) {
    errors.push("Email, password, and full name are required.");
  } else {
    if (!isValidEmail(email)) {
      errors.push("Invalid email format.");
    }
    const { valid, message } = isStrongPassword(password);
    if (!valid && message) {
      errors.push(message);
    }
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: { email, password, full_name, phone }
  };
}

export function parseLogin(req: Request): { ok: true; value: LoginBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const errors: string[] = [];

  const email = typeof b.email === "string" ? b.email.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";

  if (!email || !password) {
    errors.push("Email and password are required.");
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: { email, password }
  };
}

export function parseResetPassword(req: Request): { ok: true; value: ResetPasswordBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const errors: string[] = [];

  const email = typeof b.email === "string" ? b.email.trim() : "";
  if (!email) {
    errors.push("Email is required.");
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: { email }
  };
}

export function parseVerifyReset(req: Request): { ok: true; value: VerifyResetBody } | { ok: false; errors: string[] } {
  const b = req.body as Record<string, unknown>;
  const errors: string[] = [];

  const email = typeof b.email === "string" ? b.email.trim() : "";
  const token = typeof b.token === "string" ? b.token.trim() : "";
  const newPassword = typeof b.newPassword === "string" ? b.newPassword : "";

  if (!email || !token || !newPassword) {
    errors.push("Email, token, and new password are required.");
  } else {
    const { valid, message } = isStrongPassword(newPassword);
    if (!valid && message) {
      errors.push(message);
    }
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: { email, token, newPassword }
  };
}
