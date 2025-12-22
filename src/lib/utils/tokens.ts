import { nanoid } from 'nanoid'

/**
 * Generate a secure random token for portal access
 * Tokens are URL-safe and non-guessable
 */
export function generateToken(length: number = 32): string {
  return nanoid(length)
}

/**
 * Calculate token expiry date
 * Default: 7 days for candidate portal, 30 days for client shortlist
 */
export function getTokenExpiry(type: 'candidate' | 'client'): Date {
  const now = new Date()
  const days = type === 'candidate' ? 7 : 30
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(expiry: Date | null): boolean {
  if (!expiry) return false
  return new Date() > expiry
}



