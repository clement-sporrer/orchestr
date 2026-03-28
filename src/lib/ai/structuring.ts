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

export interface EnrichedProfileData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  location?: string
  currentPosition?: string
  currentCompany?: string
  linkedin: string
  estimatedSeniority?: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'
  estimatedSector?: string
  tags: string[]
  notes?: string
  suggestedNotes?: string
  // Enrichment data
  linkedinHeadline?: string
  linkedinSummary?: string
  experiences?: Array<{
    company: string
    title: string
    startDate?: string
    endDate?: string
    description?: string
  }>
  education?: Array<{
    school: string
    degree?: string
    field?: string
    year?: string
  }>
  skills?: string[]
  languages?: string[]
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

export function parseLinkedInUrl(url: string): { firstName?: string; lastName?: string; slug?: string } {
  // Extract info from LinkedIn URL slug
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/)
  if (match) {
    const slug = match[1]
    // Remove trailing numbers (LinkedIn sometimes adds these)
    const cleanSlug = slug.replace(/-\d+$/, '')
    const parts = cleanSlug.split('-').filter(p => p.length > 0)
    
    if (parts.length >= 2) {
      // Handle common patterns like "jean-dupont" or "jean-pierre-dupont"
      // Usually first name is first, last name is last
      return {
        firstName: parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
        lastName: parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' '),
        slug,
      }
    } else if (parts.length === 1) {
      return {
        firstName: parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
        slug,
      }
    }
    return { slug }
  }
  return {}
}

// Generate smart tags based on profile data
export async function generateProfileTags(profileData: {
  currentPosition?: string
  currentCompany?: string
  headline?: string
  summary?: string
  experiences?: Array<{ company: string; title: string; description?: string }>
  skills?: string[]
  education?: Array<{ school: string; degree?: string; field?: string }>
}): Promise<{
  tags: string[]
  estimatedSeniority?: 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE'
  estimatedSector?: string
  suggestedNotes?: string
}> {
  const contextParts: string[] = []
  
  if (profileData.currentPosition) {
    contextParts.push(`Poste actuel: ${profileData.currentPosition}`)
  }
  if (profileData.currentCompany) {
    contextParts.push(`Entreprise: ${profileData.currentCompany}`)
  }
  if (profileData.headline) {
    contextParts.push(`Headline LinkedIn: ${profileData.headline}`)
  }
  if (profileData.summary) {
    contextParts.push(`Résumé: ${profileData.summary.substring(0, 500)}`)
  }
  if (profileData.experiences && profileData.experiences.length > 0) {
    const expSummary = profileData.experiences.slice(0, 3).map(e => 
      `${e.title} @ ${e.company}`
    ).join(', ')
    contextParts.push(`Expériences récentes: ${expSummary}`)
  }
  if (profileData.skills && profileData.skills.length > 0) {
    contextParts.push(`Compétences: ${profileData.skills.slice(0, 10).join(', ')}`)
  }
  if (profileData.education && profileData.education.length > 0) {
    const eduSummary = profileData.education.slice(0, 2).map(e => 
      `${e.degree || ''} ${e.field || ''} @ ${e.school}`.trim()
    ).join(', ')
    contextParts.push(`Formation: ${eduSummary}`)
  }

  if (contextParts.length === 0) {
    return { tags: [] }
  }

  const prompt = `Tu es un expert en recrutement. Analyse ce profil et génère des tags pertinents pour le catégoriser.

PROFIL:
${contextParts.join('\n')}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown ni backticks):
{
  "tags": ["<tag1>", "<tag2>", ...],
  "estimatedSeniority": "<JUNIOR|MID|SENIOR|LEAD|EXECUTIVE>",
  "estimatedSector": "<secteur d'activité principal>",
  "suggestedNotes": "<2-3 phrases résumant les points forts du profil>"
}

RÈGLES POUR LES TAGS:
- Maximum 8 tags
- Tags courts (1-3 mots max)
- En français
- Inclure: domaine d'expertise, technologies clés, type de rôle, soft skills détectées
- Exemples: "Tech Lead", "React", "Fintech", "Startup", "Management", "Full Remote", "Scale-up"
- Ne pas répéter ce qui est déjà dans le poste ou l'entreprise

RÈGLES POUR LA SÉNIORITÉ:
- JUNIOR: 0-2 ans d'expérience
- MID: 3-5 ans d'expérience
- SENIOR: 6-10 ans d'expérience
- LEAD: Management d'équipe ou expertise technique avancée
- EXECUTIVE: Direction, C-Level, VP`

  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content || '{}'
    // Clean potential markdown formatting
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleanContent)
    
    return {
      tags: Array.isArray(result.tags) ? result.tags.slice(0, 8) : [],
      estimatedSeniority: result.estimatedSeniority,
      estimatedSector: result.estimatedSector,
      suggestedNotes: result.suggestedNotes,
    }
  } catch (error) {
    console.error('Tag generation error:', error)
    // Fallback: generate basic tags from skills
    const basicTags: string[] = []
    if (profileData.skills) {
      basicTags.push(...profileData.skills.slice(0, 5))
    }
    return { tags: basicTags }
  }
}

// Full enrichment from LinkedIn URL or profile text
export async function enrichProfileFromText(text: string): Promise<Partial<EnrichedProfileData>> {
  const prompt = `Extrais et structure les informations de ce profil professionnel.

TEXTE:
${text}

Réponds UNIQUEMENT avec un objet JSON valide (sans markdown ni backticks):
{
  "firstName": "<prénom>",
  "lastName": "<nom>",
  "email": "<email si trouvé>",
  "phone": "<téléphone si trouvé>",
  "location": "<ville, pays>",
  "currentPosition": "<poste actuel>",
  "currentCompany": "<entreprise actuelle>",
  "estimatedSeniority": "<JUNIOR|MID|SENIOR|LEAD|EXECUTIVE>",
  "estimatedSector": "<secteur d'activité>",
  "tags": ["<tag pertinent 1>", "<tag pertinent 2>", ...],
  "suggestedNotes": "<résumé du profil en 2-3 phrases>",
  "skills": ["<compétence1>", "<compétence2>", ...]
}

RÈGLES:
- Laisse null les champs non trouvés
- Maximum 8 tags courts et pertinents
- Tags en français
- Le résumé doit mettre en avant les points forts`

  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 800,
    })

    const content = response.choices[0]?.message?.content || '{}'
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleanContent)
  } catch (error) {
    console.error('Profile enrichment error:', error)
    return {}
  }
}

