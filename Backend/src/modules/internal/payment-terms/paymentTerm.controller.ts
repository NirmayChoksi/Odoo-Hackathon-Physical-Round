import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type {
  CreatePaymentTermBody,
  PatchPaymentTermBody,
  PaymentTermInstallmentInput,
  PaymentTermMethodInput,
} from "./paymentTerm.types";
import {
  parseAddInstallment,
  parseAddMethod,
  parseCreatePaymentTerm,
  parsePatchInstallment,
  parsePatchPaymentTerm,
  parsePaymentTermListQuery,
} from "./paymentTerm.validation";
import { paymentTermService } from "./paymentTerm.service";

function routeParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

function parseId(param: string | string[] | undefined, label: string): number {
  const n = Number(routeParam(param));
  if (!Number.isInteger(n) || n < 1) throw fail(`Invalid ${label}`, 400);
  return n;
}

export const paymentTermController = {
  async list(req: Request, res: Response): Promise<void> {
    const r = parsePaymentTermListQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const data = await paymentTermService.list(r.value);
    res.json(success(data));
  },

  async get(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.paymentTermId, "paymentTermId");
    const data = await paymentTermService.getPage(id);
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreatePaymentTermBody>(req);
    const data = await paymentTermService.create(body);
    res.status(201).json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.paymentTermId, "paymentTermId");
    const body = getValidatedBody<PatchPaymentTermBody>(req);
    const data = await paymentTermService.update(id, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const id = parseId(req.params.paymentTermId, "paymentTermId");
    const data = await paymentTermService.remove(id);
    res.json(success(data));
  },

  async addInstallment(req: Request, res: Response): Promise<void> {
    const termId = parseId(req.params.paymentTermId, "paymentTermId");
    const body = getValidatedBody<PaymentTermInstallmentInput>(req);
    const data = await paymentTermService.addInstallment(termId, body);
    res.status(201).json(success(data));
  },

  async patchInstallment(req: Request, res: Response): Promise<void> {
    const instId = parseId(req.params.installmentId, "installmentId");
    const body = getValidatedBody<Partial<PaymentTermInstallmentInput>>(req);
    const data = await paymentTermService.patchInstallment(instId, body);
    res.json(success(data));
  },

  async deleteInstallment(req: Request, res: Response): Promise<void> {
    const instId = parseId(req.params.installmentId, "installmentId");
    const data = await paymentTermService.deleteInstallment(instId);
    res.json(success(data));
  },

  async addMethod(req: Request, res: Response): Promise<void> {
    const termId = parseId(req.params.paymentTermId, "paymentTermId");
    const body = getValidatedBody<PaymentTermMethodInput>(req);
    const data = await paymentTermService.addMethod(termId, body);
    res.status(201).json(success(data));
  },

  async deleteMethod(req: Request, res: Response): Promise<void> {
    const mid = parseId(req.params.paymentTermMethodId, "paymentTermMethodId");
    const data = await paymentTermService.deleteMethod(mid);
    res.json(success(data));
  },
};
