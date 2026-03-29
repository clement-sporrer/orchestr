'use server'

import { prisma } from '@/lib/prisma'
import { getOrganizationId } from '@/lib/auth/helpers'
import { displayClientCompanyName } from '@/lib/utils/client-display'

export interface SearchResult {
  type: 'candidate' | 'mission' | 'client'
  id: string
  title: string
  subtitle?: string
  url: string
}

function candidateSearchSubtitle(c: {
  currentPosition: string | null
  currentCompany: string | null
  email: string | null
}): string | undefined {
  if (!c.currentPosition) {
    return c.email ?? undefined
  }
  const companyPart = c.currentCompany ? ` @ ${c.currentCompany}` : ''
  return `${c.currentPosition}${companyPart}`
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const organizationId = await getOrganizationId()
  const searchTerm = query.trim()

  const [candidates, missions, clients] = await Promise.all([
    // Search candidates
    prisma.candidate.findMany({
      where: {
        organizationId,
        status: { not: 'DELETED' },
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { currentPosition: { contains: searchTerm, mode: 'insensitive' } },
          { currentCompany: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        currentPosition: true,
        currentCompany: true,
      },
      take: 5,
    }),
    // Search missions
    prisma.mission.findMany({
      where: {
        organizationId,
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { client: { companyName: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        title: true,
        client: { select: { companyName: true } },
      },
      take: 5,
    }),
    // Search clients
    prisma.client.findMany({
      where: {
        organizationId,
        OR: [
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
          { sector: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        companyName: true,
        sector: true,
      },
      take: 5,
    }),
  ])

  const results: SearchResult[] = [
    ...candidates.map((c) => ({
      type: 'candidate' as const,
      id: c.id,
      title: `${c.firstName} ${c.lastName}`,
      subtitle: candidateSearchSubtitle(c),
      url: `/candidates/${c.id}`,
    })),
    ...missions.map((m) => ({
      type: 'mission' as const,
      id: m.id,
      title: m.title,
      subtitle: displayClientCompanyName(m.client.companyName),
      url: `/missions/${m.id}`,
    })),
    ...clients.map((c) => ({
      type: 'client' as const,
      id: c.id,
      title: displayClientCompanyName(c.companyName),
      subtitle: c.sector || undefined,
      url: `/clients/${c.id}`,
    })),
  ]

  return results
}



