import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isTokenExpired } from '@/lib/utils/tokens'
import { ClientPortalClient } from '@/components/portals/client-portal-client'

interface ClientPortalPageProps {
  params: Promise<{ token: string }>
}

export default async function ClientPortalPage({ params }: ClientPortalPageProps) {
  const { token } = await params

  // Find shortlist by token
  const shortlist = await prisma.shortlist.findFirst({
    where: { accessToken: token },
    include: {
      mission: {
        include: {
          client: true,
        },
      },
      candidates: {
        include: {
          missionCandidate: {
            include: {
              candidate: true,
            },
          },
          feedback: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!shortlist) {
    notFound()
  }

  // Check token expiry
  if (isTokenExpired(shortlist.accessTokenExpiry)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20 p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive">Lien expiré</h1>
          <p className="text-muted-foreground mt-2">
            Ce lien n&apos;est plus valide. Veuillez contacter votre recruteur.
          </p>
        </div>
      </div>
    )
  }

  return <ClientPortalClient shortlist={shortlist} />
}





