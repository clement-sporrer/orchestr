'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

interface UpdateOrganizationData {
  name?: string
  logo?: string
  contactEmail?: string
  defaultCalendlyLink?: string
  retentionDaysIgnored?: number
  retentionDaysActive?: number
  onboardingCompleted?: boolean
}

// Helper to get current user's organization
async function getOrganizationId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    throw new Error('Non authentifie')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { organizationId: true },
  })

  if (!dbUser) {
    throw new Error('Utilisateur non trouve')
  }

  return dbUser.organizationId
}

export async function getOrganization() {
  const organizationId = await getOrganizationId()

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: true,
      _count: {
        select: {
          users: true,
          clients: true,
          missions: true,
          candidates: true,
        },
      },
    },
  })

  return organization
}

export async function updateOrganization(data: UpdateOrganizationData) {
  const organizationId = await getOrganizationId()

  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.logo !== undefined && { logo: data.logo }),
      ...(data.contactEmail !== undefined && { contactEmail: data.contactEmail }),
      ...(data.defaultCalendlyLink !== undefined && { defaultCalendlyLink: data.defaultCalendlyLink }),
      ...(data.retentionDaysIgnored !== undefined && { retentionDaysIgnored: data.retentionDaysIgnored }),
      ...(data.retentionDaysActive !== undefined && { retentionDaysActive: data.retentionDaysActive }),
      ...(data.onboardingCompleted !== undefined && { onboardingCompleted: data.onboardingCompleted }),
    },
  })

  revalidatePath('/settings')
  revalidatePath('/onboarding')
  return organization
}

export async function getOrganizationStats() {
  const organizationId = await getOrganizationId()

  const [
    usersCount,
    clientsCount,
    missionsCount,
    candidatesCount,
    activeMissions,
    recentCandidates,
  ] = await Promise.all([
    prisma.user.count({ where: { organizationId } }),
    prisma.client.count({ where: { organizationId } }),
    prisma.mission.count({ where: { organizationId } }),
    prisma.candidate.count({ where: { organizationId } }),
    prisma.mission.count({
      where: { organizationId, status: 'ACTIVE' },
    }),
    prisma.candidate.count({
      where: {
        organizationId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  return {
    users: usersCount,
    clients: clientsCount,
    missions: missionsCount,
    candidates: candidatesCount,
    activeMissions,
    recentCandidates,
  }
}

