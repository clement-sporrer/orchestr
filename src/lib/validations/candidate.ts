import { z } from 'zod'

// ============================================
// ENUMS
// ============================================

export const CandidateSeniorityEnum = z.enum([
  'ONE_TO_FIVE',
  'FIVE_TO_TEN',
  'TEN_TO_TWENTY',
  'TWENTY_PLUS',
])

export const RecruitableStatusEnum = z.enum(['YES', 'NO', 'UNKNOWN'])

export const LanguageLevelEnum = z.enum([
  'BEGINNER',
  'INTERMEDIATE',
  'FLUENT',
  'NATIVE',
])

export const CandidateStatusEnum = z.enum([
  'ACTIVE',
  'TO_RECONTACT',
  'BLACKLIST',
  'DELETED',
])

// ============================================
// COMPLEX TYPES
// ============================================

// Language entry: {language: string, level: LanguageLevel}
export const languageSchema = z.object({
  language: z.string().min(1, 'Langue requise'),
  level: LanguageLevelEnum,
})

export type LanguageEntry = z.infer<typeof languageSchema>

// Solicitation History entry
export const solicitationHistoryEntrySchema = z.object({
  date: z.string(), // ISO date string
  action: z.string(), // "Applied", "Contacted", "Interviewed", etc.
  missionId: z.string().optional(),
  missionName: z.string().optional(),
})

export type SolicitationHistoryEntry = z.infer<
  typeof solicitationHistoryEntrySchema
>

// ============================================
// VALIDATION HELPERS
// ============================================

// URL validation for LinkedIn
const linkedinUrlRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/

// Email validation (Zod built-in)
// Phone validation (flexible - just non-empty string)
// Age validation (18-99)

// ============================================
// CANDIDATE SCHEMAS
// ============================================

// Base candidate schema (common fields)
const baseCandidateSchema = z.object({
  // Identity (required)
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),

  // Contact (optional)
  email: z
    .string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  linkedin: z
    .string()
    .regex(linkedinUrlRegex, 'URL LinkedIn invalide')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  age: z
    .number()
    .int()
    .min(18, 'Âge minimum: 18 ans')
    .max(99, 'Âge maximum: 99 ans')
    .optional(),

  // Localisation (optional)
  country: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  region: z.string().optional().or(z.literal('')),

  // Languages (optional, JSON array)
  languages: z.array(languageSchema).optional(),

  // Experience (optional)
  seniority: CandidateSeniorityEnum.optional(),
  domain: z.string().optional().or(z.literal('')),
  sector: z.string().optional().or(z.literal('')),
  currentCompany: z.string().optional().or(z.literal('')),
  currentPosition: z.string().optional().or(z.literal('')),
  pastCompanies: z.string().optional().or(z.literal('')), // semicolon-separated
  jobFamily: z.string().optional().or(z.literal('')),

  // Skills (optional, semicolon-separated)
  hardSkills: z.string().optional().or(z.literal('')),
  softSkills: z.string().optional().or(z.literal('')),

  // Additional info (optional)
  compensation: z.string().optional().or(z.literal('')),
  comments: z.string().optional().or(z.literal('')),
  references: z.string().optional().or(z.literal('')),
  recruitable: RecruitableStatusEnum.default('UNKNOWN'),

  // Files (optional, array of storage paths)
  files: z.array(z.string()).default([]),

  // Legacy fields (backward compatibility)
  profileUrl: z.string().url().optional().or(z.literal('')),
  cvUrl: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).default([]),
  status: CandidateStatusEnum.default('ACTIVE'),
})

// Schema for CREATING a candidate
export const createCandidateSchema = baseCandidateSchema.extend({
  // Only required fields are firstName and lastName
  // All others are optional with defaults
})

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>

// Schema for UPDATING a candidate
export const updateCandidateSchema = baseCandidateSchema.partial().extend({
  id: z.string().cuid(),
})

export type UpdateCandidateInput = z.infer<typeof updateCandidateSchema>

// ============================================
// FILTER SCHEMAS
// ============================================

export const candidateFiltersSchema = z.object({
  search: z.string().optional(),
  status: CandidateStatusEnum.optional(),
  seniority: CandidateSeniorityEnum.optional(),
  domain: z.string().optional(),
  sector: z.string().optional(),
  jobFamily: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  recruitable: RecruitableStatusEnum.optional(),
  tags: z.array(z.string()).optional(),
  poolId: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
})

export type CandidateFilters = z.infer<typeof candidateFiltersSchema>

// ============================================
// ORGANIZATION SETTINGS SCHEMAS
// ============================================

export const organizationSettingsSchema = z.object({
  domains: z.array(z.string()).default([]),
  sectors: z.array(z.string()).default([]),
  jobFamilies: z.array(z.string()).default([]),
  // PRD v2.0
  clientCategories: z.array(z.string()).default([]),
  contractTypes: z.array(z.string()).default([]),
  seniorities: z.array(z.string()).default([]),
})

export type OrganizationSettingsInput = z.infer<
  typeof organizationSettingsSchema
>

// Update settings schema (partial)
export const updateOrganizationSettingsSchema =
  organizationSettingsSchema.partial()

export type UpdateOrganizationSettingsInput = z.infer<
  typeof updateOrganizationSettingsSchema
>

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse semicolon-separated string to array
 */
export function parseSemicolonList(input: string | null | undefined): string[] {
  if (!input || input.trim() === '') return []
  return input
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

/**
 * Join array to semicolon-separated string
 */
export function joinSemicolonList(items: string[]): string {
  return items.filter((item) => item.trim().length > 0).join(';')
}

/**
 * Auto-format lastName to UPPERCASE
 */
export function formatLastName(lastName: string): string {
  return lastName.trim().toUpperCase()
}

/**
 * Auto-format firstName to Capitalized
 */
export function formatFirstName(firstName: string): string {
  return firstName
    .trim()
    .split(' ')
    .map((word) => {
      if (word.length === 0) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Auto-format company name to UPPERCASE
 */
export function formatCompanyName(company: string | null | undefined): string {
  if (!company || company.trim() === '') return ''
  return company.trim().toUpperCase()
}

/**
 * Auto-format position title to UPPERCASE
 */
export function formatPositionTitle(position: string | null | undefined): string {
  if (!position || position.trim() === '') return ''
  return position.trim().toUpperCase()
}

/**
 * Validate and transform candidate data before save
 */
export function transformCandidateInput(
  input: CreateCandidateInput | UpdateCandidateInput
): typeof input {
  const transformed = { ...input }

  // Auto-format names
  if (transformed.firstName) {
    transformed.firstName = formatFirstName(transformed.firstName)
  }
  if (transformed.lastName) {
    transformed.lastName = formatLastName(transformed.lastName)
  }

  // Auto-format company and position
  if (transformed.currentCompany) {
    transformed.currentCompany = formatCompanyName(transformed.currentCompany)
  }
  if (transformed.currentPosition) {
    transformed.currentPosition = formatPositionTitle(transformed.currentPosition)
  }

  // Convert empty strings to undefined for optional fields
  Object.keys(transformed).forEach((key) => {
    if (transformed[key as keyof typeof transformed] === '') {
      // @ts-ignore
      transformed[key as keyof typeof transformed] = undefined
    }
  })

  return transformed
}

// ============================================
// SENIORITY LABELS (for UI)
// ============================================

export const SENIORITY_LABELS: Record<
  z.infer<typeof CandidateSeniorityEnum>,
  string
> = {
  ONE_TO_FIVE: '1-5 ans',
  FIVE_TO_TEN: '5-10 ans',
  TEN_TO_TWENTY: '10-20 ans',
  TWENTY_PLUS: '20+ ans',
}

export const LANGUAGE_LEVEL_LABELS: Record<
  z.infer<typeof LanguageLevelEnum>,
  string
> = {
  BEGINNER: 'Débutant',
  INTERMEDIATE: 'Intermédiaire',
  FLUENT: 'Courant',
  NATIVE: 'Natif',
}

export const RECRUITABLE_STATUS_LABELS: Record<
  z.infer<typeof RecruitableStatusEnum>,
  string
> = {
  YES: 'Oui',
  NO: 'Non',
  UNKNOWN: 'Non renseigné',
}
