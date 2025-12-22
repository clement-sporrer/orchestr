import OpenAI from 'openai'
import type { Mission, Candidate } from '@/generated/prisma'

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

type MessageType = 'initial_contact' | 'follow_up' | 'rejection' | 'interview_confirmation'

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

