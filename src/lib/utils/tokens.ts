import { nanoid } from 'nanoid'
import { createHash } from 'crypto'

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
 * Hash a portal token with SHA-256 before storing in DB.
 * Returns a 64-character lowercase hex string.
 * The raw token is returned to the caller for URL construction — never stored.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(expiry: Date | null): boolean {
  if (!expiry) return false
  return new Date() > expiry
}





