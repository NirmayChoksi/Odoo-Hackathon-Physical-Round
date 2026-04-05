import { fail } from "../../../utils/apiResponse";
import { contactRepository } from "./contact.repository";
import type { CreateContactBody, PatchContactBody } from "./contact.types";

export const contactService = {
  async list() {
    return contactRepository.listAll();
  },

  async get(id: number) {
    const c = await contactRepository.getById(id);
    if (!c) throw fail("Contact not found", 404);
    return c;
  },

  async create(body: CreateContactBody) {
    const id = await contactRepository.insert(body.customerId, body);
    return contactRepository.getById(id);
  },

  async update(contactId: number, body: PatchContactBody) {
    const ok = await contactRepository.update(contactId, body);
    if (!ok) throw fail("Contact not found", 404);
    return contactRepository.getById(contactId);
  },

  async remove(contactId: number) {
    const ok = await contactRepository.delete(contactId);
    if (!ok) throw fail("Contact not found", 404);
    return { contact_id: contactId, removed: true };
  }
};
