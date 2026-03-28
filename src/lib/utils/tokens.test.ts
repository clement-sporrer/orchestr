import { describe, it, expect } from 'vitest'
import { generateToken, getTokenExpiry, isTokenExpired, hashToken } from './tokens'

describe('generateToken', () => {
  it('returns a string', () => {
    expect(typeof generateToken()).toBe('string')
  })

  it('defaults to length 32', () => {
    expect(generateToken()).toHaveLength(32)
  })

  it('respects custom length', () => {
    expect(generateToken(16)).toHaveLength(16)
    expect(generateToken(64)).toHaveLength(64)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken()))
    expect(tokens.size).toBe(50)
  })

  it('generates URL-safe characters only', () => {
    const token = generateToken(100)
    expect(/^[A-Za-z0-9_-]+$/.test(token)).toBe(true)
  })
})

describe('getTokenExpiry', () => {
  it('candidate — expires in 7 days', () => {
    const before = Date.now()
    const expiry = getTokenExpiry('candidate')
    const after = Date.now()

    const expectedMs = 7 * 24 * 60 * 60 * 1000
    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + expectedMs)
    expect(expiry.getTime()).toBeLessThanOrEqual(after + expectedMs)
  })

  it('client — expires in 30 days', () => {
    const before = Date.now()
    const expiry = getTokenExpiry('client')
    const after = Date.now()

    const expectedMs = 30 * 24 * 60 * 60 * 1000
    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + expectedMs)
    expect(expiry.getTime()).toBeLessThanOrEqual(after + expectedMs)
  })

  it('client expiry is later than candidate expiry', () => {
    const candidate = getTokenExpiry('candidate')
    const client = getTokenExpiry('client')
    expect(client.getTime()).toBeGreaterThan(candidate.getTime())
  })
})

describe('hashToken', () => {
  it('returns a 64-character hex string', () => {
    const hash = hashToken('some-token')
    expect(hash).toHaveLength(64)
    expect(/^[a-f0-9]{64}$/.test(hash)).toBe(true)
  })

  it('is deterministic — same input yields same hash', () => {
    const token = 'abc123'
    expect(hashToken(token)).toBe(hashToken(token))
  })

  it('different inputs produce different hashes', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'))
  })

  it('does not equal the input', () => {
    const token = 'abc123'
    expect(hashToken(token)).not.toBe(token)
  })
})

describe('isTokenExpired', () => {
  it('returns false for null (no expiry set)', () => {
    expect(isTokenExpired(null)).toBe(false)
  })

  it('returns true for past date', () => {
    const past = new Date(Date.now() - 1000)
    expect(isTokenExpired(past)).toBe(true)
  })

  it('returns false for future date', () => {
    const future = new Date(Date.now() + 60_000)
    expect(isTokenExpired(future)).toBe(false)
  })

  it('returns true for date exactly in the past', () => {
    const expiredCandidate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    expect(isTokenExpired(expiredCandidate)).toBe(true)
  })
})
