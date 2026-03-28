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





