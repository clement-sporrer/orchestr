'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { generateToken, getTokenExpiry } from '@/lib/utils/tokens'
import type { FeedbackDecision } from '@/generated/prisma'

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
    data: { stage: 'SENT_TO_CLIENT' },
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

  // Create interaction
  await prisma.interaction.create({
    data: {
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
      data: { stage: 'CLIENT_INTERVIEW' },
    })
  } else if (data.decision === 'NO') {
    await prisma.missionCandidate.update({
      where: { id: shortlistCandidate.missionCandidateId },
      data: { stage: 'CLOSED_REJECTED' },
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

