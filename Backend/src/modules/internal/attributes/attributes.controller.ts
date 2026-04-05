import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { CreateAttributeBody, PatchAttributeBody } from "./attributes.types";
import { parseCreateAttribute, parsePatchAttribute } from "./attributes.validation";
import { attributesService } from "./attributes.service";

export const attributesController = {
  async list(req: Request, res: Response): Promise<void> {
    const data = await attributesService.list();
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreateAttributeBody>(req);
    const data = await attributesService.create(body);
    res.status(201).json(success(data));
  },

  async get(req: Request, res: Response): Promise<void> {
    const attributeId = Number(req.params.attributeId);
    if (!Number.isInteger(attributeId) || attributeId < 1) throw fail("Invalid attributeId", 400);
    const data = await attributesService.get(attributeId);
    res.json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const attributeId = Number(req.params.attributeId);
    if (!Number.isInteger(attributeId) || attributeId < 1) throw fail("Invalid attributeId", 400);
    const body = getValidatedBody<PatchAttributeBody>(req);
    const data = await attributesService.update(attributeId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const attributeId = Number(req.params.attributeId);
    if (!Number.isInteger(attributeId) || attributeId < 1) throw fail("Invalid attributeId", 400);
    const data = await attributesService.remove(attributeId);
    res.json(success(data));
  }
};
