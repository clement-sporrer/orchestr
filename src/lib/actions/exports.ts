'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function getOrganizationId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    throw new Error('Non authentifié')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { organizationId: true },
  })

  if (!dbUser) {
    throw new Error('Utilisateur non trouvé')
  }

  return dbUser.organizationId
}

// Export candidates as CSV
export async function exportCandidatesCsv(filters?: {
  tags?: string[]
  status?: string
  poolId?: string
}) {
  const organizationId = await getOrganizationId()

  const candidates = await prisma.candidate.findMany({
    where: {
      organizationId,
      status: { not: 'DELETED' },
      ...(filters?.tags?.length ? { tags: { hasSome: filters.tags } } : {}),
      ...(filters?.status ? { status: filters.status as 'ACTIVE' | 'TO_RECONTACT' | 'BLACKLIST' } : {}),
      ...(filters?.poolId ? {
        poolMemberships: { some: { poolId: filters.poolId } },
      } : {}),
    },
    orderBy: { lastName: 'asc' },
  })

  // Generate CSV
  const headers = [
    'Prénom',
    'Nom',
    'Email',
    'Téléphone',
    'Localisation',
    'Poste actuel',
    'Entreprise',
    'Tags',
    'Statut',
  ]

  const rows = candidates.map((c) => [
    c.firstName,
    c.lastName,
    c.email || '',
    c.phone || '',
    c.location || '',
    c.currentPosition || '',
    c.currentCompany || '',
    c.tags.join(', '),
    c.status,
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return csv
}

// Export mission pipeline as CSV
export async function exportMissionPipelineCsv(missionId: string) {
  const organizationId = await getOrganizationId()

  const mission = await prisma.mission.findFirst({
    where: { id: missionId, organizationId },
    include: {
      missionCandidates: {
        include: { candidate: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!mission) {
    throw new Error('Mission non trouvée')
  }

  const headers = [
    'Prénom',
    'Nom',
    'Email',
    'Téléphone',
    'Étape',
    'Score',
    'Date ajout',
  ]

  const rows = mission.missionCandidates.map((mc) => [
    mc.candidate.firstName,
    mc.candidate.lastName,
    mc.candidate.email || '',
    mc.candidate.phone || '',
    mc.stage,
    mc.score?.toString() || '',
    mc.createdAt.toISOString().split('T')[0],
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return csv
}

// Export shortlist as CSV
export async function exportShortlistCsv(shortlistId: string) {
  const organizationId = await getOrganizationId()

  const shortlist = await prisma.shortlist.findFirst({
    where: {
      id: shortlistId,
      mission: { organizationId },
    },
    include: {
      candidates: {
        include: {
          missionCandidate: {
            include: { candidate: true },
          },
          feedback: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!shortlist) {
    throw new Error('Shortlist non trouvée')
  }

  const headers = [
    'Prénom',
    'Nom',
    'Email',
    'Poste actuel',
    'Entreprise',
    'Score',
    'Feedback',
    'Commentaire',
  ]

  const rows = shortlist.candidates.map((sc) => [
    sc.missionCandidate.candidate.firstName,
    sc.missionCandidate.candidate.lastName,
    sc.missionCandidate.candidate.email || '',
    sc.missionCandidate.candidate.currentPosition || '',
    sc.missionCandidate.candidate.currentCompany || '',
    sc.missionCandidate.score?.toString() || '',
    sc.feedback?.decision || '',
    sc.feedback?.comment || '',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return csv
}

// Get shortlist print data
export async function getShortlistPrintData(shortlistId: string) {
  const organizationId = await getOrganizationId()

  const shortlist = await prisma.shortlist.findFirst({
    where: {
      id: shortlistId,
      mission: { organizationId },
    },
    include: {
      mission: {
        include: { client: true },
      },
      candidates: {
        include: {
          missionCandidate: {
            include: { candidate: true },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!shortlist) {
    throw new Error('Shortlist non trouvée')
  }

  return {
    mission: {
      title: shortlist.mission.title,
      client: shortlist.mission.client.name,
      location: shortlist.mission.location,
    },
    candidates: shortlist.candidates.map((sc) => ({
      name: `${sc.missionCandidate.candidate.firstName} ${sc.missionCandidate.candidate.lastName}`,
      currentPosition: sc.missionCandidate.candidate.currentPosition,
      currentCompany: sc.missionCandidate.candidate.currentCompany,
      location: sc.missionCandidate.candidate.location,
      summary: sc.summary,
      tags: sc.missionCandidate.candidate.tags,
      score: sc.missionCandidate.score,
    })),
    generatedAt: new Date(),
  }
}



