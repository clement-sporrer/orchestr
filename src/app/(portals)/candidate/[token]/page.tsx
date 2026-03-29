import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isTokenExpired, hashToken } from '@/lib/utils/tokens'
import { CandidatePortalClient } from '@/components/portals/candidate-portal-client'

interface CandidatePortalPageProps {
  params: Promise<{ token: string }>
}

export default async function CandidatePortalPage({ params }: CandidatePortalPageProps) {
  const { token } = await params
  const tokenHash = hashToken(token)

  // Find mission candidate by hashed token
  const missionCandidate = await prisma.missionCandidate.findFirst({
    where: { portalToken: tokenHash },
    include: {
      candidate: true,
      mission: true,
    },
  })

  if (!missionCandidate) {
    notFound()
  }

  // Check token expiry
  if (isTokenExpired(missionCandidate.portalTokenExpiry)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive">Lien expiré</h1>
          <p className="text-muted-foreground mt-2">
            Ce lien n&apos;est plus valide. Veuillez contacter votre recruteur pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    )
  }

  return (
    <CandidatePortalClient
      token={token}
      missionCandidate={missionCandidate}
      candidate={missionCandidate.candidate}
      mission={missionCandidate.mission}
    />
  )
}





