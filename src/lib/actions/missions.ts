'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { MissionStatus, ContractType, Seniority, Visibility, Prisma } from '@/generated/prisma'

// Visibility enum for schema
const visibilityEnum = z.enum(['INTERNAL', 'INTERNAL_CLIENT', 'INTERNAL_CANDIDATE', 'ALL'])

// Schema - all fields with defaults are optional on input
const missionSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  mainContactId: z.string().optional(),
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

  internalNotes: z.string().optional(),
  shortlistDeadline: z.date().optional(),
})

// Input type for creating missions (makes optional fields truly optional)
export type CreateMissionInput = z.input<typeof missionSchema>

// Import secure auth helpers
import { getOrganizationId, getCurrentUserId } from '@/lib/auth/helpers'

// Type for mission with _count
export type MissionWithCount = Prisma.MissionGetPayload<{
  select: {
    id: true
    title: true
    status: true
    location: true
    contractType: true
    seniority: true
    createdAt: true
    updatedAt: true
    client: {
      select: {
        id: true
        companyName: true
      }
    }
    recruiter: {
      select: {
        id: true
        name: true
      }
    }
    _count: {
      select: {
        missionCandidates: true
      }
    }
  }
}>

// Get all missions with pagination
export async function getMissions(filters?: {
  status?: MissionStatus
  clientId?: string
  search?: string
  page?: number
  limit?: number
}): Promise<{
  missions: MissionWithCount[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> {
  const organizationId = await getOrganizationId()
  const page = filters?.page || 1
  const limit = Math.min(filters?.limit || 50, 100) // Max 100 per page
  const skip = (page - 1) * limit

  // Build where clause once to avoid duplication
  const searchMode = 'insensitive' as const

  const whereClause: Prisma.MissionWhereInput = {
    organizationId,
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.clientId ? { clientId: filters.clientId } : {}),
    ...(filters?.search ? {
      OR: [
        { title: { contains: filters.search, mode: searchMode } },
        { client: { companyName: { contains: filters.search, mode: searchMode } } },
      ] satisfies Prisma.MissionWhereInput[],
    } : {}),
  }

  const [missions, total] = await Promise.all([
    prisma.mission.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        status: true,
        location: true,
        contractType: true,
        seniority: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: { id: true, companyName: true },
        },
        recruiter: {
          select: { id: true, name: true },
        },
        _count: {
          select: { missionCandidates: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.mission.count({
      where: whereClause,
    }),
  ])

  return {
    missions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// Light mission payload for header (no questionnaire, missionCandidates, shortlists)
export type MissionHeaderPayload = Prisma.MissionGetPayload<{
  select: {
    id: true
    clientId: true
    title: true
    status: true
    location: true
    city: true
    country: true
    client: { select: { id: true; companyName: true } }
    mainContact: {
      select: { id: true; firstName: true; lastName: true; email: true }
    }
    recruiter: { select: { id: true; name: true; email: true } }
    _count: { select: { missionCandidates: true } }
  }
}>

export async function getMissionHeader(id: string): Promise<MissionHeaderPayload | null> {
  const organizationId = await getOrganizationId()

  const mission = await prisma.mission.findFirst({
    where: { id, organizationId },
    select: {
      id: true,
      clientId: true,
      title: true,
      status: true,
      location: true,
      city: true,
      country: true,
      client: {
        select: { id: true, companyName: true },
      },
      mainContact: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      recruiter: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { missionCandidates: true },
      },
    },
  })

  return mission
}

/** Mission row for detail page / edit form: scalars + client, contacts, shortlists — no pipeline payload. */
export type MissionDetailOverview = Prisma.MissionGetPayload<{
  select: {
    id: true
    organizationId: true
    clientId: true
    mainContactId: true
    recruiterId: true
    title: true
    jobFamily: true
    status: true
    location: true
    city: true
    country: true
    isRemote: true
    domain: true
    sector: true
    priority: true
    contractType: true
    seniority: true
    salaryMin: true
    salaryMax: true
    salaryNotes: true
    internalNotes: true
    languages: true
    salaryVisible: true
    startDate: true
    currency: true
    context: true
    contextVisibility: true
    responsibilities: true
    responsibilitiesVisibility: true
    mustHave: true
    mustHaveVisibility: true
    niceToHave: true
    niceToHaveVisibility: true
    redFlags: true
    process: true
    processVisibility: true
    shortlistDeadline: true
    deadline: true
    createdAt: true
    updatedAt: true
    client: {
      select: {
        id: true
        companyName: true
        category: true
        sector: true
        website: true
      }
    }
    mainContact: {
      select: {
        id: true
        firstName: true
        lastName: true
        email: true
        title: true
        isPrimary: true
      }
    }
    recruiter: {
      select: {
        id: true
        name: true
        email: true
      }
    }
    shortlists: {
      select: {
        id: true
        name: true
        clientPortalUrl: true
        accessTokenExpiry: true
        createdAt: true
        _count: {
          select: { candidates: true }
        }
      }
    }
    _count: {
      select: { missionCandidates: true }
    }
  }
}>

const missionOverviewSelect = {
  id: true,
  organizationId: true,
  clientId: true,
  mainContactId: true,
  recruiterId: true,
  title: true,
  jobFamily: true,
  status: true,
  location: true,
  city: true,
  country: true,
  isRemote: true,
  domain: true,
  sector: true,
  priority: true,
  contractType: true,
  seniority: true,
  salaryMin: true,
  salaryMax: true,
  salaryNotes: true,
  internalNotes: true,
  languages: true,
  salaryVisible: true,
  startDate: true,
  currency: true,
  context: true,
  contextVisibility: true,
  responsibilities: true,
  responsibilitiesVisibility: true,
  mustHave: true,
  mustHaveVisibility: true,
  niceToHave: true,
  niceToHaveVisibility: true,
  redFlags: true,
  process: true,
  processVisibility: true,
  shortlistDeadline: true,
  deadline: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: {
      id: true,
      companyName: true,
      category: true,
      sector: true,
      website: true,
    },
  },
  mainContact: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      title: true,
      isPrimary: true,
    },
  },
  recruiter: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  shortlists: {
    select: {
      id: true,
      name: true,
      clientPortalUrl: true,
      accessTokenExpiry: true,
      createdAt: true,
      _count: {
        select: { candidates: true },
      },
    },
    orderBy: { createdAt: 'desc' as const },
    take: 10,
  },
  _count: {
    select: { missionCandidates: true },
  },
} satisfies Prisma.MissionSelect

export async function getMissionOverview(id: string): Promise<MissionDetailOverview | null> {
  const organizationId = await getOrganizationId()

  const mission = await prisma.mission.findFirst({
    where: { id, organizationId },
    select: missionOverviewSelect,
  })

  return mission
}

const missionPipelineCandidateSelect = {
  select: {
    id: true,
    stage: true,
    contactStatus: true,
    portalToken: true,
    portalTokenExpiry: true,
    portalStep: true,
    portalCompleted: true,
    createdAt: true,
    candidate: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        currentPosition: true,
        currentCompany: true,
        city: true,
        country: true,
        tags: true,
        relationshipLevel: true,
      },
    },
    interactions: {
      select: {
        id: true,
        type: true,
        content: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' as const },
      take: 5,
    },
  },
  orderBy: { createdAt: 'desc' as const },
  take: 100,
} satisfies Prisma.MissionCandidateFindManyArgs

export type MissionPipelineCandidateRow = Prisma.MissionCandidateGetPayload<{
  select: typeof missionPipelineCandidateSelect.select
}>

/** Pipeline + sourcing tabs: mission candidates with nested candidate and recent interactions. */
export async function getMissionPipelineCandidates(id: string): Promise<MissionPipelineCandidateRow[]> {
  const organizationId = await getOrganizationId()

  const mission = await prisma.mission.findFirst({
    where: { id, organizationId },
    select: {
      missionCandidates: missionPipelineCandidateSelect,
    },
  })

  if (!mission) {
    throw new Error('Mission non trouvée')
  }

  return mission.missionCandidates
}

// Get single mission with optimized query (full payload — one round-trip; used by prefetch/cache)
export async function getMission(id: string) {
  const organizationId = await getOrganizationId()

  const mission = await prisma.mission.findFirst({
    where: {
      id,
      organizationId,
    },
    select: {
      ...missionOverviewSelect,
      missionCandidates: missionPipelineCandidateSelect,
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

  // Create mission with default questionnaire
  const mission = await prisma.mission.create({
    data: {
      title: validated.title,
      clientId: validated.clientId,
      mainContactId: validated.mainContactId || null,
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
      internalNotes: validated.internalNotes,
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
    select: { id: true, companyName: true },
    orderBy: [{ companyName: 'asc' }],
  })

  return clients
}

// Clients with contacts for mission form (mainContact select)
export async function getClientsWithContactsForSelect() {
  const organizationId = await getOrganizationId()

  const clients = await prisma.client.findMany({
    where: { organizationId },
    select: {
      id: true,
      companyName: true,
      contacts: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          title: true,
          isPrimary: true,
        },
        orderBy: { isPrimary: 'desc' },
      },
    },
    orderBy: [{ companyName: 'asc' }],
  })

  return clients
}

