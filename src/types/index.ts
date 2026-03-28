// Re-export Prisma types for convenience
export * from '@/generated/prisma'

// Additional application types

export type AudienceView = 'internal' | 'client' | 'candidate'

export interface JobPostView {
  title: string
  location?: string
  contractType?: string
  seniority?: string
  salary?: {
    min?: number
    max?: number
    currency: string
  } | null
  context?: string
  responsibilities?: string
  mustHave?: string
  niceToHave?: string
  process?: string
  redFlags?: string  // Only for internal view
  calendlyLink?: string
}

export interface CsvImportPreview {
  total: number
  new: number
  updated: number
  merged: number
  ignored: number
  errors: Array<{
    row: number
    error: string
  }>
  rows: CsvPreviewRow[]
}

export interface CsvPreviewRow {
  rowNumber: number
  status: 'new' | 'update' | 'merge' | 'ignore' | 'error'
  data: Record<string, string>
  existingCandidate?: {
    id: string
    name: string
  }
  mergeWith?: {
    id: string
    name: string
    matchField: 'email' | 'phone' | 'linkedin'
  }
  error?: string
}

export interface CsvColumnMapping {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  location?: string
  currentPosition?: string
  currentCompany?: string
  linkedin?: string
  tags?: string
}

export interface ScoringResult {
  score: number
  reasons: string[]
  recommendation: 'add' | 'archive' | 'review'
}

export interface GeneratedMessage {
  subject?: string
  content: string
  variables: Record<string, string>
}

export interface CalendlyEvent {
  uri: string
  name: string
  status: 'active' | 'canceled'
  start_time: string
  end_time: string
  event_type: string
  invitees_counter: {
    total: number
    active: number
    limit: number
  }
  cancel_url?: string
  reschedule_url?: string
}

export interface CalendlyWebhookPayload {
  event: 'invitee.created' | 'invitee.canceled'
  payload: {
    event: CalendlyEvent
    invitee: {
      uri: string
      email: string
      name: string
      status: string
      questions_and_answers: Array<{
        question: string
        answer: string
      }>
      tracking: {
        utm_source?: string
        utm_medium?: string
        utm_campaign?: string
      }
    }
  }
}

// Dashboard types
export interface DashboardStats {
  activeMissions: number
  candidatesThisMonth: number
  pendingTasks: number
  shortlistsSent: number
}

export interface RecentActivity {
  id: string
  type: string
  description: string
  timestamp: Date
  link?: string
}

// Export/Print types
export interface ShortlistExportData {
  mission: {
    title: string
    client: string
    location?: string
  }
  candidates: Array<{
    name: string
    currentPosition?: string
    currentCompany?: string
    location?: string
    summary?: string
    tags: string[]
    score?: number
    cvUrl?: string
  }>
  generatedAt: Date
}





