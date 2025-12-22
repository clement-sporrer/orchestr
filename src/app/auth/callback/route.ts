import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const plan = searchParams.get('plan')
  const period = searchParams.get('period') || 'annual'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Create organization and user in database if not exists
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.user.email! },
        })

        if (!existingUser) {
          // Get user metadata
          const userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'
          const orgName = data.user.user_metadata?.organization_name || `${userName}'s Organization`

          // Create organization
          const organization = await prisma.organization.create({
            data: {
              name: orgName,
              contactEmail: data.user.email,
            },
          })

          // Create user
          await prisma.user.create({
            data: {
              email: data.user.email!,
              name: userName,
              organizationId: organization.id,
              role: 'ADMIN', // First user is always admin
            },
          })
        }
      } catch (err) {
        console.error('Error creating user/organization:', err)
        // Continue anyway - user can complete setup later
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



