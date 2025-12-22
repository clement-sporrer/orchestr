import { PrismaClient } from '@/generated/prisma'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configure Prisma for Supabase connection pooling (PgBouncer)
// The DATABASE_URL should include ?pgbouncer=true for proper pooling
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function with retry logic for transient connection errors
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
      
      // Retry on connection errors or prepared statement errors
      const isRetryable = 
        errorMessage.includes('prepared statement') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('ConnectorError') ||
        errorMessage.includes('P1001') || // Can't reach database
        errorMessage.includes('P1002')    // Timeout
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)))
    }
  }
  
  throw lastError
}
