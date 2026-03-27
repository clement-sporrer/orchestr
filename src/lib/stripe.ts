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

// Pricing configuration (4-week billing cycles = 13 periods per year)
// Core: 45€ × 13 = 585€/year | Pro: 82€ × 13 = 1066€/year
export const PRICING = {
  CORE: {
    fourWeeks: {
      amount: 4500, // 45 EUR in cents per 4-week period
      priceId: process.env.STRIPE_PRICE_CORE_4WEEKS || '',
    },
    annual: {
      amount: 49900, // 499 EUR in cents (~14% off vs 4-week)
      priceId: process.env.STRIPE_PRICE_CORE_ANNUAL || '',
    },
  },
  PRO: {
    fourWeeks: {
      amount: 8200, // 82 EUR in cents per 4-week period
      priceId: process.env.STRIPE_PRICE_PRO_4WEEKS || '',
    },
    annual: {
      amount: 89900, // 899 EUR in cents (~16% off vs 4-week)
      priceId: process.env.STRIPE_PRICE_PRO_ANNUAL || '',
    },
  },
} as const

export type PlanType = keyof typeof PLANS
export type BillingPeriodType = 'fourWeeks' | 'annual'

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

// Calculate savings for annual billing (vs 13 × 4-week periods)
export function calculateAnnualSavings(plan: 'CORE' | 'PRO'): {
  fourWeeksTotal: number
  annualTotal: number
  savings: number
  savingsPercent: number
} {
  const fourWeeksTotal = PRICING[plan].fourWeeks.amount * 13 // 13 periods per year
  const annualTotal = PRICING[plan].annual.amount
  const savings = fourWeeksTotal - annualTotal
  const savingsPercent = Math.round((savings / fourWeeksTotal) * 100)

  return {
    fourWeeksTotal,
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
