import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force Node.js runtime for Prisma database access
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const plan = searchParams.get('plan')
  const period = searchParams.get('period') || 'annual'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create or link user in database
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.user.email! },
        })

        if (existingUser) {
          // User exists - ensure authUserId is linked
          if (!existingUser.authUserId) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { authUserId: data.user.id },
            })
          }
        } else {
          // New user - create organization and user
          const userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'
          const orgName = data.user.user_metadata?.organization_name || `${userName}'s Organization`

          // Create organization
          const organization = await prisma.organization.create({
            data: {
              name: orgName,
              contactEmail: data.user.email,
            },
          })

          // Create user with authUserId link
          await prisma.user.create({
            data: {
              email: data.user.email!,
              name: userName,
              organizationId: organization.id,
              role: 'ADMIN', // First user is always admin
              authUserId: data.user.id, // Link to Supabase Auth user
            },
          })
        }
      } catch (err) {
        // Non-fatal: user can complete account setup via onboarding
        // Log for debugging broken signups
        console.error('[auth/callback] Failed to create/link user in DB:', err)
      }

      // If user selected a plan, redirect to pricing to start checkout
      if (plan && (plan === 'CORE' || plan === 'PRO')) {
        // Redirect to a page that will initiate Stripe checkout
        return NextResponse.redirect(
          `${origin}/checkout?plan=${plan}&period=${period}`
        )
      }

      // Otherwise redirect to onboarding or dashboard
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
