import { describe, it, expect } from 'vitest'
import { isVisibleFor, getVisibilityLabel, generateJobPostView } from './visibility'
import type { AudienceView } from '@/types'

// Minimal mission shape matching the fields used in visibility.ts
const baseMission = {
  title: 'Senior Dev',
  location: 'Paris',
  contractType: 'CDI',
  seniority: 'Senior',
  calendlyLink: null,
  salaryVisible: true,
  salaryMin: 60000,
  salaryMax: 80000,
  currency: 'EUR',
  contextVisibility: 'ALL' as const,
  context: 'Great opportunity',
  responsibilitiesVisibility: 'ALL' as const,
  responsibilities: 'Build features',
  mustHaveVisibility: 'ALL' as const,
  mustHave: 'TypeScript',
  niceToHaveVisibility: 'INTERNAL' as const,
  niceToHave: 'GraphQL',
  processVisibility: 'INTERNAL_CLIENT' as const,
  process: '3 rounds',
  redFlags: 'High turnover',
}

describe('isVisibleFor', () => {
  describe('INTERNAL', () => {
    it('is visible for internal', () => expect(isVisibleFor('INTERNAL', 'internal')).toBe(true))
    it('is not visible for client', () => expect(isVisibleFor('INTERNAL', 'client')).toBe(false))
    it('is not visible for candidate', () => expect(isVisibleFor('INTERNAL', 'candidate')).toBe(false))
  })

  describe('INTERNAL_CLIENT', () => {
    it('is visible for internal', () => expect(isVisibleFor('INTERNAL_CLIENT', 'internal')).toBe(true))
    it('is visible for client', () => expect(isVisibleFor('INTERNAL_CLIENT', 'client')).toBe(true))
    it('is not visible for candidate', () => expect(isVisibleFor('INTERNAL_CLIENT', 'candidate')).toBe(false))
  })

  describe('INTERNAL_CANDIDATE', () => {
    it('is visible for internal', () => expect(isVisibleFor('INTERNAL_CANDIDATE', 'internal')).toBe(true))
    it('is visible for candidate', () => expect(isVisibleFor('INTERNAL_CANDIDATE', 'candidate')).toBe(true))
    it('is not visible for client', () => expect(isVisibleFor('INTERNAL_CANDIDATE', 'client')).toBe(false))
  })

  describe('ALL', () => {
    const audiences: AudienceView[] = ['internal', 'client', 'candidate']
    audiences.forEach(audience => {
      it(`is visible for ${audience}`, () => expect(isVisibleFor('ALL', audience)).toBe(true))
    })
  })
})

describe('getVisibilityLabel', () => {
  it('INTERNAL', () => expect(getVisibilityLabel('INTERNAL')).toBe('Interne uniquement'))
  it('INTERNAL_CLIENT', () => expect(getVisibilityLabel('INTERNAL_CLIENT')).toBe('Interne + Client'))
  it('INTERNAL_CANDIDATE', () => expect(getVisibilityLabel('INTERNAL_CANDIDATE')).toBe('Interne + Candidat'))
  it('ALL', () => expect(getVisibilityLabel('ALL')).toBe('Tout le monde'))
})

describe('generateJobPostView', () => {
  it('always includes title', () => {
    const view = generateJobPostView(baseMission as never, 'candidate')
    expect(view.title).toBe('Senior Dev')
  })

  it('includes ALL-visibility fields for all audiences', () => {
    for (const audience of ['internal', 'client', 'candidate'] as AudienceView[]) {
      const view = generateJobPostView(baseMission as never, audience)
      expect(view.context).toBe('Great opportunity')
      expect(view.responsibilities).toBe('Build features')
      expect(view.mustHave).toBe('TypeScript')
    }
  })

  it('INTERNAL fields only visible to internal', () => {
    const internal = generateJobPostView(baseMission as never, 'internal')
    const client = generateJobPostView(baseMission as never, 'client')
    const candidate = generateJobPostView(baseMission as never, 'candidate')

    expect(internal.niceToHave).toBe('GraphQL')
    expect(client.niceToHave).toBeUndefined()
    expect(candidate.niceToHave).toBeUndefined()
  })

  it('INTERNAL_CLIENT fields visible to internal and client only', () => {
    const internal = generateJobPostView(baseMission as never, 'internal')
    const client = generateJobPostView(baseMission as never, 'client')
    const candidate = generateJobPostView(baseMission as never, 'candidate')

    expect(internal.process).toBe('3 rounds')
    expect(client.process).toBe('3 rounds')
    expect(candidate.process).toBeUndefined()
  })

  it('redFlags only visible to internal', () => {
    const internal = generateJobPostView(baseMission as never, 'internal')
    const client = generateJobPostView(baseMission as never, 'client')
    const candidate = generateJobPostView(baseMission as never, 'candidate')

    expect(internal.redFlags).toBe('High turnover')
    expect(client.redFlags).toBeUndefined()
    expect(candidate.redFlags).toBeUndefined()
  })

  it('salary visible when salaryVisible=true and values exist', () => {
    const view = generateJobPostView(baseMission as never, 'candidate')
    expect(view.salary).toEqual({ min: 60000, max: 80000, currency: 'EUR' })
  })

  it('salary hidden when salaryVisible=false', () => {
    const mission = { ...baseMission, salaryVisible: false }
    const view = generateJobPostView(mission as never, 'candidate')
    expect(view.salary).toBeUndefined()
  })

  it('excludes fields with null content even if visibility allows it', () => {
    const mission = { ...baseMission, context: null }
    const view = generateJobPostView(mission as never, 'internal')
    expect(view.context).toBeUndefined()
  })

  it('location and contractType are undefined when null in mission', () => {
    const mission = { ...baseMission, location: null, contractType: null }
    const view = generateJobPostView(mission as never, 'internal')
    expect(view.location).toBeUndefined()
    expect(view.contractType).toBeUndefined()
  })
})
