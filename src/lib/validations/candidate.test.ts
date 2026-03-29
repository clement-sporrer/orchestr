import { describe, it, expect } from 'vitest'
import { transformCandidateInput } from './candidate'

describe('transformCandidateInput', () => {
  it('should uppercase lastName', () => {
    const result = transformCandidateInput({
      firstName: 'John',
      lastName: 'doe',
    } as any)
    expect(result.lastName).toBe('DOE')
  })

  it('should capitalize firstName', () => {
    const result = transformCandidateInput({
      firstName: 'john',
      lastName: 'DOE',
    } as any)
    expect(result.firstName).toBe('John')
  })

  it('should clean LinkedIn URL', () => {
    const result = transformCandidateInput({
      firstName: 'John',
      lastName: 'Doe',
      linkedin: 'https://linkedin.com/in/john-doe?tracking=123',
    } as any)
    expect(result.linkedin).toBe('https://linkedin.com/in/john-doe')
  })

  it('should handle null values', () => {
    const result = transformCandidateInput({
      firstName: 'John',
      lastName: 'Doe',
      email: null,
      phone: null,
    } as any)
    expect(result.email).toBe(null)
    expect(result.phone).toBe(null)
  })
})
