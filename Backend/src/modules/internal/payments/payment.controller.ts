import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { RecordPaymentBody } from "./payment.types";
import { parsePaymentListQuery, parseRecordPayment } from "./payment.validation";
import { paymentService } from "./payment.service";

export const paymentController = {
  async outstanding(req: Request, res: Response): Promise<void> {
    const data = await paymentService.outstandingInvoices();
    res.json(success(data));
  },

  async summary(_req: Request, res: Response): Promise<void> {
    const data = await paymentService.summary();
    res.json(success(data));
  },

  async list(req: Request, res: Response): Promise<void> {
    const r = parsePaymentListQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const data = await paymentService.list(r.value);
    res.json(success(data));
  },

  async get(req: Request, res: Response): Promise<void> {
    const paymentId = Number(req.params.paymentId);
    if (!Number.isInteger(paymentId) || paymentId < 1) throw fail("Invalid paymentId", 400);
    const data = await paymentService.get(paymentId);
    res.json(success(data));
  },

  async record(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<RecordPaymentBody>(req);
    const data = await paymentService.record(body);
    res.status(201).json(success(data));
  }
};
