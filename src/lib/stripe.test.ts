import { describe, it, expect } from 'vitest'
import { formatPrice, calculateAnnualSavings, getPriceId, PLANS } from './stripe'

describe('formatPrice', () => {
  it('should format cents to EUR string', () => {
    const result = formatPrice(4500)
    expect(result).toContain('45')
    expect(result).toContain('€')
  })

  it('should format zero cents', () => {
    const result = formatPrice(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })

  it('should format amount with non-zero cents', () => {
    const result = formatPrice(4567)
    expect(result).toContain('45')
    expect(result).toContain('€')
  })

  it('should format large amounts', () => {
    const result = formatPrice(89900)
    expect(result).toContain('899')
    expect(result).toContain('€')
  })
})

describe('calculateAnnualSavings', () => {
  it('should calculate CORE annual savings correctly', () => {
    const result = calculateAnnualSavings('CORE')
    // 4500 × 13 = 58500
    expect(result.fourWeeksTotal).toBe(58500)
    // 499 EUR in cents
    expect(result.annualTotal).toBe(49900)
    expect(result.savings).toBe(8600)
    expect(result.savingsPercent).toBe(15)
  })

  it('should calculate PRO annual savings correctly', () => {
    const result = calculateAnnualSavings('PRO')
    // 8200 × 13 = 106600
    expect(result.fourWeeksTotal).toBe(106600)
    // 899 EUR in cents
    expect(result.annualTotal).toBe(89900)
    expect(result.savings).toBe(16700)
    expect(result.savingsPercent).toBe(16)
  })

  it('should return positive savings for both plans', () => {
    const core = calculateAnnualSavings('CORE')
    const pro = calculateAnnualSavings('PRO')
    expect(core.savings).toBeGreaterThan(0)
    expect(pro.savings).toBeGreaterThan(0)
  })

  it('should return savingsPercent between 1 and 99', () => {
    const core = calculateAnnualSavings('CORE')
    const pro = calculateAnnualSavings('PRO')
    expect(core.savingsPercent).toBeGreaterThan(0)
    expect(core.savingsPercent).toBeLessThan(100)
    expect(pro.savingsPercent).toBeGreaterThan(0)
    expect(pro.savingsPercent).toBeLessThan(100)
  })
})

describe('getPriceId', () => {
  it('should return a string for CORE fourWeeks', () => {
    const result = getPriceId('CORE', 'fourWeeks')
    expect(typeof result).toBe('string')
  })

  it('should return a string for CORE annual', () => {
    const result = getPriceId('CORE', 'annual')
    expect(typeof result).toBe('string')
  })

  it('should return a string for PRO fourWeeks', () => {
    const result = getPriceId('PRO', 'fourWeeks')
    expect(typeof result).toBe('string')
  })

  it('should return a string for PRO annual', () => {
    const result = getPriceId('PRO', 'annual')
    expect(typeof result).toBe('string')
  })
})

describe('PLANS', () => {
  it('CORE should limit users to 3', () => {
    expect(PLANS.CORE.limits.maxUsers).toBe(3)
  })

  it('PRO should have unlimited users', () => {
    expect(PLANS.PRO.limits.maxUsers).toBe(Infinity)
  })

  it('WHITE_LABEL should have unlimited AI calls', () => {
    expect(PLANS.WHITE_LABEL.limits.aiCallsPerDay).toBe(Infinity)
  })

  it('CORE should not have customQuestionnaires or apiAccess', () => {
    expect(PLANS.CORE.limits.customQuestionnaires).toBe(false)
    expect(PLANS.CORE.limits.apiAccess).toBe(false)
  })

  it('PRO should have customQuestionnaires and apiAccess', () => {
    expect(PLANS.PRO.limits.customQuestionnaires).toBe(true)
    expect(PLANS.PRO.limits.apiAccess).toBe(true)
  })

  it('WHITE_LABEL should have customQuestionnaires and apiAccess', () => {
    expect(PLANS.WHITE_LABEL.limits.customQuestionnaires).toBe(true)
    expect(PLANS.WHITE_LABEL.limits.apiAccess).toBe(true)
  })
})
