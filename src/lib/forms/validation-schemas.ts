import { z } from 'zod'

/**
 * Centralized Zod validation schemas
 * Reusable across forms for consistency
 */

// Common field schemas
export const emailSchema = z.string().email('Email invalide').optional().or(z.literal(''))

export const phoneSchema = z.string().optional()

export const urlSchema = z.string().url('URL invalide').optional().or(z.literal(''))

export const linkedinUrlSchema = z
  .string()
  .regex(/^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/, 'URL LinkedIn invalide')
  .optional()
  .or(z.literal(''))

// Candidate form schema
export const candidateFormSchema = z.object({
  firstName: z.string().min(1, 'Prénom obligatoire'),
  lastName: z.string().min(1, 'Nom obligatoire'),
  email: emailSchema,
  phone: phoneSchema,
  linkedin: linkedinUrlSchema,
  age: z.number().min(18).max(99).optional(),
  
  // Location
  country: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  
  // Professional
  seniority: z.enum(['ONE_TO_FIVE', 'FIVE_TO_TEN', 'TEN_TO_TWENTY', 'TWENTY_PLUS']).optional(),
  domain: z.string().optional(),
  sector: z.string().optional(),
  currentCompany: z.string().optional(),
  currentPosition: z.string().optional(),
  pastCompanies: z.string().optional(),
  jobFamily: z.string().optional(),
  
  // Skills
  hardSkills: z.string().optional(),
  softSkills: z.string().optional(),
  
  // Additional
  compensation: z.string().optional(),
  comments: z.string().optional(),
  references: z.string().optional(),
  recruitable: z.enum(['YES', 'NO', 'UNKNOWN']).optional(),
  
  // Tags
  tags: z.array(z.string()).optional(),
})

export type CandidateFormData = z.infer<typeof candidateFormSchema>

// Client form schema
export const clientFormSchema = z.object({
  name: z.string().min(1, 'Nom obligatoire'),
  companyName: z.string().optional(),
  category: z.string().optional(),
  sector: z.string().optional(),
  website: urlSchema,
  notes: z.string().optional(),
})

export type ClientFormData = z.infer<typeof clientFormSchema>

// Contact form schema
export const contactFormSchema = z.object({
  firstName: z.string().min(1, 'Prénom obligatoire'),
  lastName: z.string().min(1, 'Nom obligatoire'),
  title: z.string().optional(),
  email: z.string().email('Email invalide'),
  phone: phoneSchema,
  notes: z.string().optional(),
  isPrimary: z.boolean().optional(),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

// Mission form schema
export const missionFormSchema = z.object({
  clientId: z.string().min(1, 'Client obligatoire'),
  mainContactId: z.string().optional(),
  title: z.string().min(1, 'Titre obligatoire'),
  
  // Job details
  jobTitle: z.string().optional(),
  jobFamily: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  isRemote: z.boolean().optional(),
  contractType: z.enum(['CDI', 'CDD', 'FREELANCE', 'INTERNSHIP', 'APPRENTICESHIP', 'OTHER']).optional(),
  seniority: z.enum(['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE']).optional(),
  seniorityLabel: z.string().optional(),
  
  // Salary
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryNotes: z.string().optional(),
  salaryVisible: z.boolean().optional(),
  currency: z.string().optional(),
  
  // Content
  context: z.string().optional(),
  responsibilities: z.string().optional(),
  mustHave: z.string().optional(),
  niceToHave: z.string().optional(),
  redFlags: z.string().optional(),
  process: z.string().optional(),
  internalNotes: z.string().optional(),
  
  // Dates
  startDate: z.date().optional(),
  deadline: z.date().optional(),
  shortlistDeadline: z.date().optional(),
  
  // Other
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  scoreThreshold: z.number().min(0).max(100).optional(),
})

export type MissionFormData = z.infer<typeof missionFormSchema>
