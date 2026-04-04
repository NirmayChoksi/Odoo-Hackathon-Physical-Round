import type { RowDataPacket } from "mysql2";
import { pool } from "../../../config/db";
import { fail } from "../../../utils/apiResponse";
import { subscriptionRepository } from "./subscription.repository";
import type {
  CreateSubscriptionBody,
  CreateSubscriptionItemBody,
  PatchSubscriptionBody,
  PatchSubscriptionItemBody,
  SubscriptionListQuery
} from "./subscription.types";

async function customerExists(id: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT 1 FROM customers WHERE customer_id = ? LIMIT 1`, [id]);
  return rows.length > 0;
}

async function planExists(id: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT 1 FROM recurring_plans WHERE plan_id = ? LIMIT 1`, [id]);
  return rows.length > 0;
}

export const subscriptionService = {
  async list(q: SubscriptionListQuery) {
    const { rows, total } = await subscriptionRepository.list(q);
    return {
      subscriptions: rows,
      pagination: {
        page: q.page,
        limit: q.limit,
        total,
        totalPages: Math.ceil(total / q.limit) || 0
      }
    };
  },

  async get(subscriptionId: number) {
    const row = await subscriptionRepository.getById(subscriptionId);
    if (!row) throw fail("Subscription not found", 404);
    return row;
  },

  async create(body: CreateSubscriptionBody, userId: number) {
    if (!(await customerExists(body.customerId))) throw fail("Customer not found", 404);
    if (!(await planExists(body.planId))) throw fail("Plan not found", 404);
    const id = await subscriptionRepository.insert(body, userId);
    return subscriptionRepository.getById(id);
  },

  async update(subscriptionId: number, body: PatchSubscriptionBody) {
    if (body.planId && !(await planExists(body.planId))) throw fail("Plan not found", 404);
    const ok = await subscriptionRepository.update(subscriptionId, body);
    if (!ok) throw fail("Subscription not found", 404);
    return subscriptionRepository.getById(subscriptionId);
  },

  async updateStatus(subscriptionId: number, status: string) {
    const ok = await subscriptionRepository.updateStatus(subscriptionId, status);
    if (!ok) throw fail("Subscription not found", 404);
    return subscriptionRepository.getById(subscriptionId);
  },

  async close(subscriptionId: number) {
    const ok = await subscriptionRepository.close(subscriptionId);
    if (!ok) throw fail("Subscription not found", 404);
    return { subscription_id: subscriptionId, closed: true };
  },

  async renew(subscriptionId: number) {
    try {
      return await subscriptionRepository.renew(subscriptionId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "NOT_FOUND") throw fail("Subscription not found", 404);
      if (msg === "CLOSED") throw fail("Cannot renew a closed subscription", 400);
      throw e;
    }
  },

  async listItems(subscriptionId: number) {
    await this.get(subscriptionId);
    return subscriptionRepository.listItems(subscriptionId);
  },

  async addItem(subscriptionId: number, body: CreateSubscriptionItemBody) {
    await this.get(subscriptionId);
    const id = await subscriptionRepository.insertItem(subscriptionId, body);
    return subscriptionRepository.getItem(id);
  },

  async updateItem(subscriptionItemId: number, body: PatchSubscriptionItemBody) {
    const ok = await subscriptionRepository.updateItem(subscriptionItemId, body);
    if (!ok) throw fail("Subscription item not found", 404);
    return subscriptionRepository.getItem(subscriptionItemId);
  },

  async deleteItem(subscriptionItemId: number) {
    const row = await subscriptionRepository.getItem(subscriptionItemId);
    if (!row) throw fail("Subscription item not found", 404);
    await subscriptionRepository.deleteItem(subscriptionItemId);
    return { subscription_item_id: subscriptionItemId, removed: true };
  },

  async generateInvoice(subscriptionId: number) {
    try {
      return await subscriptionRepository.generateInvoiceFromSubscription(subscriptionId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === "NOT_FOUND") throw fail("Subscription not found", 404);
      if (msg === "NO_ITEMS") throw fail("Subscription has no line items", 400);
      throw e;
    }
  }
};
