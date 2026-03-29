import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Force Node.js runtime
export const runtime = 'nodejs'

// Zoom webhook — Interview model removed, handler disabled
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload = JSON.parse(body)

    // Handle Zoom's URL validation challenge (must always respond)
    if (payload.event === 'endpoint.url_validation') {
      const plainToken = (payload.payload as { plainToken: string }).plainToken
      const secret = process.env.ZOOM_WEBHOOK_SECRET_TOKEN || ''
      const encryptedToken = crypto
        .createHmac('sha256', secret)
        .update(plainToken)
        .digest('hex')
      return NextResponse.json({ plainToken, encryptedToken })
    }

    return NextResponse.json({ error: 'Interview model removed — webhook disabled' }, { status: 501 })
  } catch (error) {
    console.error('Zoom webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'disabled', service: 'zoom' })
}
