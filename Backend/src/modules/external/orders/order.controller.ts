import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import { orderService } from "./order.service";
import { parseOrderListQuery, parseOrderPayment } from "./order.validation";

export const orderController = {
  async list(req: Request, res: Response): Promise<void> {
    const r = parseOrderListQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const data = await orderService.list(req.userId!, r.value);
    res.json(success(data));
  },

  async invoicesForOrder(req: Request, res: Response): Promise<void> {
    const orderNumber = String(req.params.orderNumber || "").trim();
    if (!orderNumber) throw fail("orderNumber is required", 400);
    const data = await orderService.listInvoices(orderNumber, req.userId!);
    res.json(success(data));
  },

  async download(req: Request, res: Response): Promise<void> {
    const orderNumber = String(req.params.orderNumber || "").trim();
    if (!orderNumber) throw fail("orderNumber is required", 400);
    const data = await orderService.download(orderNumber, req.userId!);
    res.json(success(data));
  },

  async renew(req: Request, res: Response): Promise<void> {
    const orderNumber = String(req.params.orderNumber || "").trim();
    if (!orderNumber) throw fail("orderNumber is required", 400);
    const data = await orderService.renew(orderNumber, req.userId!);
    res.status(201).json(success(data));
  },

  async close(req: Request, res: Response): Promise<void> {
    const orderNumber = String(req.params.orderNumber || "").trim();
    if (!orderNumber) throw fail("orderNumber is required", 400);
    const data = await orderService.close(orderNumber, req.userId!);
    res.json(success(data));
  },

  async pay(req: Request, res: Response): Promise<void> {
    const orderNumber = String(req.params.orderNumber || "").trim();
    if (!orderNumber) throw fail("orderNumber is required", 400);
    const body = getValidatedBody<{ paymentMethod: string }>(req);
    const data = await orderService.pay(orderNumber, req.userId!, body.paymentMethod);
    res.status(201).json(success(data));
  },

  async detail(req: Request, res: Response): Promise<void> {
    const orderNumber = String(req.params.orderNumber || "").trim();
    if (!orderNumber) throw fail("orderNumber is required", 400);
    const data = await orderService.getDetail(orderNumber, req.userId!);
    res.json(success(data));
  }
};
