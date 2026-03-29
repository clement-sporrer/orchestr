import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanType } from '@/lib/stripe'

export interface PlanLimits {
  maxUsers: number
  aiCallsPerDay: number
  customQuestionnaires: boolean
  apiAccess: boolean
}

export interface PlanStatus {
  plan: PlanType
  isActive: boolean
  isTrialing: boolean
  limits: PlanLimits
  usage: {
    currentUsers: number
    aiCallsToday: number
  }
  canAddUser: boolean
  canUseAI: boolean
  canUseCustomQuestionnaires: boolean
  canUseAPI: boolean
}

// Get current user's organization and subscription
async function getOrganizationWithSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return null
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    include: {
      organization: {
        include: {
          subscription: true,
          _count: {
            select: { users: true },
          },
        },
      },
    },
  })

  return dbUser?.organization ?? null
}

// Get today's AI usage count
async function getAIUsageToday(_organizationId: string): Promise<number> {
  // Event tracking table removed — AI usage limits not enforced; counts stay at 0
  return 0
}

// Check plan status and limits
export async function checkPlanStatus(): Promise<PlanStatus | null> {
  const organization = await getOrganizationWithSubscription()

  if (!organization) {
    return null
  }

  const subscription = organization.subscription
  const plan: PlanType = (subscription?.plan as PlanType) || 'CORE'
  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIALING'
  const isTrialing = subscription?.status === 'TRIALING'
  const limits = PLANS[plan].limits

  const aiCallsToday = await getAIUsageToday(organization.id)

  return {
    plan,
    isActive,
    isTrialing,
    limits,
    usage: {
      currentUsers: organization._count.users,
      aiCallsToday,
    },
    canAddUser: organization._count.users < limits.maxUsers,
    canUseAI: aiCallsToday < limits.aiCallsPerDay,
    canUseCustomQuestionnaires: limits.customQuestionnaires,
    canUseAPI: limits.apiAccess,
  }
}

// Check if user can add another team member
export async function canAddTeamMember(): Promise<{ allowed: boolean; reason?: string }> {
  const status = await checkPlanStatus()

  if (!status) {
    return { allowed: false, reason: 'Utilisateur non authentifie' }
  }

  if (!status.isActive) {
    return { allowed: false, reason: 'Abonnement inactif' }
  }

  if (!status.canAddUser) {
    return {
      allowed: false,
      reason: `Limite de ${status.limits.maxUsers} utilisateurs atteinte. Passez a Pro pour des utilisateurs illimites.`,
    }
  }

  return { allowed: true }
}

// Check if AI feature can be used
export async function canUseAIFeature(): Promise<{ allowed: boolean; reason?: string }> {
  const status = await checkPlanStatus()

  if (!status) {
    return { allowed: false, reason: 'Utilisateur non authentifie' }
  }

  if (!status.isActive) {
    return { allowed: false, reason: 'Abonnement inactif' }
  }

  if (!status.canUseAI) {
    return {
      allowed: false,
      reason: `Limite quotidienne de ${status.limits.aiCallsPerDay} appels IA atteinte. Reessayez demain.`,
    }
  }

  return { allowed: true }
}

// Check if custom questionnaires can be used
export async function canUseCustomQuestionnaires(): Promise<{ allowed: boolean; reason?: string }> {
  const status = await checkPlanStatus()

  if (!status) {
    return { allowed: false, reason: 'Utilisateur non authentifie' }
  }

  if (!status.isActive) {
    return { allowed: false, reason: 'Abonnement inactif' }
  }

  if (!status.canUseCustomQuestionnaires) {
    return {
      allowed: false,
      reason: 'Les questionnaires personnalises sont disponibles avec le plan Pro.',
    }
  }

  return { allowed: true }
}

// Check if API access is allowed
export async function canUseAPI(): Promise<{ allowed: boolean; reason?: string }> {
  const status = await checkPlanStatus()

  if (!status) {
    return { allowed: false, reason: 'Utilisateur non authentifie' }
  }

  if (!status.isActive) {
    return { allowed: false, reason: 'Abonnement inactif' }
  }

  if (!status.canUseAPI) {
    return {
      allowed: false,
      reason: 'L\'acces API est disponible avec le plan Pro.',
    }
  }

  return { allowed: true }
}

// Track AI usage
export async function trackAIUsage(
  _feature: 'scoring' | 'structuring' | 'message_generation',
  _metadata?: Record<string, unknown>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { organizationId: true, id: true },
  })

  if (!dbUser) return

  // Event tracking table removed — AI usage event not logged
}

// Higher-order function to wrap AI features with limit checking
export function withAILimit<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  feature: 'scoring' | 'structuring' | 'message_generation'
): T {
  return (async (...args: Parameters<T>) => {
    const canUse = await canUseAIFeature()

    if (!canUse.allowed) {
      throw new Error(canUse.reason)
    }

    const result = await fn(...args)

    // Track usage after successful call
    await trackAIUsage(feature)

    return result
  }) as T
}





