/** Internal subscription workspace (staff). Entry: `/subscription` → subscriptions list. */
export const SUBSCRIPTION_APP_BASE = '/subscription' as const;

export const SUBSCRIPTION_APP_PATHS = {
  subscriptions: `${SUBSCRIPTION_APP_BASE}/subscriptions`,
  subscriptionsNew: `${SUBSCRIPTION_APP_BASE}/subscriptions/new`,
  configuration: `${SUBSCRIPTION_APP_BASE}/configuration`,
  products: `${SUBSCRIPTION_APP_BASE}/products`,
  productsNew: `${SUBSCRIPTION_APP_BASE}/products/new`,
  reporting: `${SUBSCRIPTION_APP_BASE}/reporting`,
  users: `${SUBSCRIPTION_APP_BASE}/users`,
  contacts: `${SUBSCRIPTION_APP_BASE}/contacts`,
  quotationTemplate: `${SUBSCRIPTION_APP_BASE}/quotation-template`,
  paymentTerm: `${SUBSCRIPTION_APP_BASE}/payment-term`,
  /** Discount rules list (Configuration). */
  discounts: `${SUBSCRIPTION_APP_BASE}/discounts`,
  /** Create / edit discount (`?id=` when editing). */
  discountNew: `${SUBSCRIPTION_APP_BASE}/discount/new`,
  /** Tax rules list (Configuration). */
  taxes: `${SUBSCRIPTION_APP_BASE}/taxes`,
  /** Create / edit tax (`?id=` when editing). */
  taxNew: `${SUBSCRIPTION_APP_BASE}/tax/new`,
  attribute: `${SUBSCRIPTION_APP_BASE}/attribute`,
  attributeNew: `${SUBSCRIPTION_APP_BASE}/attribute/new`,
  /** List of recurring billing plans (entry from Configuration). */
  recurringPlans: `${SUBSCRIPTION_APP_BASE}/recurring-plans`,
  /** Create / edit plan form (`?id=` when editing). */
  recurringPlanNew: `${SUBSCRIPTION_APP_BASE}/recurring-plan/new`,
} as const;

/** Shared shape for Configuration and Users/Contacts nav dropdown entries. */
export type SubscriptionNavDropdownItem = {
  readonly label: string;
  readonly path: string;
  /** When false, child routes keep this item highlighted (e.g. attribute detail). */
  readonly exactActive: boolean;
};

export const USERS_CONTACTS_DROPDOWN_ITEMS: readonly SubscriptionNavDropdownItem[] = [
  { label: 'Users', path: SUBSCRIPTION_APP_PATHS.users, exactActive: false },
  { label: 'Contacts', path: SUBSCRIPTION_APP_PATHS.contacts, exactActive: false },
];

export const CONFIGURATION_DROPDOWN_ITEMS: readonly SubscriptionNavDropdownItem[] = [
  { label: 'Overview', path: SUBSCRIPTION_APP_PATHS.configuration, exactActive: true },
  { label: 'Attribute', path: SUBSCRIPTION_APP_PATHS.attribute, exactActive: false },
  { label: 'Recurring Plan', path: SUBSCRIPTION_APP_PATHS.recurringPlans, exactActive: false },
  { label: 'Quotation Template', path: SUBSCRIPTION_APP_PATHS.quotationTemplate, exactActive: true },
  { label: 'Payment term', path: SUBSCRIPTION_APP_PATHS.paymentTerm, exactActive: true },
  { label: 'Discount', path: SUBSCRIPTION_APP_PATHS.discounts, exactActive: false },
  { label: 'Taxes', path: SUBSCRIPTION_APP_PATHS.taxes, exactActive: false },
];

/** Cards on the configuration overview — same destinations as the Configuration dropdown. */
export const CONFIGURATION_HUB_MODULES: readonly {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly icon: string;
}[] = [
    {
      title: 'Attributes',
      description: 'Product options, values, and extra pricing.',
      path: SUBSCRIPTION_APP_PATHS.attribute,
      icon: 'tune',
    },
    {
      title: 'Recurring plans',
      description: 'Billing cadence and plan templates.',
      path: SUBSCRIPTION_APP_PATHS.recurringPlans,
      icon: 'event_repeat',
    },
    {
      title: 'Quotation templates',
      description: 'Default layouts for quotes and orders.',
      path: SUBSCRIPTION_APP_PATHS.quotationTemplate,
      icon: 'description',
    },
    {
      title: 'Payment terms',
      description: 'Due rules, installments, methods, and discounts.',
      path: SUBSCRIPTION_APP_PATHS.paymentTerm,
      icon: 'payments',
    },
    {
      title: 'Discounts',
      description: 'Promotional and line discount rules.',
      path: SUBSCRIPTION_APP_PATHS.discounts,
      icon: 'percent',
    },
    {
      title: 'Taxes',
      description: 'Tax rates and groups for subscriptions.',
      path: SUBSCRIPTION_APP_PATHS.taxes,
      icon: 'account_balance',
    },
  ];

export function subscriptionAttributeDetailPath(id: string | number): string {
  return `${SUBSCRIPTION_APP_BASE}/attribute/${id}`;
}
