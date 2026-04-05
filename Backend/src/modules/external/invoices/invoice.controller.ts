import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { InvoicePaymentBody } from "./invoice.types";
import { invoiceService } from "./invoice.service";

export const invoiceController = {
  async detail(req: Request, res: Response): Promise<void> {
    const invoiceNumber = String(req.params.invoiceNumber || "").trim();
    if (!invoiceNumber) throw fail("invoiceNumber is required", 400);
    const data = await invoiceService.getDetail(invoiceNumber, req.userId!);
    res.json(success(data));
  },

  async download(req: Request, res: Response): Promise<void> {
    const invoiceNumber = String(req.params.invoiceNumber || "").trim();
    if (!invoiceNumber) throw fail("invoiceNumber is required", 400);
    const data = await invoiceService.getDetail(invoiceNumber, req.userId!);
    res.json(success({ ...data, download: true }));
  },

  async pay(req: Request, res: Response): Promise<void> {
    const invoiceNumber = String(req.params.invoiceNumber || "").trim();
    if (!invoiceNumber) throw fail("invoiceNumber is required", 400);
    const body = getValidatedBody<InvoicePaymentBody>(req);
    const r = await invoiceService.pay(invoiceNumber, req.userId!, body.paymentMethod);
    res.status(201).json(success(r));
  }
};
