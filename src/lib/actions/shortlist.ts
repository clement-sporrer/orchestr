'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { generateToken, getTokenExpiry } from '@/lib/utils/tokens'
import type { FeedbackDecision } from '@/generated/prisma'
import { getOrganizationId } from '@/lib/auth/helpers'

// Create shortlist
export async function createShortlist(
  missionId: string,
  name: string,
  candidateIds: string[]
) {
  const organizationId = await getOrganizationId()

  // Verify mission ownership
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, organizationId },
  })

  if (!mission) {
    throw new Error('Mission non trouvée')
  }

  const token = generateToken()
  const expiry = getTokenExpiry('client')

  const shortlist = await prisma.shortlist.create({
    data: {
      missionId,
      name,
      accessToken: token,
      accessTokenExpiry: expiry,
      candidates: {
        create: candidateIds.map((mcId, index) => ({
          missionCandidateId: mcId,
          order: index,
        })),
      },
    },
  })

  // Update mission candidates stage
  await prisma.missionCandidate.updateMany({
    where: { id: { in: candidateIds } },
    data: { stage: 'SHORTLIST' },
  })

  revalidatePath(`/missions/${missionId}`)
  return shortlist
}

// Submit client feedback
export async function submitClientFeedback(
  shortlistCandidateId: string,
  data: {
    decision: FeedbackDecision
    comment?: string
  }
) {
  const shortlistCandidate = await prisma.shortlistCandidate.findUnique({
    where: { id: shortlistCandidateId },
    include: {
      shortlist: true,
      missionCandidate: true,
    },
  })

  if (!shortlistCandidate) {
    throw new Error('Non trouvé')
  }

  // Upsert feedback
  await prisma.clientFeedback.upsert({
    where: { shortlistCandidateId },
    create: {
      shortlistCandidateId,
      decision: data.decision,
      comment: data.comment,
    },
    update: {
      decision: data.decision,
      comment: data.comment,
    },
  })

  // Get organizationId from mission
  const mission = await prisma.mission.findUnique({
    where: { id: shortlistCandidate.shortlist.missionId },
    select: { organizationId: true },
  })

  if (!mission) {
    throw new Error('Mission non trouvée')
  }

  // Create interaction
  await prisma.interaction.create({
    data: {
      organizationId: mission.organizationId,
      candidateId: shortlistCandidate.missionCandidate.candidateId,
      missionCandidateId: shortlistCandidate.missionCandidateId,
      type: 'CLIENT_FEEDBACK',
      content: `Feedback client: ${data.decision}${data.comment ? ` - ${data.comment}` : ''}`,
    },
  })

  // Update pipeline stage based on feedback
  if (data.decision === 'OK') {
    await prisma.missionCandidate.update({
      where: { id: shortlistCandidate.missionCandidateId },
      data: { stage: 'INTERVIEW' },
    })
  } else if (data.decision === 'NO') {
    await prisma.missionCandidate.update({
      where: { id: shortlistCandidate.missionCandidateId },
      data: { stage: 'SHORTLIST', rejectedAt: new Date(), rejectionReason: data.comment },
    })
  }
}

// Get shortlist
export async function getShortlist(id: string) {
  const organizationId = await getOrganizationId()

  const shortlist = await prisma.shortlist.findFirst({
    where: {
      id,
      mission: { organizationId },
    },
    include: {
      candidates: {
        include: {
          missionCandidate: {
            include: { candidate: true },
          },
          feedback: true,
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!shortlist) {
    throw new Error('Shortlist non trouvée')
  }

  return shortlist
}



