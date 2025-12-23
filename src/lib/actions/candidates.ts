'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { CandidateStatus, Seniority } from '@/generated/prisma'
import { parseLinkedInUrl, generateProfileTags, enrichProfileFromText, type EnrichedProfileData } from '@/lib/ai/structuring'
import { getOrganizationId, getCurrentUserId } from '@/lib/auth/helpers'

// Schema
const candidateSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  currentPosition: z.string().optional(),
  currentCompany: z.string().optional(),
  profileUrl: z.string().url().optional().or(z.literal('')),
  cvUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  estimatedSeniority: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).optional(),
  estimatedSector: z.string().optional(),
  status: z.enum(['ACTIVE', 'TO_RECONTACT', 'BLACKLIST', 'DELETED']).default('ACTIVE'),
})

// Get all candidates with pagination
export async function getCandidates(filters?: {
  search?: string
  status?: CandidateStatus
  tags?: string[]
  poolId?: string
  page?: number
  limit?: number
}) {
  const organizationId = await getOrganizationId()
  const page = filters?.page || 1
  const limit = Math.min(filters?.limit || 50, 100) // Max 100 per page
  const skip = (page - 1) * limit

  // Build where clause once to avoid duplication
  const whereClause = {
    organizationId,
    status: filters?.status || { not: 'DELETED' },
    ...(filters?.search ? {
      OR: [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { currentCompany: { contains: filters.search, mode: 'insensitive' } },
        { currentPosition: { contains: filters.search, mode: 'insensitive' } },
      ],
    } : {}),
    ...(filters?.tags?.length ? {
      tags: { hasSome: filters.tags },
    } : {}),
    ...(filters?.poolId ? {
      poolMemberships: {
        some: { poolId: filters.poolId },
      },
    } : {}),
  }

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        currentPosition: true,
        currentCompany: true,
        location: true,
        tags: true,
        status: true,
        relationshipLevel: true,
        createdAt: true,
        _count: {
          select: { missionCandidates: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.candidate.count({
      where: whereClause,
    }),
  ])

  return {
    candidates,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// Get single candidate
export async function getCandidate(id: string) {
  const organizationId = await getOrganizationId()

  const candidate = await prisma.candidate.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      enrichment: true,
      missionCandidates: {
        include: {
          mission: {
            include: {
              client: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      interactions: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      poolMemberships: {
        include: {
          pool: true,
        },
      },
    },
  })

  if (!candidate) {
    throw new Error('Candidat non trouvé')
  }

  return candidate
}

// Create candidate
export async function createCandidate(data: z.infer<typeof candidateSchema>) {
  const organizationId = await getOrganizationId()
  const validated = candidateSchema.parse(data)

  // Check for duplicates
  if (validated.email) {
    const existing = await prisma.candidate.findFirst({
      where: {
        organizationId,
        email: validated.email,
      },
    })

    if (existing) {
      throw new Error(`Un candidat avec l'email ${validated.email} existe déjà`)
    }
  }

  const candidate = await prisma.candidate.create({
    data: {
      ...validated,
      email: validated.email || null,
      profileUrl: validated.profileUrl || null,
      organizationId,
    },
  })

  revalidatePath('/candidates')
  return candidate
}

// Update candidate
export async function updateCandidate(id: string, data: Partial<z.infer<typeof candidateSchema>>) {
  const organizationId = await getOrganizationId()

  // Verify ownership
  const existing = await prisma.candidate.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Candidat non trouvé')
  }

  // Check for duplicate email if changing email
  if (data.email && data.email !== existing.email) {
    const duplicate = await prisma.candidate.findFirst({
      where: {
        organizationId,
        email: data.email,
        id: { not: id },
      },
    })

    if (duplicate) {
      throw new Error(`Un candidat avec l'email ${data.email} existe déjà`)
    }
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data: {
      ...data,
      email: data.email || null,
      profileUrl: data.profileUrl || null,
    },
  })

  revalidatePath('/candidates')
  revalidatePath(`/candidates/${id}`)
  return candidate
}

// Update candidate status
export async function updateCandidateStatus(id: string, status: CandidateStatus) {
  const organizationId = await getOrganizationId()

  const existing = await prisma.candidate.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Candidat non trouvé')
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data: { status },
  })

  revalidatePath('/candidates')
  revalidatePath(`/candidates/${id}`)
  return candidate
}

// Delete candidate (soft delete)
export async function deleteCandidate(id: string) {
  const organizationId = await getOrganizationId()

  const existing = await prisma.candidate.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Candidat non trouvé')
  }

  await prisma.candidate.update({
    where: { id },
    data: { status: 'DELETED' },
  })

  revalidatePath('/candidates')
}

// Add tag to candidate
export async function addTagToCandidate(id: string, tag: string) {
  const organizationId = await getOrganizationId()

  const existing = await prisma.candidate.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Candidat non trouvé')
  }

  const tags = [...new Set([...existing.tags, tag])]

  await prisma.candidate.update({
    where: { id },
    data: { tags },
  })

  revalidatePath(`/candidates/${id}`)
}

// Remove tag from candidate
export async function removeTagFromCandidate(id: string, tag: string) {
  const organizationId = await getOrganizationId()

  const existing = await prisma.candidate.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Candidat non trouvé')
  }

  const tags = existing.tags.filter((t) => t !== tag)

  await prisma.candidate.update({
    where: { id },
    data: { tags },
  })

  revalidatePath(`/candidates/${id}`)
}

// Get all unique tags in organization
export async function getAllTags() {
  const organizationId = await getOrganizationId()

  const candidates = await prisma.candidate.findMany({
    where: { organizationId, status: { not: 'DELETED' } },
    select: { tags: true },
  })

  const allTags = new Set<string>()
  candidates.forEach((c) => c.tags.forEach((t) => allTags.add(t)))
  
  return Array.from(allTags).sort()
}

// Add interaction
export async function addInteraction(
  candidateId: string,
  data: {
    type: 'MESSAGE' | 'EMAIL' | 'CALL' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_DONE' | 'NOTE'
    content?: string
    missionCandidateId?: string
    scheduledAt?: Date
  }
) {
  const organizationId = await getOrganizationId()
  
  const userId = await getCurrentUserId()
  
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  // Verify candidate ownership
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, organizationId },
  })

  if (!candidate) {
    throw new Error('Candidat non trouvé')
  }

  const interaction = await prisma.interaction.create({
    data: {
      organizationId,
      candidateId,
      userId: dbUser?.id,
      type: data.type,
      content: data.content,
      missionCandidateId: data.missionCandidateId,
      scheduledAt: data.scheduledAt,
    },
  })

  revalidatePath(`/candidates/${candidateId}`)
  return interaction
}

// ============================================
// LINKEDIN ENRICHMENT
// ============================================

export interface LinkedInEnrichmentResult {
  success: boolean
  data?: Partial<EnrichedProfileData>
  error?: string
  source: 'url_parsing' | 'ai_enrichment' | 'profile_text'
}

// Enrich candidate data from LinkedIn URL
export async function enrichFromLinkedInUrl(linkedInUrl: string): Promise<LinkedInEnrichmentResult> {
  // Validate LinkedIn URL format
  if (!linkedInUrl.includes('linkedin.com/in/')) {
    return {
      success: false,
      error: 'URL LinkedIn invalide. Format attendu: https://linkedin.com/in/nom-prenom',
      source: 'url_parsing',
    }
  }

  // Clean the URL
  const cleanUrl = linkedInUrl.split('?')[0].replace(/\/$/, '')
  
  // Parse basic info from URL
  const urlInfo = parseLinkedInUrl(cleanUrl)
  
  if (!urlInfo.firstName) {
    return {
      success: false,
      error: 'Impossible d\'extraire les informations du lien LinkedIn',
      source: 'url_parsing',
    }
  }

  return {
    success: true,
    data: {
      firstName: urlInfo.firstName,
      lastName: urlInfo.lastName || '',
      profileUrl: cleanUrl,
      tags: [],
    },
    source: 'url_parsing',
  }
}

// Enrich candidate with AI from profile text (copy/paste from LinkedIn)
export async function enrichFromProfileText(profileText: string, linkedInUrl?: string): Promise<LinkedInEnrichmentResult> {
  if (!profileText || profileText.trim().length < 50) {
    return {
      success: false,
      error: 'Texte du profil trop court. Copiez-collez plus d\'informations depuis LinkedIn.',
      source: 'profile_text',
    }
  }

  try {
    // Use AI to extract and structure the profile
    const enrichedData = await enrichProfileFromText(profileText)
    
    // Generate tags based on the extracted data
    const tagResult = await generateProfileTags({
      currentPosition: enrichedData.currentPosition,
      currentCompany: enrichedData.currentCompany,
      headline: enrichedData.linkedinHeadline,
      summary: enrichedData.suggestedNotes,
      skills: enrichedData.skills,
    })

    return {
      success: true,
      data: {
        ...enrichedData,
        profileUrl: linkedInUrl || '',
        tags: tagResult.tags,
        estimatedSeniority: tagResult.estimatedSeniority || enrichedData.estimatedSeniority,
        estimatedSector: tagResult.estimatedSector || enrichedData.estimatedSector,
        suggestedNotes: tagResult.suggestedNotes || enrichedData.suggestedNotes,
      },
      source: 'ai_enrichment',
    }
  } catch (error) {
    console.error('AI enrichment error:', error)
    return {
      success: false,
      error: 'Erreur lors de l\'analyse du profil. Veuillez réessayer.',
      source: 'ai_enrichment',
    }
  }
}

// Generate tags for existing candidate data
export async function generateTagsForCandidate(candidateData: {
  currentPosition?: string
  currentCompany?: string
  notes?: string
}): Promise<{ tags: string[]; seniority?: Seniority; sector?: string }> {
  try {
    const result = await generateProfileTags({
      currentPosition: candidateData.currentPosition,
      currentCompany: candidateData.currentCompany,
      summary: candidateData.notes,
    })
    
    return {
      tags: result.tags,
      seniority: result.estimatedSeniority,
      sector: result.estimatedSector,
    }
  } catch {
    return { tags: [] }
  }
}

// Check if candidate already exists (for deduplication)
export async function checkCandidateExists(data: {
  email?: string
  profileUrl?: string
  firstName?: string
  lastName?: string
}): Promise<{ exists: boolean; candidate?: { id: string; firstName: string; lastName: string } }> {
  const organizationId = await getOrganizationId()

  // Check by LinkedIn URL first (most reliable)
  if (data.profileUrl) {
    const byUrl = await prisma.candidate.findFirst({
      where: {
        organizationId,
        profileUrl: data.profileUrl,
        status: { not: 'DELETED' },
      },
      select: { id: true, firstName: true, lastName: true },
    })
    if (byUrl) {
      return { exists: true, candidate: byUrl }
    }
  }

  // Check by email
  if (data.email) {
    const byEmail = await prisma.candidate.findFirst({
      where: {
        organizationId,
        email: data.email,
        status: { not: 'DELETED' },
      },
      select: { id: true, firstName: true, lastName: true },
    })
    if (byEmail) {
      return { exists: true, candidate: byEmail }
    }
  }

  // Check by exact name match
  if (data.firstName && data.lastName) {
    const byName = await prisma.candidate.findFirst({
      where: {
        organizationId,
        firstName: { equals: data.firstName, mode: 'insensitive' },
        lastName: { equals: data.lastName, mode: 'insensitive' },
        status: { not: 'DELETED' },
      },
      select: { id: true, firstName: true, lastName: true },
    })
    if (byName) {
      return { exists: true, candidate: byName }
    }
  }

  return { exists: false }
}

// Create candidate with enrichment data
export async function createCandidateWithEnrichment(data: {
  // Basic info
  firstName: string
  lastName: string
  email?: string
  phone?: string
  location?: string
  currentPosition?: string
  currentCompany?: string
  profileUrl?: string
  tags?: string[]
  notes?: string
  estimatedSeniority?: Seniority
  estimatedSector?: string
  // Enrichment data
  linkedinHeadline?: string
  linkedinSummary?: string
  experiences?: Array<{
    company: string
    title: string
    startDate?: string
    endDate?: string
    description?: string
  }>
  education?: Array<{
    school: string
    degree?: string
    field?: string
    year?: string
  }>
  skills?: string[]
  languages?: string[]
}) {
  const organizationId = await getOrganizationId()

  // Check for duplicates
  if (data.email || data.profileUrl) {
    const existing = await checkCandidateExists({
      email: data.email,
      profileUrl: data.profileUrl,
      firstName: data.firstName,
      lastName: data.lastName,
    })
    
    if (existing.exists && existing.candidate) {
      throw new Error(`Un candidat avec ce profil existe déjà: ${existing.candidate.firstName} ${existing.candidate.lastName}`)
    }
  }

  const hasEnrichmentData = data.linkedinHeadline || data.linkedinSummary || 
    (data.experiences && data.experiences.length > 0) ||
    (data.education && data.education.length > 0) ||
    (data.skills && data.skills.length > 0)

  const candidate = await prisma.candidate.create({
    data: {
      organizationId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      location: data.location || null,
      currentPosition: data.currentPosition || null,
      currentCompany: data.currentCompany || null,
      profileUrl: data.profileUrl || null,
      tags: data.tags || [],
      notes: data.notes || null,
      estimatedSeniority: data.estimatedSeniority || null,
      estimatedSector: data.estimatedSector || null,
      status: 'ACTIVE',
      // Create enrichment if we have LinkedIn data
      ...(hasEnrichmentData ? {
        enrichment: {
          create: {
            linkedinUrl: data.profileUrl || null,
            linkedinHeadline: data.linkedinHeadline || null,
            linkedinSummary: data.linkedinSummary || null,
            experiences: data.experiences as object || null,
            education: data.education as object || null,
            skills: data.skills || [],
            languages: data.languages || [],
            lastEnrichedAt: new Date(),
            enrichmentSource: 'manual',
          },
        },
      } : {}),
    },
    include: {
      enrichment: true,
    },
  })

  revalidatePath('/candidates')
  return candidate
}

