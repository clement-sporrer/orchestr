'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { CandidateStatus, Prisma } from '@/generated/prisma'
import { parseLinkedInUrl, generateProfileTags, enrichProfileFromText, type EnrichedProfileData } from '@/lib/ai/structuring'
import { getOrganizationId, getCurrentUserId } from '@/lib/auth/helpers'
import {
  createCandidateSchema,
  updateCandidateSchema,
  candidateFiltersSchema,
  transformCandidateInput,
  type CreateCandidateInput,
  type UpdateCandidateInput,
  type CandidateFilters,
} from '@/lib/validations/candidate'
import { buildCandidateWhereClause } from '@/lib/filters/candidate-where'

// Type for candidate with _count
const candidateSelect: Prisma.CandidateSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  currentPosition: true,
  currentCompany: true,
  tags: true,
  status: true,
  relationshipLevel: true,
  createdAt: true,
  _count: {
    select: { missionCandidates: true },
  },
}

export type CandidateWithCount = Prisma.CandidateGetPayload<{
  select: typeof candidateSelect
}>

// Get all candidates with pagination and full filters
export async function getCandidates(filters?: Partial<CandidateFilters>): Promise<{
  candidates: CandidateWithCount[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> {
  const organizationId = await getOrganizationId()
  const validated = filters
    ? candidateFiltersSchema.partial().parse(filters)
    : {}
  const page = validated.page ?? 1
  const limit = Math.min(validated.limit ?? 50, 100)
  const skip = (page - 1) * limit

  const whereClause = buildCandidateWhereClause(organizationId, validated)

  const [candidates, total] = await Promise.all([
    prisma.candidate.findMany({
      where: whereClause,
      select: candidateSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.candidate.count({ where: whereClause }),
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

// Create candidate (full 28-field schema, validation + normalisation)
export async function createCandidate(data: CreateCandidateInput) {
  const organizationId = await getOrganizationId()
  const validated = createCandidateSchema.parse(data)
  const transformed = transformCandidateInput(validated)

  const dup = await checkCandidateDuplicate(transformed.email ?? null, transformed.linkedin ?? null, transformed.phone ?? null)
  if (dup.duplicate) {
    throw new Error(
      `Un candidat existe déjà (${dup.duplicate.matchField}): ${dup.duplicate.firstName} ${dup.duplicate.lastName}`
    )
  }

  const candidate = await prisma.candidate.create({
    data: {
      organizationId,
      firstName: transformed.firstName!,
      lastName: transformed.lastName!,
      email: transformed.email ?? null,
      linkedin: transformed.linkedin ?? null,
      phone: transformed.phone ?? null,
      age: transformed.age ?? null,
      country: transformed.country ?? null,
      city: transformed.city ?? null,
      region: transformed.region ?? null,
      languages: transformed.languages
        ? (transformed.languages as unknown as Prisma.InputJsonValue)
        : undefined,
      seniority: transformed.seniority ?? null,
      domain: transformed.domain ?? null,
      sector: transformed.sector ?? null,
      currentCompany: transformed.currentCompany ?? null,
      currentPosition: transformed.currentPosition ?? null,
      pastCompanies: transformed.pastCompanies ?? [],
      jobFamily: transformed.jobFamily ?? null,
      hardSkills: transformed.hardSkills ?? [],
      softSkills: transformed.softSkills ?? [],
      compensation: transformed.compensation ?? null,
      comments: transformed.comments ?? null,
      references: transformed.references ?? null,
      recruitable: transformed.recruitable ?? 'UNKNOWN',
      files: transformed.files ?? [],
      tags: transformed.tags ?? [],
      status: transformed.status ?? 'ACTIVE',
    },
  })

  revalidatePath('/candidates')
  return candidate
}

// Update candidate (partial: only provided fields are updated, validation + normalisation)
export async function updateCandidate(id: string, data: Partial<UpdateCandidateInput>) {
  const organizationId = await getOrganizationId()
  const validated = updateCandidateSchema.parse({ ...data, id })
  const transformed = transformCandidateInput(validated) as UpdateCandidateInput
  const { id: _id, ...transformedData } = transformed

  const existing = await prisma.candidate.findFirst({
    where: { id, organizationId },
    select: { id: true, email: true, linkedin: true },
  })
  if (!existing) throw new Error('Candidat non trouvé')

  if (transformedData.email !== undefined || transformedData.linkedin !== undefined || transformedData.phone !== undefined) {
    const dup = await checkCandidateDuplicate(
      transformedData.email ?? null,
      transformedData.linkedin ?? null,
      transformedData.phone ?? null,
    )
    if (dup.duplicate && dup.duplicate.id !== id) {
      throw new Error(
        `Un autre candidat existe avec ce profil (${dup.duplicate.matchField}): ${dup.duplicate.firstName} ${dup.duplicate.lastName}`
      )
    }
  }

  const keysProvided = new Set(Object.keys(data)) as Set<keyof UpdateCandidateInput>
  const updatePayload: Record<string, unknown> = {}
  for (const key of keysProvided) {
    if (key === 'id') continue
    const v = transformedData[key as keyof typeof transformedData]
    if (v === undefined) continue
    if (key === 'languages') {
      updatePayload[key] = v ? (v as unknown as Prisma.InputJsonValue) : undefined
    } else if (v === '') {
      updatePayload[key] = null
    } else {
      updatePayload[key] = v
    }
  }

  const candidate = await prisma.candidate.update({
    where: { id },
    data: updatePayload as Prisma.CandidateUpdateInput,
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
    type: 'MESSAGE' | 'EMAIL' | 'CALL' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_DONE' | 'NOTE' | 'STATUS_CHANGE'
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
      linkedin: cleanUrl,
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
        linkedin: linkedInUrl || '',
        tags: tagResult.tags,
        sector: tagResult.sector || enrichedData.sector || undefined,
        suggestedNotes: tagResult.suggestedNotes || enrichedData.suggestedNotes,
      },
      source: 'ai_enrichment',
    }
  } catch (error) {
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
  comments?: string
}): Promise<{ tags: string[]; sector?: string }> {
  try {
    const result = await generateProfileTags({
      currentPosition: candidateData.currentPosition,
      currentCompany: candidateData.currentCompany,
      summary: candidateData.comments,
    })

    return {
      tags: result.tags,
      sector: result.sector,
    }
  } catch {
    return { tags: [] }
  }
}

// Check if candidate already exists (for deduplication)
export async function checkCandidateExists(data: {
  email?: string
  linkedin?: string
  firstName?: string
  lastName?: string
}): Promise<{ exists: boolean; candidate?: { id: string; firstName: string; lastName: string } }> {
  const organizationId = await getOrganizationId()

  // Check by LinkedIn URL first (most reliable)
  if (data.linkedin) {
    const byUrl = await prisma.candidate.findFirst({
      where: {
        organizationId,
        linkedin: data.linkedin,
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
        firstName: { equals: data.firstName, mode: 'insensitive' as const },
        lastName: { equals: data.lastName, mode: 'insensitive' as const },
        status: { not: 'DELETED' as const },
      },
      select: { id: true, firstName: true, lastName: true },
    })
    if (byName) {
      return { exists: true, candidate: byName }
    }
  }

  return { exists: false }
}

// ============================================
// DEDUPLICATION SERVICE
// ============================================

/** Normalize phone number for comparison (strip spaces, dashes, dots, country code prefix) */
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-.()+]/g, '')
  // Normalize French prefix: 0033 or 33 → 0
  if (normalized.startsWith('0033')) normalized = '0' + normalized.slice(4)
  else if (normalized.startsWith('33') && normalized.length > 10) normalized = '0' + normalized.slice(2)
  return normalized
}

/** Normalize LinkedIn URL for comparison */
function normalizeLinkedIn(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '')
    .replace(/\?.*$/, '')
}

export interface DuplicateMatch {
  id: string
  firstName: string
  lastName: string
  email: string | null
  linkedin: string | null
  phone: string | null
  currentCompany: string | null
  currentPosition: string | null
  matchField: 'email' | 'linkedin' | 'phone'
  confidence: 'high' | 'medium'
}

/** Check duplicate by email, LinkedIn, or phone. Returns existing candidate if found. */
export async function checkCandidateDuplicate(
  email?: string | null,
  linkedin?: string | null,
  phone?: string | null,
): Promise<{
  success: boolean
  duplicate: DuplicateMatch | null
  error?: string
}> {
  const organizationId = await getOrganizationId()
  if (!email && !linkedin && !phone) return { success: true, duplicate: null }

  const selectFields = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    linkedin: true,
    phone: true,
    currentCompany: true,
    currentPosition: true,
  } as const

  // 1. Check by email (high confidence)
  if (email) {
    const byEmail = await prisma.candidate.findFirst({
      where: { organizationId, status: { not: 'DELETED' }, email },
      select: selectFields,
    })
    if (byEmail) {
      return { success: true, duplicate: { ...byEmail, matchField: 'email', confidence: 'high' } }
    }
  }

  // 2. Check by LinkedIn (high confidence)
  if (linkedin) {
    const normalizedUrl = normalizeLinkedIn(linkedin)
    const byLinkedin = await prisma.candidate.findFirst({
      where: { organizationId, status: { not: 'DELETED' }, linkedin: { contains: normalizedUrl, mode: 'insensitive' } },
      select: selectFields,
    })
    if (byLinkedin) {
      return { success: true, duplicate: { ...byLinkedin, matchField: 'linkedin', confidence: 'high' } }
    }
  }

  // 3. Check by phone (medium confidence - formatting can differ)
  if (phone) {
    const normalizedPhone = normalizePhone(phone)
    if (normalizedPhone.length >= 9) {
      // Fetch candidates with phones and compare normalized
      const withPhones = await prisma.candidate.findMany({
        where: { organizationId, status: { not: 'DELETED' }, phone: { not: null } },
        select: selectFields,
      })
      const byPhone = withPhones.find(c => c.phone && normalizePhone(c.phone) === normalizedPhone)
      if (byPhone) {
        return { success: true, duplicate: { ...byPhone, matchField: 'phone', confidence: 'medium' } }
      }
    }
  }

  return { success: true, duplicate: null }
}

/** Merge two candidates: keep `targetId`, absorb data from `sourceId`, then soft-delete source. */
export async function mergeCandidates(targetId: string, sourceId: string) {
  const organizationId = await getOrganizationId()

  const [target, source] = await Promise.all([
    prisma.candidate.findFirst({ where: { id: targetId, organizationId, status: { not: 'DELETED' } } }),
    prisma.candidate.findFirst({ where: { id: sourceId, organizationId, status: { not: 'DELETED' } } }),
  ])

  if (!target || !source) throw new Error('Candidat non trouvé')
  if (target.id === source.id) throw new Error('Impossible de fusionner un candidat avec lui-même')

  // Build update payload: fill gaps in target from source
  const mergePayload: Record<string, unknown> = {}
  const fieldsToMerge = [
    'email', 'linkedin', 'phone', 'age', 'country', 'city', 'region',
    'seniority', 'domain', 'sector', 'currentCompany', 'currentPosition',
    'pastCompanies', 'jobFamily', 'hardSkills', 'softSkills',
    'compensation', 'comments', 'references',
  ] as const

  for (const field of fieldsToMerge) {
    if (!target[field] && source[field]) {
      mergePayload[field] = source[field]
    }
  }

  // Merge tags (union)
  const mergedTags = [...new Set([...target.tags, ...source.tags])]
  mergePayload.tags = mergedTags

  // Track merge
  mergePayload.mergedFromIds = [...target.mergedFromIds, source.id]

  // Update comments: append source comments if different
  if (source.comments && source.comments !== target.comments) {
    mergePayload.comments = target.comments
      ? `${target.comments}\n\n--- Fusionné depuis ${source.firstName} ${source.lastName} ---\n${source.comments}`
      : source.comments
  }

  // Transaction: update target, reassign source's relations, soft-delete source
  await prisma.$transaction(async (tx) => {
    // 1. Update target with merged data
    await tx.candidate.update({
      where: { id: targetId },
      data: mergePayload as Prisma.CandidateUpdateInput,
    })

    // 2. Reassign mission candidates (skip duplicates)
    const sourceMissions = await tx.missionCandidate.findMany({
      where: { candidateId: sourceId },
    })
    for (const mc of sourceMissions) {
      const exists = await tx.missionCandidate.findFirst({
        where: { missionId: mc.missionId, candidateId: targetId },
      })
      if (!exists) {
        await tx.missionCandidate.update({
          where: { id: mc.id },
          data: { candidateId: targetId },
        })
      }
    }

    // 3. Reassign interactions
    await tx.interaction.updateMany({
      where: { candidateId: sourceId },
      data: { candidateId: targetId },
    })

    // 4. Reassign pool memberships (skip duplicates)
    const sourcePools = await tx.candidatePool.findMany({
      where: { candidateId: sourceId },
    })
    for (const pm of sourcePools) {
      const exists = await tx.candidatePool.findFirst({
        where: { poolId: pm.poolId, candidateId: targetId },
      })
      if (!exists) {
        await tx.candidatePool.update({
          where: { id: pm.id },
          data: { candidateId: targetId },
        })
      }
    }

    // 5. Soft-delete source
    await tx.candidate.update({
      where: { id: sourceId },
      data: { status: 'DELETED' },
    })
  })

  revalidatePath('/candidates')
  revalidatePath(`/candidates/${targetId}`)
  return { success: true, mergedInto: targetId }
}


