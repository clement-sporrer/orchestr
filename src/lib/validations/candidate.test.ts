import { describe, it, expect } from 'vitest'
import { transformCandidateInput } from './candidate'
import type { CreateCandidateInput } from './candidate'

function createFixture(overrides: Partial<CreateCandidateInput>): CreateCandidateInput {
  return {
    firstName: 'John',
    lastName: 'Doe',
    pastCompanies: [],
    hardSkills: [],
    softSkills: [],
    files: [],
    tags: [],
    recruitable: 'UNKNOWN',
    status: 'ACTIVE',
    ...overrides,
  }
}

describe('transformCandidateInput', () => {
  it('should uppercase lastName', () => {
    const result = transformCandidateInput(createFixture({ lastName: 'doe' }))
    expect(result.lastName).toBe('DOE')
  })

  it('should capitalize firstName', () => {
    const result = transformCandidateInput(
      createFixture({ firstName: 'john', lastName: 'DOE' })
    )
    expect(result.firstName).toBe('John')
  })

  it('should clean LinkedIn URL', () => {
    const result = transformCandidateInput(
      createFixture({
        linkedin: 'https://linkedin.com/in/john-doe?tracking=123',
      })
    )
    expect(result.linkedin).toBe('https://linkedin.com/in/john-doe')
  })

  it('should handle undefined optional contact fields', () => {
    const result = transformCandidateInput(
      createFixture({
        email: undefined,
        phone: undefined,
      })
    )
    expect(result.email).toBeUndefined()
    expect(result.phone).toBeUndefined()
  })
})
