import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force Node.js runtime for Prisma database access
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, firstName, lastName, organizationName } = body

    if (!email || !firstName || !lastName || !organizationName) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          contactEmail: email,
        },
      })

      // Create user as admin of the organization
      const user = await tx.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          role: 'ADMIN',
          organizationId: organization.id,
        },
      })

      return { organization, user }
    })

    return NextResponse.json({
      success: true,
      organizationId: result.organization.id,
      userId: result.user.id,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du compte' },
      { status: 500 }
    )
  }
}



