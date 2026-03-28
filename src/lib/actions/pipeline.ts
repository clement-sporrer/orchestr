'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { generateToken, getTokenExpiry, hashToken } from '@/lib/utils/tokens'
import type { PipelineStage, ContactStatus, RelationshipLevel } from '@/generated/prisma'
import { getOrganizationId } from '@/lib/auth/helpers'

// Ordered list for RelationshipLevel comparison (lowest → highest)
const RELATIONSHIP_ORDER: RelationshipLevel[] = [
  'SOURCED',
  'CONTACTED',
  'ENGAGED',
  'QUALIFIED',
  'SHORTLISTED',
  'PLACED',
]

// Maps a PipelineStage to the equivalent RelationshipLevel
export function getTargetRelationshipLevel(stage: PipelineStage): RelationshipLevel {
  const map: Record<PipelineStage, RelationshipLevel> = {
    SOURCED: 'SOURCED',
    CONTACTED: 'CONTACTED',
    RESPONSE: 'CONTACTED',
    INTERVIEW: 'ENGAGED',
    SHORTLIST: 'SHORTLISTED',
    OFFER: 'SHORTLISTED',
    PLACED: 'PLACED',
  }
  return map[stage]
}

// Returns true only if target is strictly higher than current
export function shouldUpgradeRelationship(
  current: RelationshipLevel,
  target: RelationshipLevel
): boolean {
  return RELATIONSHIP_ORDER.indexOf(target) > RELATIONSHIP_ORDER.indexOf(current)
}

/**
 * Internal: apply a stage transition + sync RelationshipLevel.
 * No auth check — caller must verify ownership before calling.
 * No interaction created — caller creates the relevant interaction.
 */
export async function applyStageTransition(
  missionCandidateId: string,
  candidateId: string,
  stage: PipelineStage
): Promise<void> {
  await prisma.missionCandidate.update({
    where: { id: missionCandidateId },
    data: { stage },
  })

  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: { relationshipLevel: true },
  })

  if (!candidate) return

  const targetRelationship = getTargetRelationshipLevel(stage)
  if (shouldUpgradeRelationship(candidate.relationshipLevel, targetRelationship)) {
    await prisma.candidate.update({
      where: { id: candidateId },
      data: { relationshipLevel: targetRelationship },
    })
  }
}

// Update candidate stage
export async function updateCandidateStage(missionCandidateId: string, stage: PipelineStage) {
  const organizationId = await getOrganizationId()

  const mc = await prisma.missionCandidate.findFirst({
    where: { id: missionCandidateId },
    include: {
      mission: {
        select: { organizationId: true, id: true },
      },
    },
  })

  if (!mc || mc.mission.organizationId !== organizationId) {
    throw new Error('Candidat non trouvé')
  }

  await applyStageTransition(missionCandidateId, mc.candidateId, stage)

  await prisma.interaction.create({
    data: {
      organizationId: mc.mission.organizationId,
      candidateId: mc.candidateId,
      missionCandidateId: mc.id,
      type: 'STATUS_CHANGE',
      content: `Étape changée vers ${stage}`,
    },
  })

  revalidatePath(`/missions/${mc.mission.id}`)
}

// Update contact status
export async function updateContactStatus(missionCandidateId: string, status: ContactStatus) {
  const organizationId = await getOrganizationId()

  const mc = await prisma.missionCandidate.findFirst({
    where: { id: missionCandidateId },
    include: {
      mission: {
        select: { organizationId: true, id: true },
      },
      candidate: {
        select: { id: true, firstName: true },
      },
    },
  })

  if (!mc || mc.mission.organizationId !== organizationId) {
    throw new Error('Candidat non trouvé')
  }

  // Update the contact status
  const updated = await prisma.missionCandidate.update({
    where: { id: missionCandidateId },
    data: { contactStatus: status },
  })

  // AUTO-GENERATE PORTAL LINK ON POSITIVE RESPONSE
  let portalUrl: string | null = null
  if (status === 'OPEN' && !mc.portalToken) {
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

    portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/candidate/${rawToken}`

    await prisma.interaction.create({
      data: {
        organizationId: mc.mission.organizationId,
        candidateId: mc.candidate.id,
        missionCandidateId,
        type: 'PORTAL_INVITED',
        content: portalUrl,
      },
    })
  }

  revalidatePath(`/missions/${mc.mission.id}`)
  
  return { ...updated, portalUrl }
}

// Get portal URL for a mission candidate
// NOTE: After token hashing, the raw token is only available at generation time.
// This function always returns null — the URL must be captured at generation time.
export async function getPortalUrl(_missionCandidateId: string): Promise<null> {
  return null
}

// Add candidate to mission
export async function addCandidateToMission(
  missionId: string, 
  candidateId: string,
) {
  const organizationId = await getOrganizationId()

  // Verify mission ownership
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, organizationId },
  })

  if (!mission) {
    throw new Error('Mission non trouvée')
  }

  // Verify candidate ownership
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, organizationId },
  })

  if (!candidate) {
    throw new Error('Candidat non trouvé')
  }

  // Check if already in mission
  const existing = await prisma.missionCandidate.findFirst({
    where: { missionId, candidateId },
  })

  if (existing) {
    throw new Error('Candidat déjà dans cette mission')
  }

  const mc = await prisma.missionCandidate.create({
    data: {
      missionId,
      candidateId,
    },
  })

  revalidatePath(`/missions/${missionId}`)
  revalidatePath('/candidates')
  return mc
}

// Remove candidate from mission
export async function removeCandidateFromMission(missionCandidateId: string) {
  const organizationId = await getOrganizationId()

  const mc = await prisma.missionCandidate.findFirst({
    where: { id: missionCandidateId },
    include: {
      mission: {
        select: { organizationId: true, id: true },
      },
    },
  })

  if (!mc || mc.mission.organizationId !== organizationId) {
    throw new Error('Candidat non trouvé')
  }

  await prisma.missionCandidate.delete({
    where: { id: missionCandidateId },
  })

  revalidatePath(`/missions/${mc.mission.id}`)
}

