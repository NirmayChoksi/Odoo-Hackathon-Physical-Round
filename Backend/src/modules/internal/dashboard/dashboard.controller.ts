import type { Request, Response } from "express";
import { success } from "../../../utils/apiResponse";
import { dashboardService } from "./dashboard.service";

export const dashboardController = {
  async summary(_req: Request, res: Response): Promise<void> {
    const data = await dashboardService.summary();
    res.json(success(data));
  },

  async charts(_req: Request, res: Response): Promise<void> {
    const data = await dashboardService.charts();
    res.json(success(data));
  }
};
