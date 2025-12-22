import Stripe from 'stripe'

// Lazy-initialized Stripe client (for build compatibility)
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return _stripe
}

// For backwards compatibility in existing code
export const stripe = {
  get webhooks() { return getStripe().webhooks },
  get customers() { return getStripe().customers },
  get subscriptions() { return getStripe().subscriptions },
  get checkout() { return getStripe().checkout },
  get billingPortal() { return getStripe().billingPortal },
}

// Plan configuration
export const PLANS = {
  CORE: {
    name: 'Core',
    description: 'Pour les petites agences',
    features: [
      'Jusqu\'a 3 utilisateurs',
      'Missions illimitees',
      'Base candidats',
      'Import CSV',
      'Pipeline management',
      'Portail candidat',
      'Shortlists clients',
      'Fonctions IA basiques',
      'Support email',
    ],
    limits: {
      maxUsers: 3,
      aiCallsPerDay: 50,
      customQuestionnaires: false,
      apiAccess: false,
    },
  },
  PRO: {
    name: 'Pro',
    description: 'Pour les agences en croissance',
    features: [
      'Utilisateurs illimites',
      'Tout ce qui est dans Core',
      'Fonctions IA avancees',
      'Questionnaires personnalises',
      'Dashboard analytics',
      'Acces API',
      'Support prioritaire',
      'Onboarding dedie',
    ],
    limits: {
      maxUsers: Infinity,
      aiCallsPerDay: 500,
      customQuestionnaires: true,
      apiAccess: true,
    },
  },
  WHITE_LABEL: {
    name: 'White-label',
    description: 'Votre marque, notre plateforme',
    features: [
      'Tout ce qui est dans Pro',
      'Branding personnalise',
      'Domaine personnalise',
      'Portails white-label',
      'Integrations personnalisees',
      'SLA garanti',
      'Account manager dedie',
      'Sessions de formation',
    ],
    limits: {
      maxUsers: Infinity,
      aiCallsPerDay: Infinity,
      customQuestionnaires: true,
      apiAccess: true,
    },
  },
} as const

// Pricing configuration
export const PRICING = {
  CORE: {
    monthly: {
      amount: 4900, // 49 EUR in cents
      priceId: process.env.STRIPE_PRICE_CORE_MONTHLY || '',
    },
    annual: {
      amount: 49000, // 490 EUR in cents (2 months free)
      priceId: process.env.STRIPE_PRICE_CORE_ANNUAL || '',
    },
  },
  PRO: {
    monthly: {
      amount: 8900, // 89 EUR in cents
      priceId: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    },
    annual: {
      amount: 89000, // 890 EUR in cents (2 months free)
      priceId: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
    },
  },
} as const

export type PlanType = keyof typeof PLANS
export type BillingPeriodType = 'monthly' | 'annual'

// Helper to get price ID
export function getPriceId(plan: 'CORE' | 'PRO', period: BillingPeriodType): string {
  return PRICING[plan][period].priceId
}

// Helper to format price
export function formatPrice(amountInCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountInCents / 100)
}

// Calculate savings for annual billing
export function calculateAnnualSavings(plan: 'CORE' | 'PRO'): {
  monthlyTotal: number
  annualTotal: number
  savings: number
  savingsPercent: number
} {
  const monthlyTotal = PRICING[plan].monthly.amount * 12
  const annualTotal = PRICING[plan].annual.amount
  const savings = monthlyTotal - annualTotal
  const savingsPercent = Math.round((savings / monthlyTotal) * 100)

  return {
    monthlyTotal,
    annualTotal,
    savings,
    savingsPercent,
  }
}

// Stripe webhook event types we handle
export const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
] as const

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number]

