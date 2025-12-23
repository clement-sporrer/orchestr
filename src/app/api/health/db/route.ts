import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force Node.js runtime for Prisma database access
export const runtime = 'nodejs'

/**
 * Database Health Check Endpoint
 * 
 * Security:
 * - In production with HEALTH_CHECK_TOKEN set, requires token auth
 * - In dev/preview or without token, endpoint is publicly accessible
 * - No sensitive data is ever exposed (no connection strings, no query details)
 * 
 * Authentication (when HEALTH_CHECK_TOKEN is set):
 * - Query param: /api/health/db?token=your-token
 * - Header: Authorization: Bearer your-token
 * 
 * Returns:
 * - 200 OK: Database is connected and responding
 * - 401 Unauthorized: Token required but not provided/invalid
 * - 503 Service Unavailable: Database connection failed
 * 
 * Response includes:
 * - status: 'ok' | 'error'
 * - timestamp: ISO timestamp
 * - latencyMs: Query latency in milliseconds
 */
export async function GET(request: NextRequest) {
  // Check authentication if token is configured
  const requiredToken = process.env.HEALTH_CHECK_TOKEN
  if (requiredToken) {
    const providedToken = 
      request.nextUrl.searchParams.get('token') ||
      request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (providedToken !== requiredToken) {
      return NextResponse.json(
        { 
          status: 'error',
          message: 'Unauthorized',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      )
    }
  }

  const startTime = Date.now()
  
  try {
    // Simple query to verify connection - SELECT 1
    await prisma.$queryRaw`SELECT 1`
    
    const latencyMs = Date.now() - startTime
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      latencyMs,
      environment: process.env.NODE_ENV,
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
