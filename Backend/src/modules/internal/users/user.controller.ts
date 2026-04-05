import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import { userService } from "./user.service";
import type { CreateUserBody, PatchUserBody } from "./user.types";

export const userController = {
  async list(req: Request, res: Response): Promise<void> {
    const data = await userService.list();
    res.json(success(data));
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) throw fail("Invalid userId", 400);
    const data = await userService.get(userId);
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreateUserBody>(req);
    const data = await userService.create(body);
    res.status(201).json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) throw fail("Invalid userId", 400);
    const body = getValidatedBody<PatchUserBody>(req);
    const data = await userService.update(userId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId < 1) throw fail("Invalid userId", 400);
    const data = await userService.remove(userId);
    res.json(success(data));
  }
};
