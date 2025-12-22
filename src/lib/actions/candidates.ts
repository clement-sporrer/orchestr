'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { CandidateStatus, Seniority } from '@/generated/prisma'

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
  status: z.enum(['ACTIVE', 'TO_RECONTACT', 'BLACKLIST', 'DELETED']).default('ACTIVE'),
})

// Helper to get current user's organization
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

// Get all candidates
export async function getCandidates(filters?: {
  search?: string
  status?: CandidateStatus
  tags?: string[]
  poolId?: string
}) {
  const organizationId = await getOrganizationId()

  const candidates = await prisma.candidate.findMany({
    where: {
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
    },
    include: {
      _count: {
        select: { missionCandidates: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return candidates
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
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    throw new Error('Non authentifié')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
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

