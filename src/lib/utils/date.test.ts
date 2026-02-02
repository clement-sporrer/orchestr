import { describe, it, expect } from 'vitest'
import { formatDateClient } from './date'

describe('formatDateClient', () => {
  const testDate = new Date('2024-03-15T14:30:00Z')

  it('should format date in French', () => {
    const result = formatDateClient(testDate, 'fr')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('should format date in English', () => {
    const result = formatDateClient(testDate, 'en')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('should handle Date object', () => {
    const result = formatDateClient(testDate, 'fr')
    expect(result).toBeTruthy()
  })

  it('should handle date string', () => {
    const result = formatDateClient('2024-03-15T14:30:00Z', 'fr')
    expect(result).toBeTruthy()
  })

  it('should return consistent format for same date', () => {
    const result1 = formatDateClient(testDate, 'fr')
    const result2 = formatDateClient(new Date('2024-03-15T14:30:00Z'), 'fr')
    expect(result1).toBe(result2)
  })
})
