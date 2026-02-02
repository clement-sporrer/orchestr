'use server'

import { prisma } from '@/lib/prisma'
import {
  candidateFiltersSchema,
  type CandidateFilters,
  SENIORITY_LABELS,
  RECRUITABLE_STATUS_LABELS,
} from '@/lib/validations/candidate'
import { getOrganizationId } from '@/lib/auth/helpers'
import { buildCandidateWhereClause } from '@/lib/filters/candidate-where'

/**
 * Export candidates to CSV format
 * Applies same filters as list view (shared where clause)
 */
export async function exportCandidatesCSV(filters?: CandidateFilters) {
  try {
    const organizationId = await getOrganizationId()

    const validatedFilters = filters
      ? candidateFiltersSchema.omit({ page: true, limit: true }).parse(filters)
      : undefined

    const whereClause = buildCandidateWhereClause(organizationId, validatedFilters)

    // Fetch all matching candidates (no pagination limit for export)
    // Limit to 10000 to prevent memory issues
    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        linkedin: true,
        phone: true,
        age: true,
        country: true,
        city: true,
        region: true,
        languages: true,
        seniority: true,
        domain: true,
        sector: true,
        currentCompany: true,
        currentPosition: true,
        pastCompanies: true,
        jobFamily: true,
        hardSkills: true,
        softSkills: true,
        compensation: true,
        comments: true,
        references: true,
        recruitable: true,
        files: true,
        tags: true,
        status: true,
        relationshipLevel: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10000, // Max export limit
    })

    // Convert to CSV
    const csv = convertCandidatesToCSV(candidates)

    return {
      success: true,
      data: csv,
      count: candidates.length,
    }
  } catch (error) {
    console.error('Error exporting candidates to CSV:', error)
    return {
      success: false,
      error: "Erreur lors de l'export CSV",
    }
  }
}

/**
 * Convert candidates array to CSV string
 */
function convertCandidatesToCSV(candidates: any[]): string {
  // CSV Headers (all 28 fields + metadata)
  const headers = [
    // Identity
    'ID',
    'Prénom',
    'Nom',
    // Contact
    'Email',
    'LinkedIn',
    'Téléphone',
    'Âge',
    // Localisation
    'Pays',
    'Ville',
    'Région',
    // Langues
    'Langues',
    // Expérience
    'Séniorité',
    'Domaine',
    'Secteur',
    'Entreprise Actuelle',
    'Poste Actuel',
    'Entreprises Passées',
    'Famille de Poste',
    // Compétences
    'Hard Skills',
    'Soft Skills',
    // Infos Additionnelles
    'Rémunération',
    'Commentaires',
    'Références',
    'Recrutabilité',
    // Fichiers
    'Fichiers',
    // Métadonnées
    'Tags',
    'Statut',
    'Niveau de Relation',
    'Date de Création',
    'Dernière Mise à Jour',
  ]

  // Build CSV rows
  const rows = candidates.map((c) => {
    // Format languages JSON
    const languagesStr = c.languages
      ? (c.languages as any[]).map((l) => `${l.language} (${l.level})`).join('; ')
      : ''

    // Format tags
    const tagsStr = c.tags ? c.tags.join('; ') : ''

    // Format files
    const filesStr = c.files ? c.files.join('; ') : ''

    // Format dates
    const createdAtStr = c.createdAt
      ? new Date(c.createdAt).toLocaleDateString('fr-FR')
      : ''
    const updatedAtStr = c.updatedAt
      ? new Date(c.updatedAt).toLocaleDateString('fr-FR')
      : ''

    // Format seniority
    const seniorityStr = c.seniority
      ? SENIORITY_LABELS[c.seniority as keyof typeof SENIORITY_LABELS]
      : ''

    // Format recruitable
    const recruitableStr = c.recruitable
      ? RECRUITABLE_STATUS_LABELS[
          c.recruitable as keyof typeof RECRUITABLE_STATUS_LABELS
        ]
      : ''

    return [
      c.id || '',
      escapeCSV(c.firstName || ''),
      escapeCSV(c.lastName || ''),
      escapeCSV(c.email || ''),
      escapeCSV(c.linkedin || ''),
      escapeCSV(c.phone || ''),
      c.age || '',
      escapeCSV(c.country || ''),
      escapeCSV(c.city || ''),
      escapeCSV(c.region || ''),
      escapeCSV(languagesStr),
      escapeCSV(seniorityStr),
      escapeCSV(c.domain || ''),
      escapeCSV(c.sector || ''),
      escapeCSV(c.currentCompany || ''),
      escapeCSV(c.currentPosition || ''),
      escapeCSV(c.pastCompanies || ''),
      escapeCSV(c.jobFamily || ''),
      escapeCSV(c.hardSkills || ''),
      escapeCSV(c.softSkills || ''),
      escapeCSV(c.compensation || ''),
      escapeCSV(c.comments || ''),
      escapeCSV(c.references || ''),
      escapeCSV(recruitableStr),
      escapeCSV(filesStr),
      escapeCSV(tagsStr),
      escapeCSV(c.status || ''),
      escapeCSV(c.relationshipLevel || ''),
      createdAtStr,
      updatedAtStr,
    ]
  })

  // Combine headers and rows
  const csvLines = [headers, ...rows]

  // Convert to CSV string
  return csvLines.map((row) => row.join(',')).join('\n')
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSV(field: string): string {
  if (!field) return ''

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (
    field.includes(',') ||
    field.includes('"') ||
    field.includes('\n') ||
    field.includes('\r')
  ) {
    return `"${field.replace(/"/g, '""')}"`
  }

  return field
}

/**
 * Export candidates with advanced options
 */
export async function exportCandidatesAdvanced(options: {
  filters?: CandidateFilters
  fields?: string[] // Custom field selection
  format?: 'csv' | 'json'
}) {
  try {
    const { filters, format = 'csv' } = options

    // For now, only CSV is supported
    if (format === 'json') {
      return {
        success: false,
        error: 'Format JSON pas encore supporté',
      }
    }

    // Use standard CSV export
    return await exportCandidatesCSV(filters)
  } catch (error) {
    console.error('Error exporting candidates (advanced):', error)
    return {
      success: false,
      error: "Erreur lors de l'export",
    }
  }
}
