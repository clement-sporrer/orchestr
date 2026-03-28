import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/utils/tokens'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { UserPlus, AlertCircle } from 'lucide-react'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  const tokenHash = hashToken(token)

  let isValid = false
  let inviteType: 'candidate' | 'recruiter' = 'candidate'
  let missionTitle = ''

  try {
    // Check if it's a candidate portal token
    const missionCandidate = await prisma.missionCandidate.findFirst({
      where: {
        portalToken: tokenHash,
        OR: [
          { portalTokenExpiry: null },
          { portalTokenExpiry: { gte: new Date() } },
        ],
      },
      include: {
        mission: true,
        candidate: true,
      },
    })
    
    if (missionCandidate) {
      isValid = true
      inviteType = 'candidate'
      missionTitle = missionCandidate.mission.title
    }
  } catch (err) {
    console.error('[invite] Token validation failed:', err)
  }

  if (!isValid) {
    return (
      <AuthCard
        title="Invalid or expired link"
        subtitle="This invitation link is no longer valid"
        showBackLink={false}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          
          <p className="text-muted-foreground mb-6">
            The link you followed has expired or is invalid. Please contact the person who sent you this link for a new one.
          </p>
          
          <Button asChild variant="outline">
            <Link href="/">Go to homepage</Link>
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="You have been invited"
      subtitle={
        inviteType === 'candidate'
          ? `Complete your profile for: ${missionTitle}`
          : 'Join the recruitment team'
      }
      showBackLink={false}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        
        <p className="text-muted-foreground mb-6">
          {inviteType === 'candidate'
            ? 'You have been invited to complete your candidate profile. Click below to continue and provide your information.'
            : 'You have been invited to join ORCHESTR as a recruiter. Click below to create your account.'}
        </p>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href={`/candidate/${token}`}>Continue</Link>
          </Button>
          
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link href="/legal/terms" className="text-primary hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </AuthCard>
  )
}
