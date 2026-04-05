import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { PatchSubscriptionItemBody } from "../subscriptions/subscription.types";
import { parsePatchSubscriptionItem } from "../subscriptions/subscription.validation";
import { subscriptionService } from "../subscriptions/subscription.service";

export const subscriptionItemController = {
  async update(req: Request, res: Response): Promise<void> {
    const subscriptionItemId = Number(req.params.subscriptionItemId);
    if (!Number.isInteger(subscriptionItemId) || subscriptionItemId < 1) {
      throw fail("Invalid subscriptionItemId", 400);
    }
    const body = getValidatedBody<PatchSubscriptionItemBody>(req);
    const data = await subscriptionService.updateItem(subscriptionItemId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const subscriptionItemId = Number(req.params.subscriptionItemId);
    if (!Number.isInteger(subscriptionItemId) || subscriptionItemId < 1) {
      throw fail("Invalid subscriptionItemId", 400);
    }
    const data = await subscriptionService.deleteItem(subscriptionItemId);
    res.json(success(data));
  }
};
