import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { PatchContactBody } from "./contact.types";
import { contactService } from "./contact.service";

export const contactController = {
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
