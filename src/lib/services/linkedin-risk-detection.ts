import { prisma } from '@/lib/prisma'

export type RiskLevel = 'low' | 'medium' | 'high' | 'blocked'

interface RiskCheckResult {
  isSafe: boolean
  riskLevel: RiskLevel
  reason?: string
  blockedUntil?: Date
}

/**
 * Limites de sécurité très conservatrices pour protéger les comptes utilisateurs
 */
const SAFETY_LIMITS = {
  // Maximum 30 requêtes par heure par session (très conservateur)
  MAX_REQUESTS_PER_HOUR: 30,
  
  // Délai minimum entre requêtes : 3 secondes (pour éviter la détection)
  MIN_DELAY_BETWEEN_REQUESTS_MS: 3000,
  
  // Si erreur 429 (rate limit), bloquer pendant 1 heure
  BLOCK_DURATION_ON_RATE_LIMIT_MS: 60 * 60 * 1000,
  
  // Si erreur d'authentification, bloquer immédiatement
  BLOCK_ON_AUTH_ERROR: true,
  
  // Si trop d'erreurs consécutives, augmenter le risque
  MAX_CONSECUTIVE_ERRORS: 3,
}

/**
 * Vérifie si une session peut être utilisée en toute sécurité
 */
export async function checkSessionSafety(userId: string): Promise<RiskCheckResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      linkedinConnected: true,
      linkedinRiskLevel: true,
      linkedinBlockedUntil: true,
      linkedinRequestCount: true,
      linkedinLastReset: true,
      linkedinLastUsed: true,
    },
  })

  if (!user || !user.linkedinConnected) {
    return {
      isSafe: false,
      riskLevel: 'blocked',
      reason: 'LinkedIn non connecté',
    }
  }

  // Vérifier si bloqué temporairement
  if (user.linkedinBlockedUntil && user.linkedinBlockedUntil > new Date()) {
    return {
      isSafe: false,
      riskLevel: 'blocked',
      reason: `Compte bloqué jusqu'à ${user.linkedinBlockedUntil.toISOString()}`,
      blockedUntil: user.linkedinBlockedUntil,
    }
  }

  // Vérifier le niveau de risque
  if (user.linkedinRiskLevel === 'blocked') {
    return {
      isSafe: false,
      riskLevel: 'blocked',
      reason: 'Compte marqué comme bloqué',
    }
  }

  // Réinitialiser le compteur si > 1 heure
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  if (!user.linkedinLastReset || user.linkedinLastReset < oneHourAgo) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        linkedinRequestCount: 0,
        linkedinLastReset: new Date(),
      },
    })
  }

  // Vérifier la limite horaire
  if (user.linkedinRequestCount >= SAFETY_LIMITS.MAX_REQUESTS_PER_HOUR) {
    return {
      isSafe: false,
      riskLevel: 'high',
      reason: `Limite horaire atteinte (${SAFETY_LIMITS.MAX_REQUESTS_PER_HOUR} requêtes/heure)`,
    }
  }

  // Vérifier le délai minimum entre requêtes
  if (user.linkedinLastUsed) {
    const timeSinceLastUse = Date.now() - user.linkedinLastUsed.getTime()
    if (timeSinceLastUse < SAFETY_LIMITS.MIN_DELAY_BETWEEN_REQUESTS_MS) {
      const waitTime = SAFETY_LIMITS.MIN_DELAY_BETWEEN_REQUESTS_MS - timeSinceLastUse
      return {
        isSafe: false,
        riskLevel: 'medium',
        reason: `Délai minimum non respecté. Attendre ${Math.ceil(waitTime / 1000)} secondes`,
      }
    }
  }

  // Déterminer le niveau de risque basé sur l'utilisation
  let riskLevel: RiskLevel = 'low'
  if (user.linkedinRequestCount > SAFETY_LIMITS.MAX_REQUESTS_PER_HOUR * 0.8) {
    riskLevel = 'high'
  } else if (user.linkedinRequestCount > SAFETY_LIMITS.MAX_REQUESTS_PER_HOUR * 0.5) {
    riskLevel = 'medium'
  }

  // Prendre en compte le risque existant
  if (user.linkedinRiskLevel === 'high') {
    riskLevel = 'high'
  } else if (user.linkedinRiskLevel === 'medium' && riskLevel === 'low') {
    riskLevel = 'medium'
  }

  return {
    isSafe: true,
    riskLevel,
  }
}

/**
 * Marque une session comme utilisée
 */
export async function markSessionUsed(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      linkedinLastUsed: new Date(),
      linkedinRequestCount: {
        increment: 1,
      },
    },
  })
}

/**
 * Gère une erreur et met à jour le niveau de risque
 */
export async function handleScrapingError(
  userId: string,
  error: Error
): Promise<void> {
  const errorMessage = error.message.toLowerCase()

  // Erreur de rate limit (429) - bloquer immédiatement
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        linkedinRiskLevel: 'blocked',
        linkedinBlockedUntil: new Date(Date.now() + SAFETY_LIMITS.BLOCK_DURATION_ON_RATE_LIMIT_MS),
        linkedinRequestCount: 0, // Réinitialiser le compteur
      },
    })
    return
  }

  // Erreur d'authentification - bloquer immédiatement
  if (
    errorMessage.includes('401') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('login required')
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        linkedinConnected: false,
        linkedinRiskLevel: 'blocked',
        linkedinCookies: null,
      },
    })
    return
  }

  // Erreur de captcha ou détection - augmenter le risque
  if (
    errorMessage.includes('captcha') ||
    errorMessage.includes('challenge') ||
    errorMessage.includes('suspicious activity')
  ) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        linkedinRiskLevel: 'high',
        linkedinBlockedUntil: new Date(Date.now() + 30 * 60 * 1000), // Bloquer 30 min
      },
    })
    return
  }

  // Autres erreurs - augmenter légèrement le risque
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { linkedinRiskLevel: true },
  })

  if (user) {
    let newRiskLevel: RiskLevel = 'low'
    if (user.linkedinRiskLevel === 'low') {
      newRiskLevel = 'medium'
    } else if (user.linkedinRiskLevel === 'medium') {
      newRiskLevel = 'high'
    } else {
      newRiskLevel = 'blocked'
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        linkedinRiskLevel: newRiskLevel,
      },
    })
  }
}

/**
 * Réinitialise le niveau de risque après une période sans erreur
 */
export async function resetRiskLevelIfSafe(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      linkedinLastUsed: true,
      linkedinRiskLevel: true,
    },
  })

  if (!user) return

  // Si pas d'utilisation depuis 24h et risque moyen/élevé, réduire le risque
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  if (user.linkedinLastUsed && user.linkedinLastUsed < oneDayAgo) {
    if (user.linkedinRiskLevel === 'high') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          linkedinRiskLevel: 'medium',
        },
      })
    } else if (user.linkedinRiskLevel === 'medium') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          linkedinRiskLevel: 'low',
        },
      })
    }
  }
}

