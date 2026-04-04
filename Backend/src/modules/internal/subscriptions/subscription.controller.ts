import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type {
  CreateSubscriptionBody,
  CreateSubscriptionItemBody,
  PatchSubscriptionBody,
  PatchSubscriptionStatusBody
} from "./subscription.types";
import {
  parseCreateSubscription,
  parseCreateSubscriptionItem,
  parsePatchSubscription,
  parsePatchSubscriptionStatus,
  parseSubscriptionListQuery
} from "./subscription.validation";
import { subscriptionService } from "./subscription.service";

export const subscriptionController = {
  async list(req: Request, res: Response): Promise<void> {
    const r = parseSubscriptionListQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const data = await subscriptionService.list(r.value);
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreateSubscriptionBody>(req);
    const data = await subscriptionService.create(body, req.userId!);
    res.status(201).json(success(data));
  },

  async listItems(req: Request, res: Response): Promise<void> {
    const subscriptionId = Number(req.params.subscriptionId);
    if (!Number.isInteger(subscriptionId) || subscriptionId < 1) throw fail("Invalid subscriptionId", 400);
    const items = await subscriptionService.listItems(subscriptionId);
    res.json(success({ items }));
  },

  async addItem(req: Request, res: Response): Promise<void> {
    const subscriptionId = Number(req.params.subscriptionId);
    if (!Number.isInteger(subscriptionId) || subscriptionId < 1) throw fail("Invalid subscriptionId", 400);
    const body = getValidatedBody<CreateSubscriptionItemBody>(req);
    const data = await subscriptionService.addItem(subscriptionId, body);
    res.status(201).json(success(data));
  },

  async patchStatus(req: Request, res: Response): Promise<void> {
    const subscriptionId = Number(req.params.subscriptionId);
    if (!Number.isInteger(subscriptionId) || subscriptionId < 1) throw fail("Invalid subscriptionId", 400);
    const body = getValidatedBody<PatchSubscriptionStatusBody>(req);
    const data = await subscriptionService.updateStatus(subscriptionId, body.status);
    res.json(success(data));
  },

  async renew(req: Request, res: Response): Promise<void> {
    const subscriptionId = Number(req.params.subscriptionId);
    if (!Number.isInteger(subscriptionId) || subscriptionId < 1) throw fail("Invalid subscriptionId", 400);
    const data = await subscriptionService.renew(subscriptionId);
    res.status(201).json(success(data));
  },

  async close(req: Request, res: Response): Promise<void> {
    const subscriptionId = Number(req.params.subscriptionId);
    if (!Number.isInteger(subscriptionId) || subscriptionId < 1) throw fail("Invalid subscriptionId", 400);
    const data = await subscriptionService.close(subscriptionId);
    res.json(success(data));
  },

  async generateInvoice(req: Request, res: Response): Promise<void> {
    const subscriptionId = Number(req.params.subscriptionId);
    if (!Number.isInteger(subscriptionId) || subscriptionId < 1) throw fail("Invalid subscriptionId", 400);
    const data = await subscriptionService.generateInvoice(subscriptionId);
    res.status(201).json(success(data));
  },

  async get(req: Request, res: Response): Promise<void> {
    const subscriptionId = Number(req.params.subscriptionId);
    if (!Number.isInteger(subscriptionId) || subscriptionId < 1) throw fail("Invalid subscriptionId", 400);
    const data = await subscriptionService.get(subscriptionId);
    res.json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const subscriptionId = Number(req.params.subscriptionId);
    if (!Number.isInteger(subscriptionId) || subscriptionId < 1) throw fail("Invalid subscriptionId", 400);
    const body = getValidatedBody<PatchSubscriptionBody>(req);
    const data = await subscriptionService.update(subscriptionId, body);
    res.json(success(data));
  }
};
