import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/utils/encryption'

/**
 * Callback OAuth LinkedIn
 * Reçoit le code d'autorisation et échange contre un access token
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings`

  // Gérer les erreurs LinkedIn
  if (error) {
    return NextResponse.redirect(
      `${redirectUrl}?linkedin_error=${error}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${redirectUrl}?linkedin_error=no_code`
    )
  }

  // Vérifier le state (sécurité OAuth)
  const storedState = request.cookies.get('linkedin_oauth_state')?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      `${redirectUrl}?linkedin_error=invalid_state`
    )
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.redirect(
        `${redirectUrl}?linkedin_error=not_authenticated`
      )
    }

    // Vérifier la configuration
    if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${redirectUrl}?linkedin_error=not_configured`
      )
    }

    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/linkedin/callback`,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
    })

    const tokens = await tokenResponse.json()

    if (tokens.error) {
      console.error('LinkedIn OAuth token error:', tokens)
      return NextResponse.redirect(
        `${redirectUrl}?linkedin_error=${tokens.error_description || tokens.error}`
      )
    }

    // Stocker les tokens chiffrés
    await prisma.user.update({
      where: { email: user.email },
      data: {
        linkedinConnected: true,
        linkedinAccessToken: encrypt(tokens.access_token),
        linkedinRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        linkedinExpiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
        linkedinRiskLevel: 'low', // Nouveau compte, risque faible
        linkedinRequestCount: 0,
      },
    })

    // Rediriger vers les paramètres avec succès
    const response = NextResponse.redirect(`${redirectUrl}?linkedin_connected=true`)
    
    // Supprimer le cookie de state
    response.cookies.delete('linkedin_oauth_state')

    return response
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error)
    return NextResponse.redirect(
      `${redirectUrl}?linkedin_error=connection_failed`
    )
  }
}

