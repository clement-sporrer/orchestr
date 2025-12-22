'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { PipelineStage, ContactStatus } from '@/generated/prisma'

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

// Update candidate stage
export async function updateCandidateStage(missionCandidateId: string, stage: PipelineStage) {
  const organizationId = await getOrganizationId()

  // Verify ownership through mission
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

  await prisma.missionCandidate.update({
    where: { id: missionCandidateId },
    data: { stage },
  })

  // Create status change interaction
  await prisma.interaction.create({
    data: {
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
    },
  })

  if (!mc || mc.mission.organizationId !== organizationId) {
    throw new Error('Candidat non trouvé')
  }

  await prisma.missionCandidate.update({
    where: { id: missionCandidateId },
    data: { contactStatus: status },
  })

  revalidatePath(`/missions/${mc.mission.id}`)
}

// Add candidate to mission
export async function addCandidateToMission(
  missionId: string, 
  candidateId: string,
  score?: number,
  scoreReasons?: string[]
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
      score,
      scoreReasons: scoreReasons || [],
    },
  })

  revalidatePath(`/missions/${missionId}`)
  return mc
}

// Remove candidate from mission
export async function removeCandidateFromMission(missionCandidateId: string, reason?: string) {
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

  await prisma.missionCandidate.update({
    where: { id: missionCandidateId },
    data: {
      stage: 'CLOSED_REJECTED',
      rejectedAt: new Date(),
      rejectionReason: reason,
    },
  })

  revalidatePath(`/missions/${mc.mission.id}`)
}

