import type { Request, Response } from "express";
import { fail, success } from "../../../utils/apiResponse";
import { getValidatedBody } from "../../../middlewares/validate.middleware";
import type { CreateCustomerBody, PatchCustomerBody } from "./customer.types";
import { parseCustomerListQuery, parseCreateCustomer, parsePatchCustomer } from "./customer.validation";
import { customerService } from "./customer.service";
import type { CreateContactBody } from "../contacts/contact.types";
import { parseCreateContact } from "../contacts/contact.validation";

export const customerController = {
  async list(req: Request, res: Response): Promise<void> {
    const r = parseCustomerListQuery(req);
    if (!r.ok) {
      res.status(400).json({ success: false, message: "Invalid query", errors: r.errors });
      return;
    }
    const data = await customerService.list(r.value);
    res.json(success(data));
  },

  async create(req: Request, res: Response): Promise<void> {
    const body = getValidatedBody<CreateCustomerBody>(req);
    const data = await customerService.create(body);
    res.status(201).json(success(data));
  },

  async listContacts(req: Request, res: Response): Promise<void> {
    const customerId = Number(req.params.customerId);
    if (!Number.isInteger(customerId) || customerId < 1) throw fail("Invalid customerId", 400);
    const rows = await customerService.listContacts(customerId);
    res.json(success({ contacts: rows }));
  },

  async addContact(req: Request, res: Response): Promise<void> {
    const customerId = Number(req.params.customerId);
    if (!Number.isInteger(customerId) || customerId < 1) throw fail("Invalid customerId", 400);
    const body = getValidatedBody<CreateContactBody>(req);
    const data = await customerService.addContact(customerId, body);
    res.status(201).json(success(data));
  },

  async get(req: Request, res: Response): Promise<void> {
    const customerId = Number(req.params.customerId);
    if (!Number.isInteger(customerId) || customerId < 1) throw fail("Invalid customerId", 400);
    const data = await customerService.get(customerId);
    res.json(success(data));
  },

  async update(req: Request, res: Response): Promise<void> {
    const customerId = Number(req.params.customerId);
    if (!Number.isInteger(customerId) || customerId < 1) throw fail("Invalid customerId", 400);
    const body = getValidatedBody<PatchCustomerBody>(req);
    const data = await customerService.update(customerId, body);
    res.json(success(data));
  },

  async remove(req: Request, res: Response): Promise<void> {
    const customerId = Number(req.params.customerId);
    if (!Number.isInteger(customerId) || customerId < 1) throw fail("Invalid customerId", 400);
    const data = await customerService.remove(customerId);
    res.json(success(data));
  }
};
