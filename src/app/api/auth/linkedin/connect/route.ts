import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Initie la connexion OAuth LinkedIn
 * Redirige vers LinkedIn pour l'autorisation
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login?redirect=/settings`
      )
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    })

    if (!dbUser) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=user_not_found`
      )
    }

    // Vérifier si LinkedIn OAuth est configuré
    if (!process.env.LINKEDIN_CLIENT_ID) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=linkedin_not_configured`
      )
    }

    // Générer un state pour la sécurité OAuth
    const state = crypto.randomBytes(32).toString('hex')

    // Stocker le state dans un cookie sécurisé (valide 10 minutes)
    const response = NextResponse.redirect(
      `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent((process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/api/auth/linkedin/callback')}&` +
      `state=${state}&` +
      `scope=openid%20profile%20email`
    )

    // Stocker le state dans un cookie HTTP-only
    response.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })

    return response
  } catch (error) {
    console.error('LinkedIn OAuth init error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings?error=oauth_error`
    )
  }
}

