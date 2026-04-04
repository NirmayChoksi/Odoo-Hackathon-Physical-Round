/** Internal subscription workspace (staff). Entry: `/subscription` → subscriptions list. */
export const SUBSCRIPTION_APP_BASE = '/subscription' as const;

export const SUBSCRIPTION_APP_PATHS = {
  subscriptions: `${SUBSCRIPTION_APP_BASE}/subscriptions`,
  subscriptionsNew: `${SUBSCRIPTION_APP_BASE}/subscriptions/new`,
  configuration: `${SUBSCRIPTION_APP_BASE}/configuration`,
  products: `${SUBSCRIPTION_APP_BASE}/products`,
  reporting: `${SUBSCRIPTION_APP_BASE}/reporting`,
  users: `${SUBSCRIPTION_APP_BASE}/users`,
  quotationTemplate: `${SUBSCRIPTION_APP_BASE}/quotation-template`,
  paymentTerm: `${SUBSCRIPTION_APP_BASE}/payment-term`,
  discount: `${SUBSCRIPTION_APP_BASE}/discount`,
  taxes: `${SUBSCRIPTION_APP_BASE}/taxes`,
  attribute: `${SUBSCRIPTION_APP_BASE}/attribute`,
  attributeNew: `${SUBSCRIPTION_APP_BASE}/attribute/new`,
  recurringPlan: `${SUBSCRIPTION_APP_BASE}/recurring-plan`,
} as const;

export function subscriptionAttributeDetailPath(id: string | number): string {
  return `${SUBSCRIPTION_APP_BASE}/attribute/${id}`;
}
