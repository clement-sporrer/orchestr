import { PrismaClient } from '@/generated/prisma'

// =============================================================================
// PRISMA CLIENT SINGLETON
// =============================================================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Creates a configured Prisma client instance.
 * 
 * Configuration optimized for:
 * - Supabase PostgreSQL with PgBouncer pooling
 * - Vercel serverless functions
 * - Hot reloading in development
 * 
 * IMPORTANT: DATABASE_URL must include:
 * - ?pgbouncer=true (for Supabase pooler)
 * - &connection_limit=1 (recommended for serverless)
 */
const prismaClientSingleton = () => {
  const dbUrl = process.env.DATABASE_URL

  // Log connection string recommendations in development (without leaking secrets)
  if (dbUrl && process.env.NODE_ENV === 'development') {
    const hasPooling = dbUrl.includes('pgbouncer=true')
    const hasLimit = dbUrl.includes('connection_limit=')
    if (!hasPooling || !hasLimit) {
      console.warn('[Prisma] Connection string recommendations:')
      if (!hasPooling) console.warn('  - Add ?pgbouncer=true for Supabase pooling')
      if (!hasLimit) console.warn('  - Add &connection_limit=1 for serverless')
    }
  }

  // Pass datasourceUrl only if defined — if absent, Prisma falls back to DATABASE_URL
  // env var at query time and throws a clear error then (not at import/build time).
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['error', 'warn']
      : ['error'],
    ...(dbUrl ? { datasourceUrl: dbUrl } : {}),
  })
}

// Use singleton pattern to prevent connection exhaustion
// - In development: survives hot reloads via globalThis
// - In production: helps with module caching in serverless
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// Store on globalThis to survive hot reloads in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// =============================================================================
// RETRY HELPER
// =============================================================================

/**
 * Executes a database operation with automatic retry for transient errors.
 * 
 * Retryable errors:
 * - P1001: Can't reach database server (DNS, network)
 * - P1002: Connection timeout
 * - Prepared statement errors (PgBouncer session reset)
 * - General connection errors
 * 
 * @param operation - Async function to execute
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @param delayMs - Initial delay between retries in ms (default: 100)
 * @returns Result of the operation
 * @throws Last error if all retries fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      const errorMessage = lastError.message || ''
      
      // Retry on transient connection errors
      const isRetryable = 
        errorMessage.includes('prepared statement') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('ConnectorError') ||
        errorMessage.includes('P1001') || // Can't reach database
        errorMessage.includes('P1002') || // Timeout
        errorMessage.includes('P1008') || // Operations timed out
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('ETIMEDOUT')
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError
      }
      
      // Exponential backoff with jitter
      const backoff = delayMs * Math.pow(2, attempt)
      const jitter = Math.random() * 50
      await new Promise(resolve => setTimeout(resolve, backoff + jitter))
    }
  }
  
  throw lastError
}

// =============================================================================
// CONNECTION UTILITIES
// =============================================================================

/**
 * Disconnects the Prisma client.
 * Call this when shutting down the application gracefully.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect()
}

/**
 * Tests database connectivity with a simple query.
 * Returns latency in milliseconds or throws on failure.
 */
export async function testConnection(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now()
  await prisma.$queryRaw`SELECT 1`
  return {
    ok: true,
    latencyMs: Date.now() - start,
  }
}
