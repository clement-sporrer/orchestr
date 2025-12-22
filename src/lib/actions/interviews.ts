'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import type { InterviewType, InterviewStatus, TranscriptSource } from '@/generated/prisma'

// Schema for creating/updating interviews
const interviewSchema = z.object({
  missionCandidateId: z.string(),
  scheduledAt: z.coerce.date(),
  duration: z.number().min(15).max(240).default(45),
  type: z.enum(['PHONE_SCREEN', 'VIDEO_RECRUITER', 'VIDEO_CLIENT', 'ONSITE']),
  location: z.string().optional(),
  meetingUrl: z.string().url().optional().or(z.literal('')),
  recruiterNotes: z.string().optional(),
})

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

// Verify mission candidate ownership
async function verifyMissionCandidate(missionCandidateId: string, organizationId: string) {
  const mc = await prisma.missionCandidate.findFirst({
    where: {
      id: missionCandidateId,
      mission: {
        organizationId,
      },
    },
    include: {
      mission: {
        select: { id: true, title: true },
      },
      candidate: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  })

  if (!mc) {
    throw new Error('Candidat non trouve')
  }

  return mc
}

// Get interviews for a mission candidate
export async function getInterviews(missionCandidateId: string) {
  const organizationId = await getOrganizationId()
  await verifyMissionCandidate(missionCandidateId, organizationId)

  const interviews = await prisma.interview.findMany({
    where: { missionCandidateId },
    include: {
      reportTemplate: {
        select: { id: true, name: true },
      },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  return interviews
}

// Get a single interview
export async function getInterview(id: string) {
  const organizationId = await getOrganizationId()

  const interview = await prisma.interview.findFirst({
    where: { id },
    include: {
      missionCandidate: {
        include: {
          mission: {
            select: { id: true, title: true, organizationId: true },
          },
          candidate: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      reportTemplate: true,
    },
  })

  if (!interview || interview.missionCandidate.mission.organizationId !== organizationId) {
    throw new Error('Entretien non trouve')
  }

  return interview
}

// Create interview
export async function createInterview(data: z.infer<typeof interviewSchema>) {
  const organizationId = await getOrganizationId()
  const validated = interviewSchema.parse(data)
  
  const mc = await verifyMissionCandidate(validated.missionCandidateId, organizationId)

  const interview = await prisma.interview.create({
    data: {
      ...validated,
      meetingUrl: validated.meetingUrl || null,
    },
  })

  // Update pipeline stage
  await prisma.missionCandidate.update({
    where: { id: validated.missionCandidateId },
    data: { stage: 'INTERVIEW_SCHEDULED' },
  })

  // Create interaction
  await prisma.interaction.create({
    data: {
      candidateId: mc.candidate.id,
      missionCandidateId: mc.id,
      type: 'INTERVIEW_SCHEDULED',
      content: `Entretien ${getInterviewTypeLabel(validated.type)} planifie pour le ${validated.scheduledAt.toLocaleDateString('fr-FR')}`,
      scheduledAt: validated.scheduledAt,
    },
  })

  revalidatePath(`/missions/${mc.mission.id}`)
  return interview
}

// Update interview
export async function updateInterview(
  id: string, 
  data: Partial<z.infer<typeof interviewSchema>> & {
    status?: InterviewStatus
    transcriptText?: string
    transcriptSource?: TranscriptSource
    reportContent?: string
  }
) {
  const organizationId = await getOrganizationId()
  
  const existing = await prisma.interview.findFirst({
    where: { id },
    include: {
      missionCandidate: {
        include: {
          mission: { select: { id: true, organizationId: true } },
        },
      },
    },
  })

  if (!existing || existing.missionCandidate.mission.organizationId !== organizationId) {
    throw new Error('Entretien non trouve')
  }

  // If completing the interview, update stage
  if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
    await prisma.missionCandidate.update({
      where: { id: existing.missionCandidateId },
      data: { stage: 'INTERVIEW_DONE' },
    })

    // Create interaction
    await prisma.interaction.create({
      data: {
        candidateId: existing.missionCandidate.candidateId,
        missionCandidateId: existing.missionCandidateId,
        type: 'INTERVIEW_DONE',
        content: `Entretien termine`,
        completedAt: new Date(),
      },
    })
  }

  const interview = await prisma.interview.update({
    where: { id },
    data: {
      ...data,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      reportGeneratedAt: data.reportContent ? new Date() : undefined,
    },
  })

  revalidatePath(`/missions/${existing.missionCandidate.mission.id}`)
  return interview
}

// Update interview status
export async function updateInterviewStatus(id: string, status: InterviewStatus) {
  return updateInterview(id, { status })
}

// Add transcript to interview
export async function addTranscript(
  id: string, 
  transcriptText: string, 
  source: TranscriptSource = 'MANUAL'
) {
  return updateInterview(id, { 
    transcriptText, 
    transcriptSource: source,
  })
}

// Save interview notes
export async function saveInterviewNotes(id: string, notes: string) {
  return updateInterview(id, { recruiterNotes: notes })
}

// Delete interview
export async function deleteInterview(id: string) {
  const organizationId = await getOrganizationId()
  
  const existing = await prisma.interview.findFirst({
    where: { id },
    include: {
      missionCandidate: {
        include: {
          mission: { select: { id: true, organizationId: true } },
        },
      },
    },
  })

  if (!existing || existing.missionCandidate.mission.organizationId !== organizationId) {
    throw new Error('Entretien non trouve')
  }

  await prisma.interview.delete({
    where: { id },
  })

  revalidatePath(`/missions/${existing.missionCandidate.mission.id}`)
}

// Get upcoming interviews for dashboard
export async function getUpcomingInterviews(limit = 10) {
  const organizationId = await getOrganizationId()

  const interviews = await prisma.interview.findMany({
    where: {
      missionCandidate: {
        mission: { organizationId },
      },
      scheduledAt: { gte: new Date() },
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
    },
    include: {
      missionCandidate: {
        include: {
          candidate: {
            select: { id: true, firstName: true, lastName: true },
          },
          mission: {
            select: { id: true, title: true },
          },
        },
      },
    },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  })

  return interviews
}

// Helper to get interview type label
function getInterviewTypeLabel(type: InterviewType): string {
  const labels: Record<InterviewType, string> = {
    PHONE_SCREEN: 'telephonique',
    VIDEO_RECRUITER: 'video recruteur',
    VIDEO_CLIENT: 'video client',
    ONSITE: 'sur site',
  }
  return labels[type]
}

// Export type labels for UI
export const interviewTypeLabels: Record<InterviewType, string> = {
  PHONE_SCREEN: 'Telephone',
  VIDEO_RECRUITER: 'Video (Recruteur)',
  VIDEO_CLIENT: 'Video (Client)',
  ONSITE: 'Sur site',
}

export const interviewStatusLabels: Record<InterviewStatus, string> = {
  SCHEDULED: 'Planifie',
  CONFIRMED: 'Confirme',
  COMPLETED: 'Termine',
  CANCELLED: 'Annule',
  NO_SHOW: 'Absent',
}

