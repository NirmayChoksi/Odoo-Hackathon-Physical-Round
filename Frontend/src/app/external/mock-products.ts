export interface ProductVariant {
  name: string;
  extraPrice: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  images: string[];
  baseMonthlyPrice: number;
  variants: ProductVariant[];
  tags: string[];
}

export const CATEGORIES = [
  'All',
  'Analytics',
  'Automation',
  'Security',
  'Communication',
  'Storage',
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'DataPulse Analytics',
    description: 'Real-time business intelligence and analytics dashboard with AI insights.',
    category: 'Analytics',
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80',
    ],
    baseMonthlyPrice: 1200,
    variants: [
      { name: 'Starter (5 users)', extraPrice: 0 },
      { name: 'Team (20 users)', extraPrice: 500 },
      { name: 'Enterprise (unlimited)', extraPrice: 1500 },
    ],
    tags: ['analytics', 'AI', 'dashboard'],
  },
  {
    id: 2,
    name: 'AutoFlow Pro',
    description: 'Workflow automation engine that connects your apps and eliminates manual tasks.',
    category: 'Automation',
    images: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80',
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80',
      'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=800&q=80',
    ],
    baseMonthlyPrice: 800,
    variants: [
      { name: 'Basic (100 tasks/mo)', extraPrice: 0 },
      { name: 'Pro (1000 tasks/mo)', extraPrice: 300 },
      { name: 'Unlimited', extraPrice: 800 },
    ],
    tags: ['automation', 'workflow', 'integration'],
  },
  {
    id: 3,
    name: 'ShieldGuard Security',
    description: 'Enterprise-grade cybersecurity suite with real-time threat detection.',
    category: 'Security',
    images: [
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
      'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800&q=80',
      'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80',
    ],
    baseMonthlyPrice: 1500,
    variants: [
      { name: 'Basic Protection', extraPrice: 0 },
      { name: 'Advanced Threat Shield', extraPrice: 600 },
      { name: 'Zero-Trust Enterprise', extraPrice: 2000 },
    ],
    tags: ['security', 'cybersecurity', 'protection'],
  },
  {
    id: 4,
    name: 'MessengerHub',
    description: 'Unified team communication platform with channels, video calls, and file sharing.',
    category: 'Communication',
    images: [
      'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
      'https://images.unsplash.com/photo-1516387938699-a93567ec168e?w=800&q=80',
      'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=800&q=80',
    ],
    baseMonthlyPrice: 600,
    variants: [
      { name: 'Team (10 members)', extraPrice: 0 },
      { name: 'Business (50 members)', extraPrice: 250 },
      { name: 'Corporate (500 members)', extraPrice: 900 },
    ],
    tags: ['communication', 'chat', 'video'],
  },
  {
    id: 5,
    name: 'VaultStore',
    description: 'Secure cloud storage with automatic backup, versioning, and team collaboration.',
    category: 'Storage',
    images: [
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
      'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=800&q=80',
    ],
    baseMonthlyPrice: 400,
    variants: [
      { name: '100 GB', extraPrice: 0 },
      { name: '1 TB', extraPrice: 200 },
      { name: '10 TB', extraPrice: 700 },
    ],
    tags: ['storage', 'backup', 'cloud'],
  },
  {
    id: 6,
    name: 'InsightCRM',
    description: 'AI-powered CRM to manage leads, pipelines, and customer relationships at scale.',
    category: 'Analytics',
    images: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80',
      'https://images.unsplash.com/photo-1531973576160-7125cd663d86?w=800&q=80',
    ],
    baseMonthlyPrice: 950,
    variants: [
      { name: 'Starter (3 users)', extraPrice: 0 },
      { name: 'Growth (15 users)', extraPrice: 400 },
      { name: 'Scale (unlimited)', extraPrice: 1200 },
    ],
    tags: ['CRM', 'sales', 'analytics'],
  },
  {
    id: 7,
    name: 'TaskMaster',
    description: 'Project management and task tracking for agile teams with Kanban & Gantt views.',
    category: 'Automation',
    images: [
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
      'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&q=80',
      'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&q=80',
    ],
    baseMonthlyPrice: 700,
    variants: [
      { name: 'Solo', extraPrice: 0 },
      { name: 'Team (10 users)', extraPrice: 300 },
      { name: 'Organization', extraPrice: 1000 },
    ],
    tags: ['project management', 'agile', 'tasks'],
  },
  {
    id: 8,
    name: 'SecureSign',
    description: 'Digital signature and document management with legally binding e-sign workflows.',
    category: 'Security',
    images: [
      'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
      'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&q=80',
    ],
    baseMonthlyPrice: 500,
    variants: [
      { name: '10 docs/month', extraPrice: 0 },
      { name: '100 docs/month', extraPrice: 200 },
      { name: 'Unlimited', extraPrice: 600 },
    ],
    tags: ['e-signature', 'documents', 'legal'],
  },
];

export function getProductById(id: number): Product | undefined {
  return MOCK_PRODUCTS.find(p => p.id === id);
}

export interface SubscriptionPlan {
  id: 'monthly' | '6-month' | 'yearly';
  label: string;
  total: number;
  perMonth: number;
  discountPct: number;
  billingNote: string;
}

export function calculatePricingPlans(baseMonthly: number): SubscriptionPlan[] {
  return [
    {
      id: 'monthly',
      label: 'Monthly',
      total: baseMonthly,
      perMonth: baseMonthly,
      discountPct: 0,
      billingNote: `Billed ${baseMonthly.toLocaleString()} every month.`
    },
    {
      id: '6-month',
      label: '6 Months',
      total: Math.round(baseMonthly * 6 * 0.9), // 10% off
      perMonth: Math.round(baseMonthly * 0.9),
      discountPct: 10,
      billingNote: `Billed ${Math.round(baseMonthly * 6 * 0.9).toLocaleString()} every 6 months.`
    },
    {
      id: 'yearly',
      label: 'Yearly (Save 30%)',
      total: Math.round(baseMonthly * 12 * 0.7), // 30% off
      perMonth: Math.round(baseMonthly * 0.7),
      discountPct: 30,
      billingNote: `Billed ${Math.round(baseMonthly * 12 * 0.7).toLocaleString()} every year.`
    }
  ];
}

