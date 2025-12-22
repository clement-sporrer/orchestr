import { getCachedProfile, cacheProfile } from './linkedin-cache'
import { LinkedInSessionPool } from './linkedin-pool'
import { scrapeLinkedInProfile } from './linkedin-scraper'
import { generateProfileTags } from '@/lib/ai/structuring'
import type { LinkedInProfileData } from '@/app/api/extension/capture/route'
import type { EnrichedProfileData } from '@/lib/ai/structuring'

/**
 * Service principal d'enrichissement LinkedIn
 * Combine cache, pool de sessions, scraping et IA
 */
export async function enrichLinkedInProfile(
  linkedInUrl: string,
  requestingUserId: string
): Promise<EnrichedProfileData> {
  // 1. Vérifier le cache d'abord (évite les requêtes inutiles)
  const cached = await getCachedProfile(linkedInUrl)
  if (cached) {
    return cached as EnrichedProfileData
  }

  // 2. Obtenir une session disponible depuis le pool
  const sessionPool = LinkedInSessionPool.getInstance()
  const sessionUserId = await sessionPool.getAvailableSession()

  if (!sessionUserId) {
    throw new Error(
      'Aucune session LinkedIn disponible. ' +
      'Tous les comptes ont atteint leur limite de sécurité horaire. ' +
      'Veuillez réessayer dans quelques minutes ou connectez plus de comptes LinkedIn dans les paramètres.'
    )
  }

  try {
    // 3. Scraper le profil avec la session disponible
    const profileData = await scrapeLinkedInProfile(linkedInUrl, sessionUserId)

    if (!profileData || !profileData.firstName || !profileData.lastName) {
      throw new Error('Impossible d\'extraire les données du profil LinkedIn')
    }

    // 4. Générer les tags avec l'IA
    const tagResult = await generateProfileTags({
      currentPosition: profileData.experiences?.[0]?.title,
      currentCompany: profileData.experiences?.[0]?.company,
      headline: profileData.headline,
      summary: profileData.summary,
      experiences: profileData.experiences,
      skills: profileData.skills,
      education: profileData.education,
    })

    // 5. Construire les données enrichies
    const enrichedData: EnrichedProfileData = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.email,
      phone: profileData.phone,
      location: profileData.location,
      currentPosition: profileData.experiences?.[0]?.title,
      currentCompany: profileData.experiences?.[0]?.company,
      profileUrl: linkedInUrl,
      estimatedSeniority: tagResult.estimatedSeniority,
      estimatedSector: tagResult.estimatedSector,
      tags: tagResult.tags,
      notes: tagResult.suggestedNotes,
      suggestedNotes: tagResult.suggestedNotes,
      linkedinHeadline: profileData.headline,
      linkedinSummary: profileData.summary,
      experiences: profileData.experiences,
      education: profileData.education,
      skills: profileData.skills,
      languages: profileData.languages,
    }

    // 6. Mettre en cache pour éviter les requêtes futures
    await cacheProfile(linkedInUrl, enrichedData)

    // 7. Marquer la session comme utilisée
    await sessionPool.markSessionUsed(sessionUserId)

    return enrichedData
  } catch (error) {
    // Gérer l'erreur et mettre à jour le niveau de risque
    await sessionPool.handleError(sessionUserId, error as Error)
    throw error
  }
}

