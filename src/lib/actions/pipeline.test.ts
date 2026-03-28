import { describe, it, expect } from 'vitest'
import { getTargetRelationshipLevel, shouldUpgradeRelationship } from './pipeline'

describe('getTargetRelationshipLevel', () => {
  it('maps SOURCED → SOURCED', () => expect(getTargetRelationshipLevel('SOURCED')).toBe('SOURCED'))
  it('maps CONTACTED → CONTACTED', () => expect(getTargetRelationshipLevel('CONTACTED')).toBe('CONTACTED'))
  it('maps RESPONSE → CONTACTED', () => expect(getTargetRelationshipLevel('RESPONSE')).toBe('CONTACTED'))
  it('maps INTERVIEW → ENGAGED', () => expect(getTargetRelationshipLevel('INTERVIEW')).toBe('ENGAGED'))
  it('maps SHORTLIST → SHORTLISTED', () => expect(getTargetRelationshipLevel('SHORTLIST')).toBe('SHORTLISTED'))
  it('maps OFFER → SHORTLISTED', () => expect(getTargetRelationshipLevel('OFFER')).toBe('SHORTLISTED'))
  it('maps PLACED → PLACED', () => expect(getTargetRelationshipLevel('PLACED')).toBe('PLACED'))
})

describe('shouldUpgradeRelationship', () => {
  it('upgrades SOURCED → ENGAGED', () => expect(shouldUpgradeRelationship('SOURCED', 'ENGAGED')).toBe(true))
  it('upgrades CONTACTED → SHORTLISTED', () => expect(shouldUpgradeRelationship('CONTACTED', 'SHORTLISTED')).toBe(true))
  it('does not downgrade PLACED → SOURCED', () => expect(shouldUpgradeRelationship('PLACED', 'SOURCED')).toBe(false))
  it('does not change when same level', () => expect(shouldUpgradeRelationship('ENGAGED', 'ENGAGED')).toBe(false))
  it('does not downgrade SHORTLISTED → CONTACTED', () => expect(shouldUpgradeRelationship('SHORTLISTED', 'CONTACTED')).toBe(false))
})
