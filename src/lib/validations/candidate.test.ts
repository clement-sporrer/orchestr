import { describe, it, expect } from 'vitest'
import { parseSemicolonList, joinSemicolonList, transformCandidateInput } from './candidate'

describe('parseSemicolonList', () => {
  it('should parse semicolon-separated string into array', () => {
    const result = parseSemicolonList('skill1; skill2; skill3')
    expect(result).toEqual(['skill1', 'skill2', 'skill3'])
  })

  it('should trim whitespace from each item', () => {
    const result = parseSemicolonList('  skill1  ;  skill2  ;  skill3  ')
    expect(result).toEqual(['skill1', 'skill2', 'skill3'])
  })

  it('should filter out empty items', () => {
    const result = parseSemicolonList('skill1;;skill2;  ;skill3')
    expect(result).toEqual(['skill1', 'skill2', 'skill3'])
  })

  it('should return empty array for empty string', () => {
    const result = parseSemicolonList('')
    expect(result).toEqual([])
  })

  it('should return empty array for undefined', () => {
    const result = parseSemicolonList(undefined as any)
    expect(result).toEqual([])
  })
})

describe('joinSemicolonList', () => {
  it('should join array into semicolon-separated string', () => {
    const result = joinSemicolonList(['skill1', 'skill2', 'skill3'])
    expect(result).toBe('skill1; skill2; skill3')
  })

  it('should handle empty array', () => {
    const result = joinSemicolonList([])
    expect(result).toBe('')
  })

  it('should filter out empty strings', () => {
    const result = joinSemicolonList(['skill1', '', 'skill2'])
    expect(result).toBe('skill1; skill2')
  })
})

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
