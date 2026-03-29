import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime
export const runtime = 'nodejs'

// Google Meet webhook — Interview model removed, handler disabled
export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: 'Interview model removed — webhook disabled' }, { status: 501 })
}

export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge')
  if (challenge) {
    return NextResponse.json({ challenge })
  }
  return NextResponse.json({ status: 'disabled', service: 'google-meet' })
}
