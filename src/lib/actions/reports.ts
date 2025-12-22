'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import OpenAI from 'openai'
import type { ReportType } from '@/generated/prisma'

// Schema for report template sections
const sectionSchema = z.object({
  title: z.string(),
  prompt: z.string(),
  required: z.boolean().default(true),
  order: z.number().default(0),
})

const reportTemplateSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  type: z.enum(['INDIVIDUAL', 'SHORTLIST', 'CLIENT_SUMMARY']),
  sections: z.array(sectionSchema).min(1, 'Au moins une section requise'),
  isDefault: z.boolean().default(false),
})

// Helper to get current user's organization
async function getOrganizationId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    throw new Error('Non authentifie')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { organizationId: true },
  })

  if (!dbUser) {
    throw new Error('Utilisateur non trouve')
  }

  return dbUser.organizationId
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({ apiKey })
}

// Get all report templates
export async function getReportTemplates(type?: ReportType) {
  const organizationId = await getOrganizationId()

  const templates = await prisma.reportTemplate.findMany({
    where: {
      organizationId,
      ...(type ? { type } : {}),
    },
    orderBy: [
      { isDefault: 'desc' },
      { name: 'asc' },
    ],
  })

  return templates
}

// Get single template
export async function getReportTemplate(id: string) {
  const organizationId = await getOrganizationId()

  const template = await prisma.reportTemplate.findFirst({
    where: { id, organizationId },
  })

  if (!template) {
    throw new Error('Template non trouve')
  }

  return template
}

// Create template
export async function createReportTemplate(data: z.infer<typeof reportTemplateSchema>) {
  const organizationId = await getOrganizationId()
  const validated = reportTemplateSchema.parse(data)

  // If setting as default, unset other defaults of same type
  if (validated.isDefault) {
    await prisma.reportTemplate.updateMany({
      where: { organizationId, type: validated.type },
      data: { isDefault: false },
    })
  }

  const template = await prisma.reportTemplate.create({
    data: {
      ...validated,
      sections: validated.sections,
      organizationId,
    },
  })

  revalidatePath('/settings/templates')
  return template
}

// Update template
export async function updateReportTemplate(
  id: string, 
  data: Partial<z.infer<typeof reportTemplateSchema>>
) {
  const organizationId = await getOrganizationId()

  const existing = await prisma.reportTemplate.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Template non trouve')
  }

  // If setting as default, unset other defaults of same type
  if (data.isDefault) {
    await prisma.reportTemplate.updateMany({
      where: { 
        organizationId, 
        type: data.type || existing.type,
        id: { not: id },
      },
      data: { isDefault: false },
    })
  }

  const template = await prisma.reportTemplate.update({
    where: { id },
    data: {
      ...data,
      sections: data.sections || undefined,
    },
  })

  revalidatePath('/settings/templates')
  return template
}

// Delete template
export async function deleteReportTemplate(id: string) {
  const organizationId = await getOrganizationId()

  const existing = await prisma.reportTemplate.findFirst({
    where: { id, organizationId },
  })

  if (!existing) {
    throw new Error('Template non trouve')
  }

  await prisma.reportTemplate.delete({
    where: { id },
  })

  revalidatePath('/settings/templates')
}

// Generate individual interview report
export async function generateInterviewReport(
  interviewId: string,
  templateId?: string
) {
  const organizationId = await getOrganizationId()

  // Get interview with all related data
  const interview = await prisma.interview.findFirst({
    where: { id: interviewId },
    include: {
      missionCandidate: {
        include: {
          candidate: {
            include: { enrichment: true },
          },
          mission: {
            select: { 
              id: true, 
              title: true, 
              organizationId: true,
              mustHave: true,
              niceToHave: true,
              responsibilities: true,
            },
          },
          questionnaireResponses: {
            include: {
              answers: {
                include: { question: true },
              },
            },
          },
        },
      },
    },
  })

  if (!interview || interview.missionCandidate.mission.organizationId !== organizationId) {
    throw new Error('Entretien non trouve')
  }

  // Get template
  let template = null
  if (templateId) {
    template = await prisma.reportTemplate.findFirst({
      where: { id: templateId, organizationId },
    })
  }
  
  if (!template) {
    // Get default template or use fallback
    template = await prisma.reportTemplate.findFirst({
      where: { organizationId, type: 'INDIVIDUAL', isDefault: true },
    })
  }

  const sections = (template?.sections as Array<{ title: string; prompt: string; required: boolean }>) || [
    { title: 'Resume', prompt: 'Resume l\'entretien en 3 phrases cles', required: true },
    { title: 'Points forts', prompt: 'Liste les 3 principaux atouts du candidat', required: true },
    { title: 'Points de vigilance', prompt: 'Identifie les risques ou zones d\'ombre', required: true },
    { title: 'Recommandation', prompt: 'GO/NO GO avec justification', required: true },
  ]

  const { candidate, mission } = interview.missionCandidate
  const enrichment = candidate.enrichment

  // Build context for AI
  const context = `
ENTRETIEN - ${mission.title}
Date: ${new Date(interview.scheduledAt).toLocaleDateString('fr-FR')}
Type: ${interview.type}

CANDIDAT:
- Nom: ${candidate.firstName} ${candidate.lastName}
- Poste actuel: ${candidate.currentPosition || 'Non renseigne'}
- Entreprise: ${candidate.currentCompany || 'Non renseignee'}
${enrichment ? `- Headline LinkedIn: ${enrichment.linkedinHeadline || 'N/A'}` : ''}
${enrichment?.skills?.length ? `- Competences: ${enrichment.skills.slice(0, 10).join(', ')}` : ''}

MISSION:
- Responsabilites: ${mission.responsibilities?.substring(0, 500) || 'Non specifiees'}
- Competences requises: ${mission.mustHave?.substring(0, 300) || 'Non specifiees'}
- Competences appreciees: ${mission.niceToHave?.substring(0, 200) || 'Non specifiees'}

NOTES DE L'ENTRETIEN:
${interview.recruiterNotes || 'Aucune note disponible'}

TRANSCRIPT:
${interview.transcriptText?.substring(0, 3000) || 'Aucun transcript disponible'}
`

  // Generate each section
  const reportContent: Record<string, string> = {}

  try {
    const openai = getOpenAI()

    for (const section of sections) {
      const prompt = `Tu es un expert en recrutement. Basé sur les informations suivantes, ${section.prompt}.

${context}

REGLE: Reponds de maniere concise et professionnelle. Maximum 200 mots.`

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 400,
      })

      reportContent[section.title] = response.choices[0]?.message?.content || 'Non genere'
    }
  } catch (error) {
    console.error('Report generation error:', error)
    throw new Error('Erreur lors de la generation du rapport')
  }

  // Format as markdown
  const markdown = sections.map(s => 
    `## ${s.title}\n\n${reportContent[s.title] || 'Non disponible'}`
  ).join('\n\n')

  // Save to interview
  await prisma.interview.update({
    where: { id: interviewId },
    data: {
      reportContent: markdown,
      reportGeneratedAt: new Date(),
      reportTemplateId: template?.id,
    },
  })

  revalidatePath(`/missions/${mission.id}`)
  
  return { content: markdown, sections: reportContent }
}

// Generate shortlist report
export async function generateShortlistReport(
  shortlistId: string,
  templateId?: string
) {
  const organizationId = await getOrganizationId()

  const shortlist = await prisma.shortlist.findFirst({
    where: { id: shortlistId },
    include: {
      mission: {
        select: { 
          id: true, 
          title: true, 
          organizationId: true,
          mustHave: true,
          client: { select: { name: true } },
        },
      },
      candidates: {
        include: {
          missionCandidate: {
            include: {
              candidate: {
                include: { enrichment: true },
              },
              interviews: {
                where: { status: 'COMPLETED' },
                orderBy: { scheduledAt: 'desc' },
                take: 1,
              },
              questionnaireResponses: {
                include: {
                  answers: {
                    include: { question: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!shortlist || shortlist.mission.organizationId !== organizationId) {
    throw new Error('Shortlist non trouvee')
  }

  // Build comprehensive context
  const candidatesSummary = shortlist.candidates.map((sc, idx) => {
    const { candidate, interviews, questionnaireResponses } = sc.missionCandidate
    const interview = interviews[0]
    
    return `
### Candidat ${idx + 1}: ${candidate.firstName} ${candidate.lastName}
- Poste actuel: ${candidate.currentPosition || 'N/A'} @ ${candidate.currentCompany || 'N/A'}
- Score: ${sc.missionCandidate.score || 'N/A'}%
- Resume entretien: ${interview?.reportContent?.substring(0, 500) || 'Non disponible'}
${sc.summary ? `- Note recruteur: ${sc.summary}` : ''}
`
  }).join('\n')

  const prompt = `Tu es un expert en recrutement. Genere un rapport de shortlist complet pour le client.

MISSION: ${shortlist.mission.title}
CLIENT: ${shortlist.mission.client.name}
COMPETENCES REQUISES: ${shortlist.mission.mustHave || 'Non specifiees'}

CANDIDATS DE LA SHORTLIST:
${candidatesSummary}

STRUCTURE DU RAPPORT:
1. Synthese executive (3-4 phrases pour le client)
2. Tableau comparatif (forces/faiblesses de chaque candidat)
3. Recommandation finale avec ordre de priorite
4. Prochaines etapes suggerees

Reponds en format Markdown structure.`

  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2000,
    })

    const reportContent = response.choices[0]?.message?.content || ''

    // Store the report (you might want to add a shortlistReport field to the schema)
    // For now, we return it
    
    return { content: reportContent }
  } catch (error) {
    console.error('Shortlist report generation error:', error)
    throw new Error('Erreur lors de la generation du rapport')
  }
}

// Default template for new organizations
export const DEFAULT_INDIVIDUAL_TEMPLATE = {
  name: 'Compte-rendu standard',
  type: 'INDIVIDUAL' as ReportType,
  sections: [
    { title: 'Resume', prompt: 'Resume l\'entretien en 3 phrases cles', required: true, order: 0 },
    { title: 'Points forts', prompt: 'Liste les 3 principaux atouts du candidat', required: true, order: 1 },
    { title: 'Points de vigilance', prompt: 'Identifie les risques ou zones d\'ombre', required: true, order: 2 },
    { title: 'Fit culturel', prompt: 'Evalue l\'adequation avec la culture client', required: true, order: 3 },
    { title: 'Motivation', prompt: 'Analyse la motivation et le projet professionnel', required: true, order: 4 },
    { title: 'Recommandation', prompt: 'GO/NO GO avec justification en 2 phrases', required: true, order: 5 },
  ],
  isDefault: true,
}



