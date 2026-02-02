'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Cached resolution of current user (Supabase auth + Prisma).
 * Deduplicated per request so layout + all server components share one auth/DB round-trip.
 */
const getCachedCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

  if (authError || !authUser) {
    throw new Error('Non authentifié')
  }

  // Use authUserId for secure lookup (immutable, tied to Supabase Auth)
  const dbUser = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
    },
  })

  if (!dbUser) {
    // If user exists in Auth but not in DB, try to link by email (migration path)
    if (authUser.email) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: authUser.email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationId: true,
        },
      })

      // If found by email, update with authUserId for future lookups
      if (userByEmail) {
        const fullUser = await prisma.user.findUnique({
          where: { id: userByEmail.id },
          select: { authUserId: true },
        })

        if (fullUser && !fullUser.authUserId) {
          await prisma.user.update({
            where: { id: userByEmail.id },
            data: { authUserId: authUser.id },
          })
        }

        return userByEmail
      }
    }

    throw new Error('Utilisateur non trouvé dans la base de données')
  }

  return dbUser
})

/**
 * Get the current authenticated user's database record
 * Uses authUserId for secure lookup (not email which can change)
 * Throws if user is not authenticated or not found
 */
export async function getCurrentUser() {
  return getCachedCurrentUser()
}

/**
 * Get the current user's organization ID
 * Throws if user is not authenticated
 */
export async function getOrganizationId(): Promise<string> {
  const user = await getCurrentUser()
  return user.organizationId
}

/**
 * Get the current user's ID
 * Throws if user is not authenticated
 */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser()
  return user.id
}

/**
 * Get the current user with full details
 * Throws if user is not authenticated
 */
export async function getCurrentUserWithDetails() {
  return getCurrentUser()
}

