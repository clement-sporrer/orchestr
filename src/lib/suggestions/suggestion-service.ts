'use server'

import { prisma } from '@/lib/prisma'
import { getOrganizationId } from '@/lib/auth/helpers'

/**
 * Server-side suggestion service
 * Provides autocomplete suggestions from existing data
 */

/**
 * Get company suggestions based on query
 */
export async function getCompanySuggestions(query: string): Promise<string[]> {
  if (!query || query.length < 2) return []

  const organizationId = await getOrganizationId()

  const companies = await prisma.candidate.findMany({
    where: {
      organizationId,
      currentCompany: {
        contains: query,
        mode: 'insensitive',
      },
    },
    select: {
      currentCompany: true,
    },
    distinct: ['currentCompany'],
    take: 10,
    orderBy: {
      currentCompany: 'asc',
    },
  })

  return companies
    .map(c => c.currentCompany)
    .filter((c): c is string => c !== null && c !== undefined)
}

/**
 * Get position suggestions based on query
 */
export async function getPositionSuggestions(query: string): Promise<string[]> {
  if (!query || query.length < 2) return []

  const organizationId = await getOrganizationId()

  const positions = await prisma.candidate.findMany({
    where: {
      organizationId,
      currentPosition: {
        contains: query,
        mode: 'insensitive',
      },
    },
    select: {
      currentPosition: true,
    },
    distinct: ['currentPosition'],
    take: 10,
    orderBy: {
      currentPosition: 'asc',
    },
  })

  return positions
    .map(p => p.currentPosition)
    .filter((p): p is string => p !== null && p !== undefined)
}

/**
 * Get skill suggestions based on query
 */
export async function getSkillSuggestions(query: string): Promise<string[]> {
  if (!query || query.length < 2) return []

  const organizationId = await getOrganizationId()

  // Get hardSkills from candidates (now String[])
  const candidates = await prisma.candidate.findMany({
    where: {
      organizationId,
      hardSkills: { isEmpty: false },
    },
    select: {
      hardSkills: true,
    },
    take: 50,
  })

  const allSkills = new Set<string>()
  candidates.forEach(c => {
    c.hardSkills.forEach((skill: string) => {
      const trimmed = skill.trim()
      if (trimmed && trimmed.toLowerCase().includes(query.toLowerCase())) {
        allSkills.add(trimmed)
      }
    })
  })

  return Array.from(allSkills).slice(0, 10).sort()
}

/**
 * Get location suggestions (cities)
 */
export async function getLocationSuggestions(query: string): Promise<string[]> {
  if (!query || query.length < 2) return []

  const organizationId = await getOrganizationId()

  const locations = await prisma.candidate.findMany({
    where: {
      organizationId,
      OR: [
        { city: { contains: query, mode: 'insensitive' } },
        { country: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      city: true,
      country: true,
    },
    distinct: ['city', 'country'],
    take: 10,
  })

  const suggestions = locations.map(l => {
    if (l.city && l.country) return `${l.city}, ${l.country}`
    return l.city || l.country
  })

  return suggestions.filter((s): s is string => s !== null && s !== undefined)
}
