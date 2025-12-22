import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    await prisma.user.update({
      where: { email: user.email },
      data: {
        linkedinConnected: false,
        linkedinAccessToken: null,
        linkedinRefreshToken: null,
        linkedinExpiresAt: null,
        linkedinCookies: Prisma.JsonNull,
        linkedinRiskLevel: null,
        linkedinBlockedUntil: null,
        linkedinRequestCount: 0,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LinkedIn disconnect error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

