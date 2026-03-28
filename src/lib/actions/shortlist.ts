'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { generateToken, getTokenExpiry, hashToken } from '@/lib/utils/tokens'
import type { FeedbackDecision } from '@/generated/prisma'
import { getOrganizationId } from '@/lib/auth/helpers'
import { applyStageTransition } from '@/lib/actions/pipeline'

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

  const rawToken = generateToken()
  const tokenHash = hashToken(rawToken)
  const expiry = getTokenExpiry('client')
  const clientPortalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/client/${rawToken}`

  // Fetch missionCandidates before the transaction to get candidateIds for stage sync
  const mcsToUpdate = await prisma.missionCandidate.findMany({
    where: { id: { in: candidateIds }, missionId },
    select: { id: true, candidateId: true },
  })

  if (mcsToUpdate.length === 0 && candidateIds.length > 0) {
    throw new Error('Aucun candidat valide trouvé pour cette mission')
  }

  // Single transaction: shortlist creation + all stage transitions are atomic
  const shortlist = await prisma.$transaction(async (tx) => {
    const created = await tx.shortlist.create({
      data: {
        missionId,
        name,
        accessToken: tokenHash,
        accessTokenExpiry: expiry,
        clientPortalUrl,
        candidates: {
          create: candidateIds.map((mcId, index) => ({
            missionCandidateId: mcId,
            order: index,
          })),
        },
      },
    })

    for (const mc of mcsToUpdate) {
      await applyStageTransition(mc.id, mc.candidateId, 'SHORTLIST', tx)
    }

    return created
  })

  revalidatePath(`/missions/${missionId}`)
  return { ...shortlist, rawAccessToken: rawToken }
}

// Submit client feedback — authenticated by shortlist access token
export async function submitClientFeedback(
  accessToken: string,
  shortlistCandidateId: string,
  data: {
    decision: FeedbackDecision
    comment?: string
  }
) {
  const tokenHash = hashToken(accessToken)

  // Verify token → find shortlist
  const shortlist = await prisma.shortlist.findFirst({
    where: { accessToken: tokenHash },
  })

  if (!shortlist) {
    throw new Error('Token invalide')
  }

  if (shortlist.accessTokenExpiry && shortlist.accessTokenExpiry < new Date()) {
    throw new Error('Lien expiré')
  }

  // Verify shortlistCandidate belongs to this shortlist
  const shortlistCandidate = await prisma.shortlistCandidate.findFirst({
    where: {
      id: shortlistCandidateId,
      shortlistId: shortlist.id,
    },
    include: {
      missionCandidate: true,
    },
  })

  if (!shortlistCandidate) {
    throw new Error('Candidat non trouvé dans cette shortlist')
  }

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

  const mission = await prisma.mission.findUnique({
    where: { id: shortlist.missionId },
    select: { organizationId: true },
  })

  if (!mission) {
    throw new Error('Mission non trouvée')
  }

  await prisma.interaction.create({
    data: {
      organizationId: mission.organizationId,
      candidateId: shortlistCandidate.missionCandidate.candidateId,
      missionCandidateId: shortlistCandidate.missionCandidateId,
      type: 'CLIENT_FEEDBACK',
      content: `Feedback client: ${data.decision}${data.comment ? ` - ${data.comment}` : ''}`,
    },
  })

  if (data.decision === 'OK') {
    await applyStageTransition(
      shortlistCandidate.missionCandidateId,
      shortlistCandidate.missionCandidate.candidateId,
      'INTERVIEW'
    )
  } else if (data.decision === 'NO') {
    await prisma.$transaction(async (tx) => {
      await applyStageTransition(
        shortlistCandidate.missionCandidateId,
        shortlistCandidate.missionCandidate.candidateId,
        'SHORTLIST',
        tx
      )
      await tx.missionCandidate.update({
        where: { id: shortlistCandidate.missionCandidateId },
        data: { rejectedAt: new Date(), rejectionReason: data.comment },
      })
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



