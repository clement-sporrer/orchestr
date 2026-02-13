import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force Node.js runtime for Prisma database access
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify webhook signature if configured
    const webhookKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY
    if (webhookKey) {
      const signature = request.headers.get('calendly-webhook-signature')
      // In production, verify the signature properly
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }
    }

    const event = body.event
    const payload = body.payload

    if (!event || !payload) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const inviteeEmail = payload.invitee?.email
    const eventUri = payload.event?.uri
    const eventName = payload.event?.name
    const startTime = payload.event?.start_time
    const cancelUrl = payload.event?.cancel_url
    const rescheduleUrl = payload.event?.reschedule_url

    if (!inviteeEmail) {
      return NextResponse.json({ error: 'No invitee email' }, { status: 400 })
    }

    // Find candidate by email
    const candidate = await prisma.candidate.findFirst({
      where: { email: inviteeEmail },
      include: {
        missionCandidates: {
          where: {
            mission: { status: 'ACTIVE' },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!candidate || candidate.missionCandidates.length === 0) {
      // Candidate might not be in system yet - ignore
      return NextResponse.json({ ok: true, matched: false })
    }

    const missionCandidate = candidate.missionCandidates[0]

    if (event === 'invitee.created') {
      // Interview scheduled
      await prisma.missionCandidate.update({
        where: { id: missionCandidate.id },
        data: { stage: 'INTERVIEW' },
      })

      // Get organizationId from mission
      const mission = await prisma.mission.findUnique({
        where: { id: missionCandidate.missionId },
        select: { organizationId: true },
      })

      if (mission) {
        await prisma.interaction.create({
          data: {
            organizationId: mission.organizationId,
            candidateId: candidate.id,
            missionCandidateId: missionCandidate.id,
            type: 'INTERVIEW_SCHEDULED',
            content: `Entretien planifié: ${eventName || 'Calendly'}`,
            scheduledAt: startTime ? new Date(startTime) : null,
            calendlyEventId: eventUri,
            calendlyEventUrl: rescheduleUrl,
          },
        })
      }

      // Create task to prepare interview
      const recruiter = await prisma.mission.findUnique({
        where: { id: missionCandidate.missionId },
        select: { recruiterId: true },
      })

      if (recruiter?.recruiterId) {
        await prisma.task.create({
          data: {
            userId: recruiter.recruiterId,
            missionCandidateId: missionCandidate.id,
            title: `Préparer entretien avec ${candidate.firstName} ${candidate.lastName}`,
            priority: 'HIGH',
            dueDate: startTime ? new Date(startTime) : null,
          },
        })
      }
    } else if (event === 'invitee.canceled') {
      // Get organizationId from mission
      const mission = await prisma.mission.findUnique({
        where: { id: missionCandidate.missionId },
        select: { organizationId: true },
      })

      if (mission) {
        // Interview canceled
        await prisma.interaction.create({
          data: {
            organizationId: mission.organizationId,
            candidateId: candidate.id,
            missionCandidateId: missionCandidate.id,
            type: 'STATUS_CHANGE',
            content: 'Entretien annulé',
            calendlyEventId: eventUri,
          },
        })
      }

      // Update status back
      await prisma.missionCandidate.update({
        where: { id: missionCandidate.id },
        data: { stage: 'RESPONSE' },
      })
    }

    return NextResponse.json({ ok: true, matched: true })
  } catch (error) {
    console.error('Calendly webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}



