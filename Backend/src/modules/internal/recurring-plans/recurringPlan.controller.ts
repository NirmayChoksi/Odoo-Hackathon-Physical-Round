import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { CreatePlanBody, PatchPlanBody } from "./recurringPlan.types";
import { parseCreatePlan, parsePatchPlan, parsePlanListQuery } from "./recurringPlan.validation";
import { recurringPlanService } from "./recurringPlan.service";

export const recurringPlanController = {
  async list(req: Request, res: Response): Promise<void> {
    const r = parsePlanListQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const data = await recurringPlanService.list(r.value);
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreatePlanBody>(req);
    const data = await recurringPlanService.create(body);
    res.status(201).json(success(data));
  },

  async get(req: Request, res: Response): Promise<void> {
    const planId = Number(req.params.planId);
    if (!Number.isInteger(planId) || planId < 1) throw fail("Invalid planId", 400);
    const data = await recurringPlanService.get(planId);
    res.json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const planId = Number(req.params.planId);
    if (!Number.isInteger(planId) || planId < 1) throw fail("Invalid planId", 400);
    const body = getValidatedBody<PatchPlanBody>(req);
    const data = await recurringPlanService.update(planId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const planId = Number(req.params.planId);
    if (!Number.isInteger(planId) || planId < 1) throw fail("Invalid planId", 400);
    const data = await recurringPlanService.remove(planId);
    res.json(success(data));
  }
};
