import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { UserPlus, AlertCircle } from 'lucide-react'

interface InvitePageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params
  
  // Validate token (check if it exists and is not expired)
  // This is a simplified check - in production you'd verify more thoroughly
  let isValid = false
  let inviteType: 'candidate' | 'recruiter' = 'candidate'
  let missionTitle = ''
  
  try {
    // Check if it's a candidate portal token
    const missionCandidate = await prisma.missionCandidate.findFirst({
      where: {
        portalToken: token,
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
  } catch {
    // Token validation failed
  }

  if (!isValid) {
    return (
      <AuthCard
        title="Invalid or expired link"
        subtitle="This invitation link is no longer valid"
        showBackLink={false}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <p className="text-gray-600 mb-6">
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
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <UserPlus className="h-8 w-8 text-blue-600" />
        </div>
        
        <p className="text-gray-600 mb-6">
          {inviteType === 'candidate'
            ? 'You have been invited to complete your candidate profile. Click below to continue and provide your information.'
            : 'You have been invited to join ORCHESTR as a recruiter. Click below to create your account.'}
        </p>

        <div className="space-y-3">
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <Link href={`/candidate/${token}`}>Continue</Link>
          </Button>
          
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <Link href="/legal/terms" className="text-blue-600 hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </AuthCard>
  )
}

