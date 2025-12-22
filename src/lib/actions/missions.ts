'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { MissionStatus, ContractType, Seniority, Visibility } from '@/generated/prisma'

// Visibility enum for schema
const visibilityEnum = z.enum(['INTERNAL', 'INTERNAL_CLIENT', 'INTERNAL_CANDIDATE', 'ALL'])

// Schema - all fields with defaults are optional on input
const missionSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  title: z.string().min(1, 'Titre requis'),
  location: z.string().optional(),
  contractType: z.enum(['CDI', 'CDD', 'FREELANCE', 'INTERNSHIP', 'APPRENTICESHIP', 'OTHER']).optional(),
  seniority: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryVisible: z.boolean().optional(),
  currency: z.string().optional(),
  
  context: z.string().optional(),
  contextVisibility: visibilityEnum.optional(),
  
  responsibilities: z.string().optional(),
  responsibilitiesVisibility: visibilityEnum.optional(),
  
  mustHave: z.string().optional(),
  mustHaveVisibility: visibilityEnum.optional(),
  
  niceToHave: z.string().optional(),
  niceToHaveVisibility: visibilityEnum.optional(),
  
  redFlags: z.string().optional(),
  
  process: z.string().optional(),
  processVisibility: visibilityEnum.optional(),
  
  calendlyLink: z.string().optional(),
  calendlyEmbed: z.boolean().optional(),
  
  scoreThreshold: z.number().min(0).max(100).optional(),
  shortlistDeadline: z.date().optional(),
})

// Input type for creating missions (makes optional fields truly optional)
export type CreateMissionInput = z.input<typeof missionSchema>

// Helper to get current user's organization
async function getOrganizationId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    throw new Error('Non authentifié')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { organizationId: true, id: true },
  })

  if (!dbUser) {
    throw new Error('Utilisateur non trouvé')
  }

  return dbUser.organizationId
}

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    throw new Error('Non authentifié')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  })

  if (!dbUser) {
    throw new Error('Utilisateur non trouvé')
  }

  return dbUser.id
}

// Get all missions
export async function getMissions(filters?: {
  status?: MissionStatus
  clientId?: string
  search?: string
}) {
  const organizationId = await getOrganizationId()

  const missions = await prisma.mission.findMany({
    where: {
      organizationId,
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.clientId ? { clientId: filters.clientId } : {}),
      ...(filters?.search ? {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { client: { name: { contains: filters.search, mode: 'insensitive' } } },
        ],
      } : {}),
    },
    include: {
      client: {
        select: { name: true },
      },
      recruiter: {
        select: { name: true },
      },
      _count: {
        select: { missionCandidates: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return missions
}

// Get single mission
export async function getMission(id: string) {
  const organizationId = await getOrganizationId()

  const mission = await prisma.mission.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      client: true,
      recruiter: true,
      questionnaire: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
        },
      },
      missionCandidates: {
        include: {
          candidate: true,
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      shortlists: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!mission) {
    throw new Error('Mission non trouvée')
  }

  return mission
}

// Create mission
export async function createMission(data: CreateMissionInput) {
  const organizationId = await getOrganizationId()
  const recruiterId = await getCurrentUserId()
  const validated = missionSchema.parse(data)

  // Verify client belongs to organization
  const client = await prisma.client.findFirst({
    where: {
      id: validated.clientId,
      organizationId,
    },
  })

  if (!client) {
    throw new Error('Client non trouve')
  }

  const mission = await prisma.mission.create({
    data: {
      title: validated.title,
      clientId: validated.clientId,
      organizationId,
      recruiterId,
      location: validated.location,
      contractType: validated.contractType as ContractType | undefined,
      seniority: validated.seniority as Seniority | undefined,
      salaryMin: validated.salaryMin,
      salaryMax: validated.salaryMax,
      salaryVisible: validated.salaryVisible ?? false,
      currency: validated.currency ?? 'EUR',
      context: validated.context,
      contextVisibility: (validated.contextVisibility ?? 'INTERNAL') as Visibility,
      responsibilities: validated.responsibilities,
      responsibilitiesVisibility: (validated.responsibilitiesVisibility ?? 'ALL') as Visibility,
      mustHave: validated.mustHave,
      mustHaveVisibility: (validated.mustHaveVisibility ?? 'ALL') as Visibility,
      niceToHave: validated.niceToHave,
      niceToHaveVisibility: (validated.niceToHaveVisibility ?? 'ALL') as Visibility,
      redFlags: validated.redFlags,
      process: validated.process,
      processVisibility: (validated.processVisibility ?? 'INTERNAL_CLIENT') as Visibility,
      calendlyLink: validated.calendlyLink,
      calendlyEmbed: validated.calendlyEmbed ?? false,
      scoreThreshold: validated.scoreThreshold ?? 60,
      shortlistDeadline: validated.shortlistDeadline,
    },
  })

  revalidatePath('/missions')
  return mission
}

// Update mission
export async function updateMission(id: string, data: Partial<z.infer<typeof missionSchema>>) {
  const organizationId = await getOrganizationId()

  // Verify ownership
  const existing = await prisma.mission.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Mission non trouvée')
  }

  const mission = await prisma.mission.update({
    where: { id },
    data: {
      ...data,
      contractType: data.contractType as ContractType | undefined,
      seniority: data.seniority as Seniority | undefined,
      contextVisibility: data.contextVisibility as Visibility | undefined,
      responsibilitiesVisibility: data.responsibilitiesVisibility as Visibility | undefined,
      mustHaveVisibility: data.mustHaveVisibility as Visibility | undefined,
      niceToHaveVisibility: data.niceToHaveVisibility as Visibility | undefined,
      processVisibility: data.processVisibility as Visibility | undefined,
    },
  })

  revalidatePath('/missions')
  revalidatePath(`/missions/${id}`)
  return mission
}

// Update mission status
export async function updateMissionStatus(id: string, status: MissionStatus) {
  const organizationId = await getOrganizationId()

  const existing = await prisma.mission.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Mission non trouvée')
  }

  const mission = await prisma.mission.update({
    where: { id },
    data: { status },
  })

  revalidatePath('/missions')
  revalidatePath(`/missions/${id}`)
  return mission
}

// Delete mission
export async function deleteMission(id: string) {
  const organizationId = await getOrganizationId()

  const existing = await prisma.mission.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Mission non trouvée')
  }

  await prisma.mission.delete({
    where: { id },
  })

  revalidatePath('/missions')
}

// Get clients for mission form
export async function getClientsForSelect() {
  const organizationId = await getOrganizationId()

  const clients = await prisma.client.findMany({
    where: { organizationId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  return clients
}

