'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { Prisma } from '@/generated/prisma'

// Schemas (PRD v2: companyName required + uppercased, no legacy name field)
const clientSchema = z.object({
  companyName: z.string().min(1, 'Le nom entreprise est requis').transform(v => v.trim().toUpperCase()),
  category: z.string().optional(),
  sector: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

const contactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  email: z.string().min(1, "L'email est requis").email("Format email invalide"),
  phone: z.string().optional(),
  notes: z.string().optional(),
  isPrimary: z.boolean().optional(),
})

// Import secure auth helper
import { getOrganizationId } from '@/lib/auth/helpers'

// Type for client with _count and active missions info
export type ClientWithCount = Prisma.ClientGetPayload<{
  select: {
    id: true
    companyName: true
    category: true
    sector: true
    website: true
    notes: true
    createdAt: true
    updatedAt: true
    _count: {
      select: {
        missions: true
        contacts: true
      }
    }
  }
}> & {
  activeMissionsCount?: number
  placedCount?: number
}

// Client Actions with pagination
export async function getClients(
  search?: string,
  page?: number,
  limit?: number
): Promise<{
  clients: ClientWithCount[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> {
  const organizationId = await getOrganizationId()
  const pageNum = page || 1
  const limitNum = Math.min(limit || 50, 100) // Max 100 per page
  const skip = (pageNum - 1) * limitNum

  // Build where clause once to avoid duplication
  const searchMode = 'insensitive' as const

  const whereClause: Prisma.ClientWhereInput = {
    organizationId,
    ...(search ? {
      OR: [
        { companyName: { contains: search, mode: searchMode } },
        { category: { contains: search, mode: searchMode } },
        { sector: { contains: search, mode: searchMode } },
      ] satisfies Prisma.ClientWhereInput[],
    } : {}),
  }

  const [rawClients, total] = await Promise.all([
    prisma.client.findMany({
      where: whereClause,
      select: {
        id: true,
        companyName: true,
        category: true,
        sector: true,
        website: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            missions: true,
            contacts: true,
          },
        },
        missions: {
          select: {
            status: true,
            missionCandidates: {
              where: { stage: 'PLACED' },
              select: { id: true },
            },
          },
        },
      },
      orderBy: [{ companyName: 'asc' }],
      skip,
      take: limitNum,
    }),
    prisma.client.count({
      where: whereClause,
    }),
  ])

  // Enrich with computed counts
  const clients: ClientWithCount[] = rawClients.map(({ missions, ...client }) => ({
    ...client,
    activeMissionsCount: missions.filter(m => m.status === 'ACTIVE').length,
    placedCount: missions.reduce((sum, m) => sum + m.missionCandidates.length, 0),
  }))

  return {
    clients,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  }
}

export async function getClient(id: string) {
  const organizationId = await getOrganizationId()

  const client = await prisma.client.findFirst({
    where: {
      id,
      organizationId,
    },
    include: {
      contacts: {
        orderBy: [
          { lastName: { sort: 'asc', nulls: 'last' } },
          { firstName: { sort: 'asc', nulls: 'last' } },
          { email: 'asc' },
        ],
      },
      missions: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { missionCandidates: true },
          },
        },
      },
    },
  })

  if (!client) {
    throw new Error('Client non trouvé')
  }

  return client
}

export async function createClient(data: z.infer<typeof clientSchema>) {
  const organizationId = await getOrganizationId()
  const validated = clientSchema.parse(data)

  const client = await prisma.client.create({
    data: {
      companyName: validated.companyName,
      category: validated.category || null,
      sector: validated.sector || null,
      website: validated.website || null,
      notes: validated.notes || null,
      organizationId,
    },
  })

  revalidatePath('/clients')
  return client
}

export async function updateClient(id: string, data: z.infer<typeof clientSchema>) {
  const organizationId = await getOrganizationId()
  const validated = clientSchema.parse(data)

  const existing = await prisma.client.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Client non trouvé')
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      companyName: validated.companyName,
      category: validated.category || null,
      sector: validated.sector || null,
      website: validated.website || null,
      notes: validated.notes || null,
    },
  })

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}`)
  return client
}

export async function deleteClient(id: string) {
  const organizationId = await getOrganizationId()

  // Verify ownership
  const existing = await prisma.client.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Client non trouvé')
  }

  await prisma.client.delete({
    where: { id },
  })

  revalidatePath('/clients')
}

// Contact Actions
export async function createContact(clientId: string, data: z.infer<typeof contactSchema>) {
  const organizationId = await getOrganizationId()
  const validated = contactSchema.parse(data)

  // Verify client ownership
  const client = await prisma.client.findFirst({
    where: { id: clientId, organizationId },
  })

  if (!client) {
    throw new Error('Client non trouvé')
  }

  if (validated.isPrimary) {
    await prisma.contact.updateMany({
      where: { clientId },
      data: { isPrimary: false },
    })
  }

  const contact = await prisma.contact.create({
    data: {
      firstName: validated.firstName?.trim() || null,
      lastName: validated.lastName?.trim() || null,
      title: validated.title || null,
      email: validated.email,
      phone: validated.phone || null,
      notes: validated.notes || null,
      isPrimary: validated.isPrimary ?? false,
      clientId,
    },
  })

  revalidatePath(`/clients/${clientId}`)
  return contact
}

export async function updateContact(id: string, data: z.infer<typeof contactSchema>) {
  const organizationId = await getOrganizationId()
  const validated = contactSchema.parse(data)

  // Verify ownership through client
  const contact = await prisma.contact.findFirst({
    where: { id },
    include: { client: true },
  })

  if (!contact || contact.client.organizationId !== organizationId) {
    throw new Error('Contact non trouvé')
  }

  if (validated.isPrimary === true) {
    await prisma.contact.updateMany({
      where: { clientId: contact.clientId },
      data: { isPrimary: false },
    })
  }

  const updated = await prisma.contact.update({
    where: { id },
    data: {
      firstName: validated.firstName?.trim() ?? undefined,
      lastName: validated.lastName?.trim() ?? undefined,
      title: validated.title ?? undefined,
      email: validated.email,
      phone: validated.phone || null,
      notes: validated.notes ?? undefined,
      isPrimary: validated.isPrimary ?? undefined,
    },
  })

  revalidatePath(`/clients/${contact.clientId}`)
  return updated
}

export async function deleteContact(id: string) {
  const organizationId = await getOrganizationId()

  // Verify ownership through client
  const contact = await prisma.contact.findFirst({
    where: { id },
    include: { client: true },
  })

  if (!contact || contact.client.organizationId !== organizationId) {
    throw new Error('Contact non trouvé')
  }

  await prisma.contact.delete({
    where: { id },
  })

  revalidatePath(`/clients/${contact.clientId}`)
}

