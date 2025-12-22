import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        linkedinConnected: true,
        linkedinRiskLevel: true,
        linkedinRequestCount: true,
        linkedinLastUsed: true,
        linkedinBlockedUntil: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    return NextResponse.json({
      connected: dbUser.linkedinConnected || false,
      riskLevel: dbUser.linkedinRiskLevel,
      requestCount: dbUser.linkedinRequestCount || 0,
      lastUsed: dbUser.linkedinLastUsed,
      blockedUntil: dbUser.linkedinBlockedUntil,
    })
  } catch (error) {
    console.error('LinkedIn status error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

