import { prisma } from '@/lib/prisma'

// Durée de cache : 7 jours (évite les requêtes répétées)
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Normalise une URL LinkedIn pour le cache
 */
function normalizeLinkedInUrl(url: string): string {
  return url
    .split('?')[0] // Enlever les query params
    .replace(/\/$/, '') // Enlever trailing slash
    .toLowerCase()
    .trim()
}

/**
 * Récupère un profil depuis le cache
 */
export async function getCachedProfile(linkedInUrl: string): Promise<any | null> {
  const normalizedUrl = normalizeLinkedInUrl(linkedInUrl)
  
  try {
    const cached = await prisma.linkedInCache.findUnique({
      where: { linkedinUrl: normalizedUrl },
    })

    if (cached && cached.expiresAt > new Date()) {
      return cached.data as any
    }

    // Si expiré, supprimer
    if (cached && cached.expiresAt <= new Date()) {
      await prisma.linkedInCache.delete({
        where: { id: cached.id },
      })
    }

    return null
  } catch (error) {
    console.error('Cache read error:', error)
    return null
  }
}

/**
 * Met en cache un profil LinkedIn
 */
export async function cacheProfile(linkedInUrl: string, data: any): Promise<void> {
  const normalizedUrl = normalizeLinkedInUrl(linkedInUrl)
  
  try {
    await prisma.linkedInCache.upsert({
      where: { linkedinUrl: normalizedUrl },
      create: {
        linkedinUrl: normalizedUrl,
        data: data as object,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + CACHE_DURATION_MS),
      },
      update: {
        data: data as object,
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + CACHE_DURATION_MS),
      },
    })
  } catch (error) {
    console.error('Cache write error:', error)
    // Ne pas faire échouer la requête si le cache échoue
  }
}

/**
 * Nettoie les entrées de cache expirées
 */
export async function cleanExpiredCache(): Promise<void> {
  try {
    await prisma.linkedInCache.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    })
  } catch (error) {
    console.error('Cache cleanup error:', error)
  }
}

