import { fail } from "../../../utils/apiResponse";
import { recurringPlanRepository } from "./recurringPlan.repository";
import type { CreatePlanBody, PatchPlanBody, PlanListQuery } from "./recurringPlan.types";

export const recurringPlanService = {
  async list(q: PlanListQuery) {
    const { rows, total } = await recurringPlanRepository.list(q);
    return {
      plans: rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit) || 0
      }
    };
  },

  async get(planId: number) {
    const row = await recurringPlanRepository.getById(planId);
    if (!row) throw fail("Plan not found", 404);
    return row;
  },

  async create(body: CreatePlanBody) {
    const id = await recurringPlanRepository.insert(body);
    return recurringPlanRepository.getById(id);
  },

  async update(planId: number, body: PatchPlanBody) {
    const ok = await recurringPlanRepository.update(planId, body);
    if (!ok) throw fail("Plan not found", 404);
    return recurringPlanRepository.getById(planId);
  },

  async remove(planId: number) {
    const ok = await recurringPlanRepository.softDelete(planId);
    if (!ok) throw fail("Plan not found", 404);
    return { plan_id: planId, deactivated: true };
  }
};
