import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { enrichLinkedInProfile } from '@/lib/services/linkedin-enrichment'
import { checkCandidateExists } from '@/lib/actions/candidates'

/**
 * Route API pour enrichir un profil LinkedIn automatiquement
 * Utilise le pool de sessions pour distribuer la charge
 * et protéger les comptes utilisateurs
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        linkedinConnected: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    const body = await request.json()
    const { linkedInUrl } = body

    if (!linkedInUrl || !linkedInUrl.includes('linkedin.com/in/')) {
      return NextResponse.json(
        { error: 'URL LinkedIn invalide. Format attendu: https://linkedin.com/in/nom-prenom' },
        { status: 400 }
      )
    }

    // L'enrichissement automatique via scraping nécessite une connexion LinkedIn
    // Recommandation : utiliser l'extension Chrome (gratuit et plus fiable)
    return NextResponse.json(
      {
        error: 'Enrichissement automatique non disponible',
        action: 'use_extension',
        message:
          'Pour enrichir les profils LinkedIn, nous recommandons d\'utiliser l\'extension Chrome. ' +
          'Elle est gratuite, plus fiable et ne nécessite pas de connexion OAuth. ' +
          'Consultez le guide d\'installation dans les paramètres.',
        fallback: 'extension_chrome',
      },
      { status: 403 }
    )

    try {
      // Enrichir le profil
      const enrichedData = await enrichLinkedInProfile(linkedInUrl, dbUser.id)

      // Vérifier les doublons
      const duplicate = await checkCandidateExists({
        profileUrl: linkedInUrl,
        firstName: enrichedData.firstName,
        lastName: enrichedData.lastName,
      })

      return NextResponse.json({
        success: true,
        data: enrichedData,
        duplicate: duplicate.exists
          ? {
              exists: true,
              candidate: duplicate.candidate,
            }
          : { exists: false },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'

      // Erreurs spécifiques
      if (errorMessage.includes('session LinkedIn disponible')) {
        return NextResponse.json(
          {
            error: errorMessage,
            action: 'wait_or_connect',
            message:
              'Tous les comptes LinkedIn ont atteint leur limite de sécurité. ' +
              'Veuillez réessayer dans quelques minutes ou connectez plus de comptes LinkedIn.',
          },
          { status: 429 }
        )
      }

      if (errorMessage.includes('LinkedIn non connecté')) {
        return NextResponse.json(
          {
            error: errorMessage,
            action: 'connect_linkedin',
            message: 'Veuillez connecter votre compte LinkedIn dans les paramètres.',
          },
          { status: 403 }
        )
      }

      if (errorMessage.includes('détecté une activité suspecte')) {
        return NextResponse.json(
          {
            error: 'LinkedIn a détecté une activité suspecte',
            action: 'use_extension',
            message:
              'Pour votre sécurité, veuillez utiliser l\'extension Chrome ou copier-coller le contenu du profil.',
          },
          { status: 403 }
        )
      }

      // Erreur générique
      console.error('LinkedIn enrichment error:', error)
      return NextResponse.json(
        {
          error: 'Erreur lors de l\'enrichissement',
          message:
            errorMessage ||
            'Une erreur est survenue. Veuillez utiliser l\'extension Chrome ou copier-coller le contenu du profil.',
          fallback: 'use_extension_or_manual',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

