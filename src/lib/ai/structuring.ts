import OpenAI from 'openai'

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

interface StructuredProfile {
  firstName?: string
  lastName?: string
  currentPosition?: string
  currentCompany?: string
  location?: string
  estimatedSeniority?: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'
  estimatedSector?: string
  skills?: string[]
}

export async function structureProfile(rawText: string): Promise<StructuredProfile> {
  const prompt = `Extrais les informations de ce profil LinkedIn ou CV.

TEXTE:
${rawText}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown):
{
  "firstName": "<prénom>",
  "lastName": "<nom>",
  "currentPosition": "<poste actuel>",
  "currentCompany": "<entreprise actuelle>",
  "location": "<ville, pays>",
  "estimatedSeniority": "<JUNIOR|MID|SENIOR|LEAD|EXECUTIVE>",
  "estimatedSector": "<secteur d'activité>",
  "skills": ["<compétence1>", "<compétence2>", ...]
}

Laisse les champs vides si l'information n'est pas disponible.`

  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content || '{}'
    return JSON.parse(content)
  } catch (error) {
    console.error('Structuring error:', error)
    return {}
  }
}

export async function parseLinkedInUrl(url: string): Promise<StructuredProfile> {
  // In production, you'd scrape or use LinkedIn API
  // For now, extract what we can from the URL
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/)
  if (match) {
    const slug = match[1]
    const parts = slug.split('-')
    if (parts.length >= 2) {
      return {
        firstName: parts[0].charAt(0).toUpperCase() + parts[0].slice(1),
        lastName: parts[1].charAt(0).toUpperCase() + parts[1].slice(1),
      }
    }
  }
  return {}
}

