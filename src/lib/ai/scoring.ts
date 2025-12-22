import OpenAI from 'openai'
import type { Mission, Candidate } from '@/generated/prisma'

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

interface ScoringResult {
  score: number
  reasons: string[]
  recommendation: 'add' | 'archive' | 'review'
}

export async function scoreCandidate(
  candidate: Candidate,
  mission: Mission
): Promise<ScoringResult> {
  const prompt = `Tu es un expert en recrutement. Évalue la compatibilité entre ce candidat et cette mission.

CANDIDAT:
- Nom: ${candidate.firstName} ${candidate.lastName}
- Poste actuel: ${candidate.currentPosition || 'Non renseigné'}
- Entreprise: ${candidate.currentCompany || 'Non renseignée'}
- Localisation: ${candidate.location || 'Non renseignée'}
- Séniorité estimée: ${candidate.estimatedSeniority || 'Non renseignée'}
- Secteur estimé: ${candidate.estimatedSector || 'Non renseigné'}

MISSION:
- Titre: ${mission.title}
- Localisation: ${mission.location || 'Non renseignée'}
- Séniorité recherchée: ${mission.seniority || 'Non renseignée'}
- Compétences requises: ${mission.mustHave || 'Non renseignées'}
- Compétences souhaitées: ${mission.niceToHave || 'Non renseignées'}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown):
{
  "score": <nombre entre 0 et 100>,
  "reasons": [<3 raisons courtes maximum>],
  "recommendation": "<add|archive|review>"
}

- "add": score >= 60, profil pertinent
- "review": score 40-59, à examiner
- "archive": score < 40, peu pertinent`

  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content || '{}'
    const result = JSON.parse(content)

    return {
      score: Math.min(100, Math.max(0, result.score || 50)),
      reasons: result.reasons || [],
      recommendation: result.recommendation || 'review',
    }
  } catch (error) {
    console.error('Scoring error:', error)
    // Fallback to basic scoring
    return {
      score: 50,
      reasons: ['Score automatique - vérification manuelle recommandée'],
      recommendation: 'review',
    }
  }
}

