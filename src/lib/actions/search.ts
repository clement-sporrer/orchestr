'use server'

import { prisma } from '@/lib/prisma'
import { getOrganizationId } from '@/lib/auth/helpers'

export interface SearchResult {
  type: 'candidate' | 'mission' | 'client'
  id: string
  title: string
  subtitle?: string
  url: string
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
          { client: { name: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        title: true,
        client: { select: { name: true } },
      },
      take: 5,
    }),
    // Search clients
    prisma.client.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { sector: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
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
      subtitle: c.currentPosition 
        ? `${c.currentPosition}${c.currentCompany ? ` @ ${c.currentCompany}` : ''}`
        : c.email || undefined,
      url: `/candidates/${c.id}`,
    })),
    ...missions.map((m) => ({
      type: 'mission' as const,
      id: m.id,
      title: m.title,
      subtitle: m.client.name,
      url: `/missions/${m.id}`,
    })),
    ...clients.map((c) => ({
      type: 'client' as const,
      id: c.id,
      title: c.name,
      subtitle: c.sector || undefined,
      url: `/clients/${c.id}`,
    })),
  ]

  return results
}



