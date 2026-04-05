import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import { contactService } from "./contact.service";
import type { CreateContactBody, PatchContactBody } from "./contact.types";

export const contactController = {
  async list(req: Request, res: Response): Promise<void> {
    const data = await contactService.list();
    res.json(success(data));
  },

  async getOne(req: Request, res: Response): Promise<void> {
    const contactId = Number(req.params.contactId);
    if (!Number.isInteger(contactId) || contactId < 1) throw fail("Invalid contactId", 400);
    const data = await contactService.get(contactId);
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreateContactBody>(req);
    const data = await contactService.create(body);
    res.status(201).json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const contactId = Number(req.params.contactId);
    if (!Number.isInteger(contactId) || contactId < 1) throw fail("Invalid contactId", 400);
    const body = getValidatedBody<PatchContactBody>(req);
    const data = await contactService.update(contactId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const contactId = Number(req.params.contactId);
    if (!Number.isInteger(contactId) || contactId < 1) throw fail("Invalid contactId", 400);
    const data = await contactService.remove(contactId);
    res.json(success(data));
  }
};
