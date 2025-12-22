import puppeteer from 'puppeteer'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/utils/encryption'
import { checkSessionSafety, markSessionUsed, handleScrapingError } from './linkedin-risk-detection'
import type { LinkedInProfileData } from '@/app/api/extension/capture/route'

// Timeouts et limites de sécurité
const SCRAPING_TIMEOUT_MS = 30000 // 30 secondes max
const PAGE_LOAD_TIMEOUT_MS = 15000 // 15 secondes pour charger la page
const MAX_RETRIES = 2 // Maximum 2 tentatives

/**
 * Scrape un profil LinkedIn de manière sécurisée
 * Utilise la session de l'utilisateur pour éviter les blocages
 */
export async function scrapeLinkedInProfile(
  linkedInUrl: string,
  userId: string
): Promise<LinkedInProfileData | null> {
  // Vérifier que l'URL est valide
  if (!linkedInUrl.includes('linkedin.com/in/')) {
    throw new Error('URL LinkedIn invalide')
  }

  // Vérifier la sécurité de la session AVANT de commencer
  const safetyCheck = await checkSessionSafety(userId)
  if (!safetyCheck.isSafe) {
    throw new Error(
      safetyCheck.reason || 'Session non disponible pour des raisons de sécurité'
    )
  }

  // Récupérer les informations de session
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      linkedinAccessToken: true,
      linkedinCookies: true,
    },
  })

  if (!user?.linkedinAccessToken) {
    throw new Error('LinkedIn non connecté pour cet utilisateur')
  }

  let browser: puppeteer.Browser | null = null
  let retryCount = 0

  while (retryCount <= MAX_RETRIES) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
        timeout: SCRAPING_TIMEOUT_MS,
      })

      const page = await browser.newPage()

      // Configurer les headers pour ressembler à un navigateur réel
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Utiliser les cookies de session si disponibles
      if (user.linkedinCookies) {
        try {
          const cookies = user.linkedinCookies as any[]
          if (Array.isArray(cookies) && cookies.length > 0) {
            await page.setCookie(...cookies)
          }
        } catch (cookieError) {
          console.warn('Erreur lors de la mise en place des cookies:', cookieError)
          // Continuer sans cookies si erreur
        }
      }

      // Naviguer vers le profil avec timeout
      await page.goto(linkedInUrl, {
        waitUntil: 'networkidle2',
        timeout: PAGE_LOAD_TIMEOUT_MS,
      })

      // Vérifier si LinkedIn a détecté un bot (page de login ou captcha)
      const pageUrl = page.url()
      if (pageUrl.includes('challenge') || pageUrl.includes('login')) {
        throw new Error('LinkedIn a détecté une activité suspecte - connexion requise')
      }

      // Attendre que le contenu soit chargé
      await page.waitForSelector('h1', { timeout: 10000 })

      // Extraire les données
      const profileData = await page.evaluate(() => {
        const data: Partial<LinkedInProfileData> = {
          linkedinUrl: window.location.href.split('?')[0],
          firstName: '',
          lastName: '',
          experiences: [],
          education: [],
          skills: [],
          languages: [],
        }

        try {
          // Extract name
          const nameEl =
            document.querySelector('h1.text-heading-xlarge') ||
            document.querySelector('h1')
          if (nameEl) {
            const parts = nameEl.textContent?.trim().split(' ') || []
            data.firstName = parts[0] || ''
            data.lastName = parts.slice(1).join(' ') || ''
          }

          // Extract headline
          const headlineEl = document.querySelector('.text-body-medium.break-words')
          if (headlineEl) {
            data.headline = headlineEl.textContent?.trim() || ''
          }

          // Extract location
          const locationEl = document.querySelector('.text-body-small.inline')
          if (locationEl) {
            data.location = locationEl.textContent?.trim() || ''
          }

          // Extract summary
          const summaryEl = document.querySelector(
            '#about ~ .display-flex .pv-shared-text-with-see-more span[aria-hidden="true"]'
          )
          if (summaryEl) {
            data.summary = summaryEl.textContent?.trim() || ''
          }

          // Extract experiences
          const expCards = document.querySelectorAll(
            '#experience ~ .pvs-list__outer-container > ul > li'
          )
          expCards.forEach((card) => {
            const titleEl = card.querySelector('.t-bold span[aria-hidden="true"]')
            const companyEl = card.querySelector('.t-normal span[aria-hidden="true"]')
            const dateRangeEl = card.querySelector('.pvs-entity__caption-wrapper')

            if (titleEl && companyEl) {
              const experience: any = {
                title: titleEl.textContent?.trim() || '',
                company: companyEl.textContent?.trim().replace('·', '').trim() || '',
              }

              if (dateRangeEl) {
                const dateText = dateRangeEl.textContent?.trim() || ''
                const dateMatch = dateText.match(
                  /([A-Za-z]+ \d{4})\s*[-–]\s*([A-Za-z]+ \d{4}|Present|Présent)/
                )
                if (dateMatch) {
                  experience.startDate = dateMatch[1]
                  experience.endDate =
                    dateMatch[2] === 'Present' || dateMatch[2] === 'Présent'
                      ? ''
                      : dateMatch[2]
                }
              }

              data.experiences!.push(experience)
            }
          })

          // Extract education
          const eduCards = document.querySelectorAll(
            '#education ~ .pvs-list__outer-container > ul > li'
          )
          eduCards.forEach((card) => {
            const schoolEl = card.querySelector('.t-bold span[aria-hidden="true"]')
            const degreeEl = card.querySelector('.t-normal span[aria-hidden="true"]')
            const yearEl = card.querySelector('.pvs-entity__caption-wrapper')

            if (schoolEl) {
              const education: any = {
                school: schoolEl.textContent?.trim() || '',
                degree: degreeEl ? degreeEl.textContent?.trim() : '',
              }

              if (yearEl) {
                const yearMatch = yearEl.textContent?.match(/(\d{4})/)
                if (yearMatch) {
                  education.year = yearMatch[1]
                }
              }

              data.education!.push(education)
            }
          })

          // Extract skills
          const skillEls = document.querySelectorAll(
            '#skills ~ .pvs-list__outer-container .t-bold span[aria-hidden="true"]'
          )
          skillEls.forEach((el) => {
            const skill = el.textContent?.trim()
            if (skill && !data.skills!.includes(skill)) {
              data.skills!.push(skill)
            }
          })
          data.skills = data.skills!.slice(0, 20)

          // Extract languages
          const langEls = document.querySelectorAll(
            '#languages ~ .pvs-list__outer-container .t-bold span[aria-hidden="true"]'
          )
          langEls.forEach((el) => {
            const lang = el.textContent?.trim()
            if (lang && !data.languages!.includes(lang)) {
              data.languages!.push(lang)
            }
          })
        } catch (error) {
          console.error('Error in page evaluation:', error)
        }

        return data
      })

      // Vérifier qu'on a au moins le nom
      if (!profileData.firstName || !profileData.lastName) {
        throw new Error('Impossible d\'extraire les informations du profil')
      }

      // Marquer la session comme utilisée (succès)
      await markSessionUsed(userId)

      // Sauvegarder les cookies pour les prochaines requêtes
      try {
        const cookies = await page.cookies()
        if (cookies.length > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              linkedinCookies: cookies as any,
            },
          })
        }
      } catch (cookieError) {
        console.warn('Erreur lors de la sauvegarde des cookies:', cookieError)
      }

      await browser.close()

      return profileData as LinkedInProfileData
    } catch (error) {
      if (browser) {
        try {
          await browser.close()
        } catch {
          // Ignorer les erreurs de fermeture
        }
      }

      const errorMessage = error instanceof Error ? error.message : String(error)

      // Si c'est la dernière tentative, gérer l'erreur
      if (retryCount >= MAX_RETRIES) {
        await handleScrapingError(userId, new Error(errorMessage))
        throw new Error(`Échec du scraping après ${MAX_RETRIES + 1} tentatives: ${errorMessage}`)
      }

      // Attendre avant de réessayer (backoff exponentiel)
      const waitTime = Math.min(1000 * Math.pow(2, retryCount), 5000)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      retryCount++
    }
  }

  return null
}

