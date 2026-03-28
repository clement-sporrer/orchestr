'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { generateToken, getTokenExpiry, hashToken } from '@/lib/utils/tokens'
import { applyStageTransition } from '@/lib/actions/pipeline'

// Generate portal token for candidate — stores hash, returns raw token for URL
export async function generatePortalToken(missionCandidateId: string): Promise<string> {
  const rawToken = generateToken()
  const tokenHash = hashToken(rawToken)
  const expiry = getTokenExpiry('candidate')

  await prisma.missionCandidate.update({
    where: { id: missionCandidateId },
    data: {
      portalToken: tokenHash,
      portalTokenExpiry: expiry,
      portalStep: 0,
      portalCompleted: false,
    },
  })

  return rawToken  // Return raw — caller builds the URL
}

// Update candidate portal progress — authenticated by portal token
export async function updateCandidatePortal(
  portalToken: string,
  data: {
    portalStep?: number
    candidateData?: {
      firstName?: string
      lastName?: string
      email?: string
      phone?: string
      linkedin?: string
    }
  }
): Promise<void> {
  const tokenHash = hashToken(portalToken)

  const mc = await prisma.missionCandidate.findFirst({
    where: { portalToken: tokenHash },
  })

  if (!mc) {
    throw new Error('Token invalide')
  }

  if (mc.portalTokenExpiry && mc.portalTokenExpiry < new Date()) {
    throw new Error('Lien expiré')
  }

  if (data.portalStep !== undefined) {
    await prisma.missionCandidate.update({
      where: { id: mc.id },
      data: { portalStep: data.portalStep },
    })
  }

  if (data.candidateData) {
    await prisma.candidate.update({
      where: { id: mc.candidateId },
      data: {
        ...data.candidateData,
        email: data.candidateData.email || null,
        linkedin: data.candidateData.linkedin || null,
      },
    })
  }
}

// Complete portal — authenticated by portal token
export async function completePortal(portalToken: string) {
  const tokenHash = hashToken(portalToken)

  const mc = await prisma.missionCandidate.findFirst({
    where: { portalToken: tokenHash },
    include: { mission: true },
  })

  if (!mc) {
    throw new Error('Token invalide')
  }

  if (mc.portalTokenExpiry && mc.portalTokenExpiry < new Date()) {
    throw new Error('Lien expiré')
  }

  if (mc.portalCompleted) {
    return  // Idempotent — already completed, nothing to do
  }

  // Only advance stage to RESPONSE if candidate is not already further in the pipeline.
  // All writes are in one transaction for atomicity.
  const stagesBeforeResponse: string[] = ['SOURCED', 'CONTACTED']

  await prisma.$transaction(async (tx) => {
    if (stagesBeforeResponse.includes(mc.stage)) {
      await applyStageTransition(mc.id, mc.candidateId, 'RESPONSE', tx)
    }

    await tx.missionCandidate.update({
      where: { id: mc.id },
      data: { portalCompleted: true },
    })

    await tx.candidate.update({
      where: { id: mc.candidateId },
      data: {
        consentGiven: true,
        consentDate: new Date(),
        consentText: 'Consentement donné via portail candidat',
      },
    })

    await tx.interaction.create({
      data: {
        organizationId: mc.mission.organizationId,
        candidateId: mc.candidateId,
        missionCandidateId: mc.id,
        type: 'PORTAL_COMPLETED',
        content: 'Le candidat a complété le portail',
      },
    })
  })

  revalidatePath(`/missions/${mc.missionId}`)
}
