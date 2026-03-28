import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/utils/tokens'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface PortalLandingPageProps {
  params: Promise<{ token: string }>
}

export default async function PortalLandingPage({ params }: PortalLandingPageProps) {
  const { token } = await params
  const tokenHash = hashToken(token)

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
      mission: {
        include: {
          client: true,
        },
      },
      candidate: true,
    },
  })
  
  if (missionCandidate) {
    // Redirect to the actual candidate portal
    redirect(`/candidate/${token}`)
  }
  
  // Check if it's a client shortlist token
  const shortlist = await prisma.shortlist.findFirst({
    where: {
      accessToken: tokenHash,
      OR: [
        { accessTokenExpiry: null },
        { accessTokenExpiry: { gte: new Date() } },
      ],
    },
    include: {
      mission: true,
    },
  })
  
  if (shortlist) {
    // Redirect to the actual client portal
    redirect(`/client/${token}`)
  }

  // Invalid token
  return (
    <AuthCard
      title="Invalid or expired link"
      subtitle="This portal link is no longer valid"
      showBackLink={false}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <p className="text-gray-600 mb-6">
          The link you followed has expired or is invalid. This can happen if:
        </p>
        
        <ul className="text-sm text-gray-500 text-left mb-6 space-y-2">
          <li>The link has expired for security reasons</li>
          <li>The link was revoked by the recruiter</li>
          <li>The link was copied incorrectly</li>
        </ul>
        
        <p className="text-gray-600 mb-6">
          Please contact the person who sent you this link for a new one.
        </p>
        
        <Button asChild variant="outline">
          <Link href="/">Go to homepage</Link>
        </Button>
      </div>
    </AuthCard>
  )
}





