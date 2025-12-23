'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { generateToken, getTokenExpiry } from '@/lib/utils/tokens'

// Generate portal token for candidate
export async function generatePortalToken(missionCandidateId: string) {
  const token = generateToken()
  const expiry = getTokenExpiry('candidate')

  await prisma.missionCandidate.update({
    where: { id: missionCandidateId },
    data: {
      portalToken: token,
      portalTokenExpiry: expiry,
      portalStep: 0,
      portalCompleted: false,
    },
  })

  return token
}

// Update candidate portal progress
export async function updateCandidatePortal(
  missionCandidateId: string,
  data: {
    portalStep?: number
    candidateData?: {
      firstName?: string
      lastName?: string
      email?: string
      phone?: string
      profileUrl?: string
    }
  }
) {
  const mc = await prisma.missionCandidate.findUnique({
    where: { id: missionCandidateId },
  })

  if (!mc) {
    throw new Error('Non trouvé')
  }

  // Update mission candidate
  if (data.portalStep !== undefined) {
    await prisma.missionCandidate.update({
      where: { id: missionCandidateId },
      data: { portalStep: data.portalStep },
    })
  }

  // Update candidate data
  if (data.candidateData) {
    await prisma.candidate.update({
      where: { id: mc.candidateId },
      data: {
        ...data.candidateData,
        email: data.candidateData.email || null,
        profileUrl: data.candidateData.profileUrl || null,
      },
    })
  }
}

// Complete portal
export async function completePortal(missionCandidateId: string) {
  const mc = await prisma.missionCandidate.findUnique({
    where: { id: missionCandidateId },
    include: { mission: true },
  })

  if (!mc) {
    throw new Error('Non trouvé')
  }

  // Update mission candidate
  await prisma.missionCandidate.update({
    where: { id: missionCandidateId },
    data: {
      portalCompleted: true,
      stage: 'RESPONSE_RECEIVED',
    },
  })

  // Update candidate consent
  await prisma.candidate.update({
    where: { id: mc.candidateId },
    data: {
      consentGiven: true,
      consentDate: new Date(),
      consentText: 'Consentement donné via portail candidat',
    },
  })

  // Get organizationId from mission
  const mission = await prisma.mission.findUnique({
    where: { id: mc.missionId },
    select: { organizationId: true },
  })

  if (!mission) {
    throw new Error('Mission non trouvée')
  }

  // Create interaction
  await prisma.interaction.create({
    data: {
      organizationId: mission.organizationId,
      candidateId: mc.candidateId,
      missionCandidateId,
      type: 'PORTAL_COMPLETED',
      content: 'Le candidat a complété le portail',
    },
  })

  revalidatePath(`/missions/${mc.missionId}`)
}



