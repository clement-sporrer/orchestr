import OpenAI from 'openai'
import type { Mission, Candidate, CandidateEnrichment } from '@/generated/prisma'

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

type MessageType = 'initial_contact' | 'follow_up' | 'rejection' | 'interview_confirmation'
type MessageFormat = 'linkedin_connection' | 'linkedin_inmail' | 'email'

interface GeneratedMessage {
  subject?: string
  content: string
}

export async function generateMessage(
  type: MessageType,
  candidate: Candidate,
  mission: Mission,
  recruiterName?: string
): Promise<GeneratedMessage> {
  const prompts: Record<MessageType, string> = {
    initial_contact: `Génère un message de premier contact pour un candidat.

CANDIDAT: ${candidate.firstName} ${candidate.lastName}
POSTE ACTUEL: ${candidate.currentPosition || 'Non renseigné'}
ENTREPRISE: ${candidate.currentCompany || 'Non renseignée'}

MISSION: ${mission.title}
CLIENT: Entreprise confidentielle
LOCALISATION: ${mission.location || 'Non renseignée'}

Le message doit être:
- Court (150 mots max)
- Professionnel mais chaleureux
- Personnalisé au profil
- Avec un appel à l'action clair

Réponds en JSON: {"subject": "<objet email>", "content": "<message>"}`,

    follow_up: `Génère un message de relance poli pour un candidat qui n'a pas répondu.

CANDIDAT: ${candidate.firstName}
MISSION: ${mission.title}

Le message doit être:
- Très court (50 mots max)
- Poli et non insistant
- Proposer une alternative (appel, autre créneau)

Réponds en JSON: {"subject": "<objet email>", "content": "<message>"}`,

    rejection: `Génère un message de refus bienveillant pour un candidat.

CANDIDAT: ${candidate.firstName}
MISSION: ${mission.title}

Le message doit être:
- Court et respectueux
- Remercier pour l'intérêt
- Encourager pour le futur

Réponds en JSON: {"subject": "<objet email>", "content": "<message>"}`,

    interview_confirmation: `Génère un message de confirmation d'entretien.

CANDIDAT: ${candidate.firstName}
MISSION: ${mission.title}
RECRUTEUR: ${recruiterName || 'L\'équipe de recrutement'}

Le message doit confirmer l'intérêt et expliquer les prochaines étapes.

Réponds en JSON: {"subject": "<objet email>", "content": "<message>"}`,
  }

  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompts[type] }],
      temperature: 0.7,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content || '{}'
    return JSON.parse(content)
  } catch (error) {
    console.error('Message generation error:', error)
    return {
      subject: `Opportunité - ${mission.title}`,
      content: `Bonjour ${candidate.firstName},\n\nNous avons une opportunité qui pourrait vous intéresser.\n\nBien cordialement`,
    }
  }
}

// Generate approach message for LinkedIn or email
export async function generateApproachMessage(
  format: MessageFormat,
  candidate: Candidate & { enrichment?: CandidateEnrichment | null },
  mission: Mission,
  customContext?: string
): Promise<GeneratedMessage> {
  // Build candidate context from enrichment if available
  const enrichmentContext = candidate.enrichment ? `
ENRICHISSEMENT LINKEDIN:
- Headline: ${candidate.enrichment.linkedinHeadline || 'Non disponible'}
- Skills: ${candidate.enrichment.skills?.slice(0, 5).join(', ') || 'Non disponibles'}
` : ''

  const prompts: Record<MessageFormat, string> = {
    linkedin_connection: `Tu es un recruteur expert. Génère une note de connexion LinkedIn ULTRA COURTE.

CANDIDAT: ${candidate.firstName} ${candidate.lastName}
POSTE ACTUEL: ${candidate.currentPosition || 'Non renseigné'}
ENTREPRISE: ${candidate.currentCompany || 'Non renseignée'}
${enrichmentContext}

MISSION: ${mission.title}
LOCALISATION: ${mission.location || 'Non renseignée'}
${customContext ? `CONTEXTE: ${customContext}` : ''}

RÈGLES STRICTES:
- Maximum 200 caractères ABSOLUMENT
- Pas de formule de politesse ("Cher", "Bonjour")
- Une accroche personnalisée basée sur le profil
- Mentionner l'opportunité de façon concise
- Terminer par une question courte ou un appel à l'action

Réponds UNIQUEMENT avec le message, sans guillemets, sans explication.`,

    linkedin_inmail: `Tu es un recruteur expert. Génère un message LinkedIn InMail professionnel.

CANDIDAT: ${candidate.firstName} ${candidate.lastName}
POSTE ACTUEL: ${candidate.currentPosition || 'Non renseigné'}
ENTREPRISE: ${candidate.currentCompany || 'Non renseignée'}
${enrichmentContext}

MISSION: ${mission.title}
LOCALISATION: ${mission.location || 'Non renseignée'}
DESCRIPTION: ${mission.responsibilities?.substring(0, 200) || 'Non disponible'}
${customContext ? `CONTEXTE: ${customContext}` : ''}

RÈGLES:
- Maximum 1900 caractères
- Structure: accroche personnalisée, présentation de l'opportunité, call-to-action
- Ton professionnel mais chaleureux
- Mettre en avant les points communs avec le profil

Réponds en JSON: {"subject": "<objet>", "content": "<message>"}`,

    email: `Tu es un recruteur expert. Génère un email de premier contact professionnel.

CANDIDAT: ${candidate.firstName} ${candidate.lastName}
POSTE ACTUEL: ${candidate.currentPosition || 'Non renseigné'}
ENTREPRISE: ${candidate.currentCompany || 'Non renseignée'}
${enrichmentContext}

MISSION: ${mission.title}
CLIENT: Confidentiel
LOCALISATION: ${mission.location || 'Non renseignée'}
DESCRIPTION: ${mission.responsibilities?.substring(0, 300) || 'Non disponible'}
COMPÉTENCES REQUISES: ${mission.mustHave?.substring(0, 200) || 'Non spécifiées'}
${customContext ? `CONTEXTE: ${customContext}` : ''}

RÈGLES:
- Structure professionnelle avec signature
- Personnalisé au profil du candidat
- Présentation claire de l'opportunité
- Call-to-action pour un échange

Réponds en JSON: {"subject": "<objet>", "content": "<message>"}`,
  }

  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompts[format] }],
      temperature: 0.7,
      max_tokens: format === 'linkedin_connection' ? 100 : 800,
    })

    const content = response.choices[0]?.message?.content || ''
    
    // For LinkedIn connection, return just the content
    if (format === 'linkedin_connection') {
      // Clean up the response
      let cleanContent = content.trim()
      // Remove quotes if present
      if (cleanContent.startsWith('"') && cleanContent.endsWith('"')) {
        cleanContent = cleanContent.slice(1, -1)
      }
      // Truncate if still too long
      if (cleanContent.length > 200) {
        cleanContent = cleanContent.substring(0, 197) + '...'
      }
      return { content: cleanContent }
    }
    
    // For other formats, parse JSON
    try {
      return JSON.parse(content)
    } catch {
      return { content }
    }
  } catch (error) {
    console.error('Approach message generation error:', error)
    
    // Fallback messages
    if (format === 'linkedin_connection') {
      return {
        content: `${candidate.firstName}, votre profil m'interesse pour une belle opportunite ${mission.title}. Echangeons?`,
      }
    }
    
    return {
      subject: `Opportunité ${mission.title}`,
      content: `Bonjour ${candidate.firstName},\n\nVotre profil a retenu mon attention pour une opportunité ${mission.title}.\n\nSeriez-vous disponible pour en discuter?\n\nBien cordialement`,
    }
  }
}

// Generate portal invitation message
export async function generatePortalInviteMessage(
  format: MessageFormat,
  candidateFirstName: string,
  portalUrl: string,
  missionTitle?: string
): Promise<GeneratedMessage> {
  if (format === 'linkedin_connection') {
    // Short message with portal link - no AI needed, just template
    const message = `Merci ${candidateFirstName}! Découvrez l'opportunité et complétez votre profil: ${portalUrl}`
    
    if (message.length > 200) {
      return { content: `${candidateFirstName}, voici votre lien: ${portalUrl}` }
    }
    return { content: message }
  }
  
  if (format === 'linkedin_inmail') {
    return {
      subject: `Votre lien personnel - ${missionTitle || 'Opportunité'}`,
      content: `Bonjour ${candidateFirstName},

Merci pour votre intérêt pour ${missionTitle || 'cette opportunité'}!

Je vous invite à compléter votre profil via ce lien sécurisé:
${portalUrl}

Ce parcours vous permettra de:
- Découvrir le poste en détail
- Compléter vos informations
- Réserver un créneau d'entretien

À très bientôt!`,
    }
  }
  
  // Email format
  return {
    subject: `Votre espace candidat - ${missionTitle || 'Opportunité'}`,
    content: `Bonjour ${candidateFirstName},

Suite à notre échange, je vous invite à compléter votre profil candidat pour ${missionTitle || 'cette opportunité'}.

Vous pouvez accéder à votre espace personnel via ce lien sécurisé:
${portalUrl}

Ce parcours vous permettra de:
- Consulter la fiche de poste complète
- Mettre à jour vos informations
- Réserver un créneau pour un entretien
- Répondre à quelques questions complémentaires

N'hésitez pas à me contacter si vous avez des questions.

Bien cordialement`,
  }
}

