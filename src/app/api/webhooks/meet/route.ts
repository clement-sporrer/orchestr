import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Google Meet Webhook Handler
// This receives notifications from Google Calendar/Meet when meetings end
// and transcript becomes available

interface MeetWebhookPayload {
  eventType: string
  meetingId: string
  meetingUrl: string
  transcript?: {
    text: string
    language: string
  }
  participants?: Array<{
    email: string
    name: string
    duration: number
  }>
  startTime: string
  endTime: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (in production, verify with Google's signature)
    const authHeader = request.headers.get('Authorization')
    const webhookSecret = process.env.GOOGLE_MEET_WEBHOOK_SECRET
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload: MeetWebhookPayload = await request.json()

    // Only process meeting_ended events with transcript
    if (payload.eventType !== 'meeting_ended') {
      return NextResponse.json({ message: 'Event ignored' })
    }

    // Find interview by meeting URL
    const interview = await prisma.interview.findFirst({
      where: {
        meetingUrl: { contains: payload.meetingUrl },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
      include: {
        missionCandidate: {
          select: { id: true, candidateId: true },
        },
      },
    })

    if (!interview) {
      return NextResponse.json({ message: 'No matching interview' })
    }

    // Update interview with transcript and completion
    const updateData: Record<string, unknown> = {
      status: 'COMPLETED',
      endedAt: new Date(payload.endTime),
      startedAt: new Date(payload.startTime),
    }

    if (payload.transcript) {
      updateData.transcriptText = payload.transcript.text
      updateData.transcriptSource = 'GOOGLE_MEET'
      updateData.transcriptLanguage = payload.transcript.language || 'fr'
    }

    await prisma.interview.update({
      where: { id: interview.id },
      data: updateData,
    })

    // Update pipeline stage
    await prisma.missionCandidate.update({
      where: { id: interview.missionCandidateId },
      data: { stage: 'INTERVIEW_DONE' },
    })

    // Create interaction
    await prisma.interaction.create({
      data: {
        candidateId: interview.missionCandidate.candidateId,
        missionCandidateId: interview.missionCandidateId,
        type: 'INTERVIEW_DONE',
        content: payload.transcript 
          ? 'Entretien termine - Transcript disponible'
          : 'Entretien termine via Google Meet',
        completedAt: new Date(),
      },
    })

    return NextResponse.json({ 
      success: true,
      interviewId: interview.id,
      hasTranscript: !!payload.transcript,
    })

  } catch (error) {
    console.error('Google Meet webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Verification endpoint for Google
export async function GET(request: NextRequest) {
  // Handle Google's verification challenge
  const challenge = request.nextUrl.searchParams.get('challenge')
  if (challenge) {
    return NextResponse.json({ challenge })
  }
  
  return NextResponse.json({ status: 'ok', service: 'google-meet' })
}



