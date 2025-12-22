import type { Visibility, AudienceView, JobPostView, Mission } from '@/types'

/**
 * Check if content should be visible for a given audience
 */
export function isVisibleFor(visibility: Visibility, audience: AudienceView): boolean {
  switch (visibility) {
    case 'INTERNAL':
      return audience === 'internal'
    case 'INTERNAL_CLIENT':
      return audience === 'internal' || audience === 'client'
    case 'INTERNAL_CANDIDATE':
      return audience === 'internal' || audience === 'candidate'
    case 'ALL':
      return true
    default:
      return false
  }
}

/**
 * Generate a job post view for a specific audience
 */
export function generateJobPostView(mission: Mission, audience: AudienceView): JobPostView {
  const view: JobPostView = {
    title: mission.title,
    location: mission.location ?? undefined,
    contractType: mission.contractType ?? undefined,
    seniority: mission.seniority ?? undefined,
    calendlyLink: mission.calendlyLink ?? undefined,
  }

  // Salary - only show if visible for audience and marked as visible
  if (mission.salaryVisible && (audience === 'internal' || mission.salaryMin || mission.salaryMax)) {
    view.salary = {
      min: mission.salaryMin ?? undefined,
      max: mission.salaryMax ?? undefined,
      currency: mission.currency,
    }
  }

  // Context
  if (isVisibleFor(mission.contextVisibility, audience) && mission.context) {
    view.context = mission.context
  }

  // Responsibilities
  if (isVisibleFor(mission.responsibilitiesVisibility, audience) && mission.responsibilities) {
    view.responsibilities = mission.responsibilities
  }

  // Must have
  if (isVisibleFor(mission.mustHaveVisibility, audience) && mission.mustHave) {
    view.mustHave = mission.mustHave
  }

  // Nice to have
  if (isVisibleFor(mission.niceToHaveVisibility, audience) && mission.niceToHave) {
    view.niceToHave = mission.niceToHave
  }

  // Process
  if (isVisibleFor(mission.processVisibility, audience) && mission.process) {
    view.process = mission.process
  }

  // Red flags - internal only
  if (audience === 'internal' && mission.redFlags) {
    view.redFlags = mission.redFlags
  }

  return view
}

/**
 * Get visibility label for display
 */
export function getVisibilityLabel(visibility: Visibility): string {
  switch (visibility) {
    case 'INTERNAL':
      return 'Interne uniquement'
    case 'INTERNAL_CLIENT':
      return 'Interne + Client'
    case 'INTERNAL_CANDIDATE':
      return 'Interne + Candidat'
    case 'ALL':
      return 'Tout le monde'
    default:
      return 'Inconnu'
  }
}



