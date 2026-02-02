/**
 * Environment Variable Validation
 * 
 * This module validates required environment variables at module load time.
 * Import this module early in server-side code to fail fast with clear errors.
 * 
 * IMPORTANT: This module should only be imported in server-side code (not Edge runtime).
 * Do not import in middleware.ts or client components.
 */

import { z } from 'zod'

// =============================================================================
// SCHEMA DEFINITIONS
// =============================================================================

/**
 * Server-side environment variables (secrets, not exposed to client)
 */
const serverEnvSchema = z.object({
  // Database (Required)
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (url) => url.startsWith('postgres'),
      'DATABASE_URL must be a PostgreSQL connection string'
    ),
  DIRECT_URL: z
    .string()
    .min(1, 'DIRECT_URL is required for Prisma migrations')
    .refine(
      (url) => url.startsWith('postgres'),
      'DIRECT_URL must be a PostgreSQL connection string'
    ),

  // Supabase Auth (Required for server-side operations)
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .optional()
    .describe('Required only for admin operations like seed'),

  // Stripe (Optional - billing features)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_CORE_4WEEKS: z.string().optional(),
  STRIPE_PRICE_CORE_ANNUAL: z.string().optional(),
  STRIPE_PRICE_PRO_4WEEKS: z.string().optional(),
  STRIPE_PRICE_PRO_ANNUAL: z.string().optional(),

  // OpenAI (Optional - AI features)
  OPENAI_API_KEY: z.string().optional(),

  // Encryption (Optional - LinkedIn data encryption)
  ENCRYPTION_KEY: z
    .string()
    .optional()
    .refine(
      (key) => !key || key.length === 64,
      'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'
    ),

  // Health check protection (Optional)
  HEALTH_CHECK_TOKEN: z.string().optional(),

  // Webhook secrets (Optional)
  CALENDLY_WEBHOOK_SIGNING_KEY: z.string().optional(),
  GOOGLE_MEET_WEBHOOK_SECRET: z.string().optional(),
  ZOOM_WEBHOOK_SECRET_TOKEN: z.string().optional(),
})

/**
 * Client-side environment variables (public, exposed to browser)
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_URL is required')
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .optional()
    .refine(
      (url) => !url || url.startsWith('http'),
      'NEXT_PUBLIC_APP_URL must be a valid URL'
    ),
})

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validates environment variables and returns typed config.
 * Call this function early in server startup to fail fast.
 */
function validateEnv() {
  // Only validate on server-side
  if (typeof window !== 'undefined') {
    throw new Error('env.ts should not be imported on the client side')
  }

  const serverResult = serverEnvSchema.safeParse(process.env)
  const clientResult = clientEnvSchema.safeParse(process.env)

  const errors: string[] = []

  if (!serverResult.success) {
    serverResult.error.issues.forEach((issue) => {
      errors.push(`${issue.path.join('.')}: ${issue.message}`)
    })
  }

  if (!clientResult.success) {
    clientResult.error.issues.forEach((issue) => {
      errors.push(`${issue.path.join('.')}: ${issue.message}`)
    })
  }

  if (errors.length > 0) {
    console.error('\n❌ Environment variable validation failed:\n')
    errors.forEach((error) => console.error(`   - ${error}`))
    console.error('\nCheck your .env file or Vercel environment variables.\n')
    
    // In production, throw to prevent startup with invalid config
    // In development, log warning but allow startup for easier debugging
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing or invalid environment variables: ${errors.join(', ')}`)
    }
  }

  return {
    server: serverResult.success ? serverResult.data : ({} as z.infer<typeof serverEnvSchema>),
    client: clientResult.success ? clientResult.data : ({} as z.infer<typeof clientEnvSchema>),
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

/**
 * Validated environment configuration.
 * Access via env.server.DATABASE_URL or env.client.NEXT_PUBLIC_SUPABASE_URL
 */
export const env = validateEnv()

/**
 * Type-safe accessor for server environment variables.
 * Throws if accessed and validation failed in production.
 */
export const serverEnv = env.server

/**
 * Type-safe accessor for client environment variables.
 */
export const clientEnv = env.client

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if a feature is enabled based on required env vars.
 */
export const features = {
  /** Stripe billing is configured */
  billing: () => Boolean(serverEnv.STRIPE_SECRET_KEY && serverEnv.STRIPE_WEBHOOK_SECRET),
  
  /** OpenAI features are available */
  ai: () => Boolean(serverEnv.OPENAI_API_KEY),
  
  /** LinkedIn encryption is configured */
  linkedinEncryption: () => Boolean(serverEnv.ENCRYPTION_KEY),
  
  /** Health check requires authentication */
  protectedHealthCheck: () => Boolean(serverEnv.HEALTH_CHECK_TOKEN),
}

/**
 * Get connection string recommendations for Supabase + Prisma.
 * Use for debugging connection issues.
 */
export function getConnectionStringInfo(): {
  hasPoolingParam: boolean
  hasConnectionLimit: boolean
  recommendations: string[]
} {
  const dbUrl = process.env.DATABASE_URL || ''
  const hasPoolingParam = dbUrl.includes('pgbouncer=true')
  const hasConnectionLimit = dbUrl.includes('connection_limit=')

  const recommendations: string[] = []

  if (!hasPoolingParam) {
    recommendations.push('Add ?pgbouncer=true to DATABASE_URL for Supabase pooling')
  }

  if (!hasConnectionLimit) {
    recommendations.push('Add &connection_limit=1 for serverless environments')
  }

  return {
    hasPoolingParam,
    hasConnectionLimit,
    recommendations,
  }
}



