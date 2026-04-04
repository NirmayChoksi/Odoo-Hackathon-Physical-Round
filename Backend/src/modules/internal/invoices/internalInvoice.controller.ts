import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { CreateInternalInvoiceBody } from "./internalInvoice.types";
import { parseCreateInternalInvoice, parseInternalInvoiceListQuery } from "./internalInvoice.validation";
import { internalInvoiceService } from "./internalInvoice.service";

export const internalInvoiceController = {
  async list(req: Request, res: Response): Promise<void> {
    const r = parseInternalInvoiceListQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const data = await internalInvoiceService.list(r.value);
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreateInternalInvoiceBody>(req);
    const data = await internalInvoiceService.createFromSubscription(body);
    res.status(201).json(success(data));
  },

  async print(req: Request, res: Response): Promise<void> {
    const invoiceId = Number(req.params.invoiceId);
    if (!Number.isInteger(invoiceId) || invoiceId < 1) throw fail("Invalid invoiceId", 400);
    const data = await internalInvoiceService.print(invoiceId);
    res.json(success(data));
  },

  async confirm(req: Request, res: Response): Promise<void> {
    const invoiceId = Number(req.params.invoiceId);
    if (!Number.isInteger(invoiceId) || invoiceId < 1) throw fail("Invalid invoiceId", 400);
    const data = await internalInvoiceService.confirm(invoiceId);
    res.json(success(data));
  },

  async cancel(req: Request, res: Response): Promise<void> {
    const invoiceId = Number(req.params.invoiceId);
    if (!Number.isInteger(invoiceId) || invoiceId < 1) throw fail("Invalid invoiceId", 400);
    const data = await internalInvoiceService.cancel(invoiceId);
    res.json(success(data));
  },

  async send(req: Request, res: Response): Promise<void> {
    const invoiceId = Number(req.params.invoiceId);
    if (!Number.isInteger(invoiceId) || invoiceId < 1) throw fail("Invalid invoiceId", 400);
    const data = await internalInvoiceService.send(invoiceId);
    res.json(success(data));
  },

  async get(req: Request, res: Response): Promise<void> {
    const invoiceId = Number(req.params.invoiceId);
    if (!Number.isInteger(invoiceId) || invoiceId < 1) throw fail("Invalid invoiceId", 400);
    const data = await internalInvoiceService.getDetail(invoiceId);
    res.json(success(data));
  }
};
