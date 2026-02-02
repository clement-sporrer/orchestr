'use server'

import { prisma } from '@/lib/prisma'
import { getOrganizationId } from '@/lib/auth/helpers'

/**
 * Suggest companies based on search query
 * Returns distinct companies from current candidates, ordered by frequency
 */
export async function suggestCompanies(query: string, limit: number = 10) {
  try {
    const organizationId = await getOrganizationId()

    if (!query || query.trim().length < 2) {
      return { success: true, data: [] }
    }

    // Get unique companies matching the query
    const companies = await prisma.candidate.groupBy({
      by: ['currentCompany'],
      where: {
        organizationId,
        currentCompany: {
          not: null,
          contains: query,
          mode: 'insensitive',
        },
        status: {
          not: 'DELETED',
        },
      },
      _count: {
        currentCompany: true,
      },
      orderBy: {
        _count: {
          currentCompany: 'desc',
        },
      },
      take: limit,
    })

    const suggestions = companies
      .filter((c) => c.currentCompany !== null)
      .map((c) => ({
        value: c.currentCompany!,
        count: c._count.currentCompany,
      }))

    return { success: true, data: suggestions }
  } catch (error) {
    console.error('Error suggesting companies:', error)
    return {
      success: false,
      error: 'Erreur lors de la suggestion des entreprises',
      data: [],
    }
  }
}

/**
 * Suggest positions based on search query
 * Returns distinct positions from current candidates, ordered by frequency
 */
export async function suggestPositions(query: string, limit: number = 10) {
  try {
    const organizationId = await getOrganizationId()

    if (!query || query.trim().length < 2) {
      return { success: true, data: [] }
    }

    // Get unique positions matching the query
    const positions = await prisma.candidate.groupBy({
      by: ['currentPosition'],
      where: {
        organizationId,
        currentPosition: {
          not: null,
          contains: query,
          mode: 'insensitive',
        },
        status: {
          not: 'DELETED',
        },
      },
      _count: {
        currentPosition: true,
      },
      orderBy: {
        _count: {
          currentPosition: 'desc',
        },
      },
      take: limit,
    })

    const suggestions = positions
      .filter((p) => p.currentPosition !== null)
      .map((p) => ({
        value: p.currentPosition!,
        count: p._count.currentPosition,
      }))

    return { success: true, data: suggestions }
  } catch (error) {
    console.error('Error suggesting positions:', error)
    return {
      success: false,
      error: 'Erreur lors de la suggestion des postes',
      data: [],
    }
  }
}

/**
 * Get all unique companies for the organization
 * Used for company filter dropdowns
 */
export async function getAllCompanies() {
  try {
    const organizationId = await getOrganizationId()

    const companies = await prisma.candidate.groupBy({
      by: ['currentCompany'],
      where: {
        organizationId,
        currentCompany: {
          not: null,
        },
        status: {
          not: 'DELETED',
        },
      },
      _count: {
        currentCompany: true,
      },
      orderBy: {
        _count: {
          currentCompany: 'desc',
        },
      },
    })

    const companyList = companies
      .filter((c) => c.currentCompany !== null)
      .map((c) => ({
        value: c.currentCompany!,
        count: c._count.currentCompany,
      }))

    return { success: true, data: companyList }
  } catch (error) {
    console.error('Error getting all companies:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération des entreprises',
      data: [],
    }
  }
}

/**
 * Get all unique positions for the organization
 * Used for position filter dropdowns
 */
export async function getAllPositions() {
  try {
    const organizationId = await getOrganizationId()

    const positions = await prisma.candidate.groupBy({
      by: ['currentPosition'],
      where: {
        organizationId,
        currentPosition: {
          not: null,
        },
        status: {
          not: 'DELETED',
        },
      },
      _count: {
        currentPosition: true,
      },
      orderBy: {
        _count: {
          currentPosition: 'desc',
        },
      },
    })

    const positionList = positions
      .filter((p) => p.currentPosition !== null)
      .map((p) => ({
        value: p.currentPosition!,
        count: p._count.currentPosition,
      }))

    return { success: true, data: positionList }
  } catch (error) {
    console.error('Error getting all positions:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération des postes',
      data: [],
    }
  }
}

/**
 * Get all unique skills from candidates
 * Used for skills suggestions
 */
export async function getAllSkills() {
  try {
    const organizationId = await getOrganizationId()

    // Get candidates with enrichment data
    const enrichments = await prisma.candidateEnrichment.findMany({
      where: {
        candidate: {
          organizationId,
          status: {
            not: 'DELETED',
          },
        },
      },
      select: {
        skills: true,
      },
    })

    // Flatten and count skills
    const skillCount = new Map<string, number>()

    enrichments.forEach((e) => {
      e.skills.forEach((skill) => {
        skillCount.set(skill, (skillCount.get(skill) || 0) + 1)
      })
    })

    // Sort by frequency
    const sortedSkills = Array.from(skillCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([skill, count]) => ({ value: skill, count }))

    return { success: true, data: sortedSkills }
  } catch (error) {
    console.error('Error getting all skills:', error)
    return {
      success: false,
      error: 'Erreur lors de la récupération des compétences',
      data: [],
    }
  }
}

/**
 * Suggest skills based on search query
 */
export async function suggestSkills(query: string, limit: number = 10) {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] }
    }

    const allSkillsResult = await getAllSkills()
    if (!allSkillsResult.success) {
      return allSkillsResult
    }

    // Filter skills by query
    const filteredSkills = allSkillsResult.data
      .filter((skill) =>
        skill.value.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)

    return { success: true, data: filteredSkills }
  } catch (error) {
    console.error('Error suggesting skills:', error)
    return {
      success: false,
      error: 'Erreur lors de la suggestion des compétences',
      data: [],
    }
  }
}
