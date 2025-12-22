import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

// Zoom Webhook Handler
// Receives notifications when recordings/transcripts are available

interface ZoomWebhookPayload {
  event: string
  payload: {
    account_id: string
    object: {
      uuid: string
      id: number
      host_id: string
      topic: string
      start_time: string
      duration: number
      recording_files?: Array<{
        id: string
        meeting_id: string
        recording_start: string
        recording_end: string
        file_type: string
        file_extension: string
        file_size: number
        download_url: string
        status: string
        recording_type: string
      }>
      participant_audio_files?: Array<{
        id: string
        recording_start: string
        recording_end: string
        file_type: string
        download_url: string
      }>
    }
  }
  download_token?: string
}

// Verify Zoom webhook signature
function verifyZoomWebhook(request: NextRequest, body: string): boolean {
  const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN
  if (!secret) return true // Skip verification if not configured

  const timestamp = request.headers.get('x-zm-request-timestamp')
  const signature = request.headers.get('x-zm-signature')

  if (!timestamp || !signature) return false

  const message = `v0:${timestamp}:${body}`
  const hash = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex')
  const expectedSignature = `v0=${hash}`

  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload: ZoomWebhookPayload = JSON.parse(body)

    // Handle Zoom's URL validation challenge
    if (payload.event === 'endpoint.url_validation') {
      const plainToken = (payload.payload as unknown as { plainToken: string }).plainToken
      const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN || ''
      const encryptedToken = crypto
        .createHmac('sha256', secret)
        .update(plainToken)
        .digest('hex')
      
      return NextResponse.json({
        plainToken,
        encryptedToken,
      })
    }

    // Verify webhook signature
    if (!verifyZoomWebhook(request, body)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Handle recording completed event
    if (payload.event === 'recording.completed') {
      const meeting = payload.payload.object
      
      // Try to find matching interview by meeting ID or topic
      const interview = await prisma.interview.findFirst({
        where: {
          OR: [
            { meetingUrl: { contains: meeting.uuid } },
            { meetingUrl: { contains: String(meeting.id) } },
          ],
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
        include: {
          missionCandidate: {
            select: { id: true, candidateId: true },
          },
        },
      })

      if (!interview) {
        console.log('No matching interview found for Zoom meeting:', meeting.id)
        return NextResponse.json({ message: 'No matching interview' })
      }

      // Find transcript file if available
      const transcriptFile = meeting.recording_files?.find(
        f => f.file_type === 'TRANSCRIPT' || f.recording_type === 'audio_transcript'
      )

      // Update interview
      const updateData: Record<string, unknown> = {
        status: 'COMPLETED',
        endedAt: new Date(meeting.start_time).getTime() + meeting.duration * 60 * 1000,
        startedAt: new Date(meeting.start_time),
      }

      if (transcriptFile) {
        // Store the download URL - in production, you'd download and store the file
        updateData.transcriptUrl = transcriptFile.download_url
        updateData.transcriptSource = 'ZOOM'
        
        // If we have a download token, we could fetch the transcript content
        // For now, we just store the URL
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
          content: transcriptFile 
            ? 'Entretien termine - Transcript Zoom disponible'
            : 'Entretien termine via Zoom',
          completedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        interviewId: interview.id,
        hasTranscript: !!transcriptFile,
      })
    }

    // Handle meeting ended (without recording)
    if (payload.event === 'meeting.ended') {
      const meeting = payload.payload.object
      
      const interview = await prisma.interview.findFirst({
        where: {
          OR: [
            { meetingUrl: { contains: meeting.uuid } },
            { meetingUrl: { contains: String(meeting.id) } },
          ],
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      })

      if (interview) {
        await prisma.interview.update({
          where: { id: interview.id },
          data: {
            status: 'COMPLETED',
            endedAt: new Date(),
          },
        })
      }

      return NextResponse.json({ message: 'Meeting ended processed' })
    }

    return NextResponse.json({ message: 'Event ignored' })

  } catch (error) {
    console.error('Zoom webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'zoom' })
}



