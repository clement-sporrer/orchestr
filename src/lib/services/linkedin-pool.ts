import { prisma } from '@/lib/prisma'
import { checkSessionSafety, markSessionUsed, handleScrapingError } from './linkedin-risk-detection'

interface SessionUser {
  userId: string
  lastUsed: Date | null
  requestCount: number
  riskLevel: string | null
}

/**
 * Pool de sessions LinkedIn pour distribuer la charge
 * et protéger les comptes utilisateurs
 */
export class LinkedInSessionPool {
  private static instance: LinkedInSessionPool
  private sessions: Map<string, SessionUser> = new Map()
  private readonly MIN_DELAY_BETWEEN_REQUESTS_MS = 3000 // 3 secondes minimum

  static getInstance(): LinkedInSessionPool {
    if (!LinkedInSessionPool.instance) {
      LinkedInSessionPool.instance = new LinkedInSessionPool()
    }
    return LinkedInSessionPool.instance
  }

  /**
   * Charge toutes les sessions disponibles depuis la DB
   */
  async refreshSessions(): Promise<void> {
    const users = await prisma.user.findMany({
      where: {
        linkedinConnected: true,
        linkedinAccessToken: { not: null },
        linkedinRiskLevel: { not: 'blocked' },
        OR: [
          { linkedinBlockedUntil: null },
          { linkedinBlockedUntil: { lt: new Date() } },
        ],
      },
      select: {
        id: true,
        linkedinLastUsed: true,
        linkedinRequestCount: true,
        linkedinRiskLevel: true,
      },
      orderBy: [
        { linkedinRiskLevel: 'asc' }, // Priorité aux sessions à faible risque
        { linkedinLastUsed: 'asc' }, // Puis aux moins utilisées
      ],
      take: 100, // Limiter à 100 sessions max
    })

    // Mettre à jour le cache local
    for (const user of users) {
      this.sessions.set(user.id, {
        userId: user.id,
        lastUsed: user.linkedinLastUsed,
        requestCount: user.linkedinRequestCount || 0,
        riskLevel: user.linkedinRiskLevel,
      })
    }

    // Supprimer les sessions qui ne sont plus disponibles
    const availableUserIds = new Set(users.map(u => u.id))
    for (const [userId] of this.sessions) {
      if (!availableUserIds.has(userId)) {
        this.sessions.delete(userId)
      }
    }
  }

  /**
   * Trouve la meilleure session disponible
   */
  async getAvailableSession(): Promise<string | null> {
    // Rafraîchir les sessions
    await this.refreshSessions()

    if (this.sessions.size === 0) {
      return null
    }

    // Trier les sessions par priorité
    const sortedSessions = Array.from(this.sessions.values())
      .sort((a, b) => {
        // Priorité 1: Niveau de risque (low < medium < high)
        const riskOrder = { low: 0, medium: 1, high: 2, blocked: 3 }
        const aRisk = riskOrder[a.riskLevel as keyof typeof riskOrder] ?? 2
        const bRisk = riskOrder[b.riskLevel as keyof typeof riskOrder] ?? 2
        if (aRisk !== bRisk) return aRisk - bRisk

        // Priorité 2: Moins de requêtes
        if (a.requestCount !== b.requestCount) {
          return a.requestCount - b.requestCount
        }

        // Priorité 3: Plus ancienne utilisation
        const aLastUsed = a.lastUsed?.getTime() || 0
        const bLastUsed = b.lastUsed?.getTime() || 0
        return aLastUsed - bLastUsed
      })

    // Vérifier chaque session pour trouver une disponible
    for (const session of sortedSessions) {
      const safetyCheck = await checkSessionSafety(session.userId)
      
      if (safetyCheck.isSafe) {
        // Vérifier le délai minimum
        if (session.lastUsed) {
          const timeSinceLastUse = Date.now() - session.lastUsed.getTime()
          if (timeSinceLastUse < this.MIN_DELAY_BETWEEN_REQUESTS_MS) {
            // Cette session sera disponible bientôt, mais pas maintenant
            continue
          }
        }

        return session.userId
      }
    }

    // Aucune session disponible immédiatement
    // Trouver celle qui sera disponible le plus tôt
    let earliestAvailable: { userId: string; waitTime: number } | null = null

    for (const session of sortedSessions) {
      const safetyCheck = await checkSessionSafety(session.userId)
      
      if (!safetyCheck.blockedUntil) {
        const timeSinceLastUse = session.lastUsed
          ? Date.now() - session.lastUsed.getTime()
          : 0
        const waitTime = Math.max(
          0,
          this.MIN_DELAY_BETWEEN_REQUESTS_MS - timeSinceLastUse
        )

        if (!earliestAvailable || waitTime < earliestAvailable.waitTime) {
          earliestAvailable = { userId: session.userId, waitTime }
        }
      }
    }

    // Si une session sera disponible dans moins de 10 secondes, attendre
    if (earliestAvailable && earliestAvailable.waitTime < 10000) {
      await new Promise(resolve => setTimeout(resolve, earliestAvailable.waitTime))
      return earliestAvailable.userId
    }

    return null
  }

  /**
   * Marque une session comme utilisée
   */
  async markSessionUsed(userId: string): Promise<void> {
    await markSessionUsed(userId)
    
    // Mettre à jour le cache local
    const session = this.sessions.get(userId)
    if (session) {
      session.lastUsed = new Date()
      session.requestCount += 1
    }
  }

  /**
   * Gère une erreur sur une session
   */
  async handleError(userId: string, error: Error): Promise<void> {
    await handleScrapingError(userId, error)
    
    // Retirer la session du pool si bloquée
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { linkedinRiskLevel: true, linkedinBlockedUntil: true },
    })

    if (
      user?.linkedinRiskLevel === 'blocked' ||
      (user?.linkedinBlockedUntil && user.linkedinBlockedUntil > new Date())
    ) {
      this.sessions.delete(userId)
    }
  }

  /**
   * Calcule le débit théorique total
   */
  calculateTotalThroughput(): number {
    const activeSessions = Array.from(this.sessions.values()).filter(
      (s) => s.riskLevel !== 'blocked' && s.riskLevel !== 'high'
    )
    
    // 30 requêtes/heure par session (limite de sécurité)
    return activeSessions.length * 30
  }

  /**
   * Obtient les statistiques du pool
   */
  getStats(): {
    totalSessions: number
    availableSessions: number
    blockedSessions: number
    theoreticalThroughput: number
  } {
    const total = this.sessions.size
    const available = Array.from(this.sessions.values()).filter(
      (s) => s.riskLevel !== 'blocked'
    ).length
    const blocked = total - available

    return {
      totalSessions: total,
      availableSessions: available,
      blockedSessions: blocked,
      theoreticalThroughput: this.calculateTotalThroughput(),
    }
  }
}

