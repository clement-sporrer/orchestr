import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Database Health Check Endpoint
 * 
 * Returns:
 * - 200 OK: Database is connected and responding
 * - 503 Service Unavailable: Database connection failed
 * 
 * Response includes:
 * - status: 'ok' | 'error'
 * - timestamp: ISO timestamp
 * - latencyMs: Query latency in milliseconds
 * 
 * Note: No sensitive data is exposed (no connection strings, no query details)
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    // Simple query to verify connection - SELECT 1
    await prisma.$queryRaw`SELECT 1`
    
    const latencyMs = Date.now() - startTime
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      latencyMs,
    }, { status: 200 })
  } catch (error) {
    const latencyMs = Date.now() - startTime
    
    // Log error safely (no connection strings or sensitive data)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = extractPrismaErrorCode(errorMessage)
    
    console.error('[DB Health Check Failed]', {
      errorCode,
      latencyMs,
      timestamp: new Date().toISOString(),
    })
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      latencyMs,
      // Only expose error code, not full message (security)
      errorCode: errorCode || 'UNKNOWN',
    }, { status: 503 })
  }
}

/**
 * Extract Prisma error code from message (e.g., P1001, P2002)
 */
function extractPrismaErrorCode(message: string): string | null {
  const match = message.match(/P\d{4}/)
  return match ? match[0] : null
}

// Prevent caching of health checks
export const dynamic = 'force-dynamic'
export const revalidate = 0

