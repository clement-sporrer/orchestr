'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import type { Prisma } from '@/generated/prisma'

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

// Track event
export async function trackEvent(
  name: string,
  properties?: Record<string, unknown>,
  context?: {
    userId?: string
    candidateId?: string
    missionId?: string
  }
) {
  const organizationId = await getOrganizationId()

  await prisma.event.create({
    data: {
      organizationId,
      name,
      properties: properties as Prisma.InputJsonValue | undefined,
      userId: context?.userId,
      candidateId: context?.candidateId,
      missionId: context?.missionId,
    },
  })
}

// Get dashboard KPIs
export async function getDashboardKpis() {
  const organizationId = await getOrganizationId()
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Active missions
  const activeMissions = await prisma.mission.count({
    where: {
      organizationId,
      status: 'ACTIVE',
    },
  })

  // Candidates this month
  const candidatesThisMonth = await prisma.candidate.count({
    where: {
      organizationId,
      createdAt: { gte: thirtyDaysAgo },
    },
  })

  // Pending tasks
  const pendingTasks = await prisma.task.count({
    where: {
      user: { organizationId },
      completedAt: null,
    },
  })

  // Shortlists sent
  const shortlistsSent = await prisma.shortlist.count({
    where: {
      mission: { organizationId },
      createdAt: { gte: thirtyDaysAgo },
    },
  })

  // Portal completion rate
  const totalPortalInvites = await prisma.missionCandidate.count({
    where: {
      mission: { organizationId },
      portalToken: { not: null },
    },
  })

  const completedPortals = await prisma.missionCandidate.count({
    where: {
      mission: { organizationId },
      portalCompleted: true,
    },
  })

  const portalCompletionRate = totalPortalInvites > 0 
    ? Math.round((completedPortals / totalPortalInvites) * 100)
    : 0

  // Client feedback rate
  const totalShortlistCandidates = await prisma.shortlistCandidate.count({
    where: {
      shortlist: { mission: { organizationId } },
    },
  })

  const feedbackReceived = await prisma.clientFeedback.count({
    where: {
      shortlistCandidate: {
        shortlist: { mission: { organizationId } },
      },
    },
  })

  const feedbackRate = totalShortlistCandidates > 0
    ? Math.round((feedbackReceived / totalShortlistCandidates) * 100)
    : 0

  // Reused vs new candidates
  const totalCandidatesInMissions = await prisma.missionCandidate.count({
    where: {
      mission: { organizationId },
      createdAt: { gte: thirtyDaysAgo },
    },
  })

  const reusedCandidates = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(DISTINCT mc.candidate_id) as count
    FROM mission_candidates mc
    JOIN candidates c ON mc.candidate_id = c.id
    WHERE c.organization_id = ${organizationId}
    AND mc.created_at >= ${thirtyDaysAgo}
    AND (
      SELECT COUNT(*) FROM mission_candidates mc2 
      WHERE mc2.candidate_id = mc.candidate_id
    ) > 1
  `

  const reusedRate = totalCandidatesInMissions > 0
    ? Math.round((Number(reusedCandidates[0]?.count || 0) / totalCandidatesInMissions) * 100)
    : 0

  return {
    activeMissions,
    candidatesThisMonth,
    pendingTasks,
    shortlistsSent,
    portalCompletionRate,
    feedbackRate,
    reusedCandidatesRate: reusedRate,
  }
}

// Get recent activity
export async function getRecentActivity(limit: number = 20) {
  const organizationId = await getOrganizationId()

  const events = await prisma.event.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return events
}

