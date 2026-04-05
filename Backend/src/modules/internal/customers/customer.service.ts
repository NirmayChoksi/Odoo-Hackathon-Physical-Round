import { fail } from "../../../utils/apiResponse";
import { contactRepository } from "../contacts/contact.repository";
import { customerRepository } from "./customer.repository";
import type { CreateCustomerBody, CustomerListQuery, PatchCustomerBody } from "./customer.types";

export const customerService = {
  async list(q: CustomerListQuery) {
    const { rows, total } = await customerRepository.list(q);
    return {
      customers: rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit) || 0
      }
    };
  },

  async get(customerId: number) {
    const row = await customerRepository.getById(customerId);
    if (!row) throw fail("Customer not found", 404);
    return row;
  },

  async create(body: CreateCustomerBody) {
    const id = await customerRepository.insert(body);
    return customerRepository.getById(id);
  },

  async update(customerId: number, body: PatchCustomerBody) {
    const ok = await customerRepository.update(customerId, body);
    if (!ok) throw fail("Customer not found", 404);
    return customerRepository.getById(customerId);
  },

  async remove(customerId: number) {
    const ok = await customerRepository.softDelete(customerId);
    if (!ok) throw fail("Customer not found", 404);
    return { customer_id: customerId, deactivated: true };
  },

  async listContacts(customerId: number) {
    await this.get(customerId);
    return contactRepository.listByCustomer(customerId);
  },

  async addContact(customerId: number, body: { contactName: string; email?: string; phone?: string; designation?: string }) {
    await this.get(customerId);
    const id = await contactRepository.insert(customerId, body);
    return contactRepository.getById(id);
  }
};
