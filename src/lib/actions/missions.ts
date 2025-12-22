'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { MissionStatus, ContractType, Seniority, Visibility } from '@/generated/prisma'

// Schema
const missionSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  title: z.string().min(1, 'Titre requis'),
  location: z.string().optional(),
  contractType: z.enum(['CDI', 'CDD', 'FREELANCE', 'INTERNSHIP', 'APPRENTICESHIP', 'OTHER']).optional(),
  seniority: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).optional(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryVisible: z.boolean().default(false),
  currency: z.string().default('EUR'),
  
  context: z.string().optional(),
  contextVisibility: z.enum(['INTERNAL', 'INTERNAL_CLIENT', 'INTERNAL_CANDIDATE', 'ALL']).default('INTERNAL'),
  
  responsibilities: z.string().optional(),
  responsibilitiesVisibility: z.enum(['INTERNAL', 'INTERNAL_CLIENT', 'INTERNAL_CANDIDATE', 'ALL']).default('ALL'),
  
  mustHave: z.string().optional(),
  mustHaveVisibility: z.enum(['INTERNAL', 'INTERNAL_CLIENT', 'INTERNAL_CANDIDATE', 'ALL']).default('ALL'),
  
  niceToHave: z.string().optional(),
  niceToHaveVisibility: z.enum(['INTERNAL', 'INTERNAL_CLIENT', 'INTERNAL_CANDIDATE', 'ALL']).default('ALL'),
  
  redFlags: z.string().optional(),
  
  process: z.string().optional(),
  processVisibility: z.enum(['INTERNAL', 'INTERNAL_CLIENT', 'INTERNAL_CANDIDATE', 'ALL']).default('INTERNAL_CLIENT'),
  
  calendlyLink: z.string().optional(),
  calendlyEmbed: z.boolean().default(false),
  
  scoreThreshold: z.number().min(0).max(100).default(60),
  shortlistDeadline: z.date().optional(),
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
export async function createMission(data: z.infer<typeof missionSchema>) {
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
    throw new Error('Client non trouvé')
  }

  const mission = await prisma.mission.create({
    data: {
      ...validated,
      organizationId,
      recruiterId,
      contractType: validated.contractType as ContractType | undefined,
      seniority: validated.seniority as Seniority | undefined,
      contextVisibility: validated.contextVisibility as Visibility,
      responsibilitiesVisibility: validated.responsibilitiesVisibility as Visibility,
      mustHaveVisibility: validated.mustHaveVisibility as Visibility,
      niceToHaveVisibility: validated.niceToHaveVisibility as Visibility,
      processVisibility: validated.processVisibility as Visibility,
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

