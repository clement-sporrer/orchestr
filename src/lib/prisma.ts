import { PrismaClient } from '@/generated/prisma'

// #region agent log
if (typeof window === 'undefined') {
  fetch('http://127.0.0.1:7242/ingest/969acf1d-f25c-4d68-8363-89eb500b6a8c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'prisma.ts:init',message:'Prisma client initializing',data:{nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
}
// #endregion

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// H3 FIX: Configure Prisma for Supabase connection pooling (PgBouncer)
// Use connection pooling with prepared statements disabled
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Log queries in development
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

