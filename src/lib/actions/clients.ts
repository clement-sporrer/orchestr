'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Schemas
const clientSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  sector: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

const contactSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  role: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
})

// Helper to get current user's organization
async function getOrganizationId(): Promise<string> {
  const supabase = await createSupabaseClient()
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

// Client Actions
export async function getClients(search?: string) {
  const organizationId = await getOrganizationId()

  const clients = await prisma.client.findMany({
    where: {
      organizationId,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sector: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      _count: {
        select: {
          missions: true,
          contacts: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  return clients
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
        orderBy: { name: 'asc' },
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
      ...validated,
      website: validated.website || null,
      organizationId,
    },
  })

  revalidatePath('/clients')
  return client
}

export async function updateClient(id: string, data: z.infer<typeof clientSchema>) {
  const organizationId = await getOrganizationId()
  const validated = clientSchema.parse(data)

  // Verify ownership
  const existing = await prisma.client.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Client non trouvé')
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      ...validated,
      website: validated.website || null,
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

  const contact = await prisma.contact.create({
    data: {
      ...validated,
      email: validated.email || null,
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

  const updated = await prisma.contact.update({
    where: { id },
    data: {
      ...validated,
      email: validated.email || null,
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

