import type { PipelineStage, RelationshipLevel } from '@/generated/prisma'

// Ordered list for RelationshipLevel comparison (lowest → highest)
export const RELATIONSHIP_ORDER: RelationshipLevel[] = [
  'SOURCED',
  'CONTACTED',
  'ENGAGED',
  'QUALIFIED',
  'SHORTLISTED',
  'PLACED',
]

// Maps a PipelineStage to the equivalent RelationshipLevel
export function getTargetRelationshipLevel(stage: PipelineStage): RelationshipLevel {
  const map: Record<PipelineStage, RelationshipLevel> = {
    SOURCED: 'SOURCED',
    CONTACTED: 'CONTACTED',
    RESPONSE: 'CONTACTED',
    INTERVIEW: 'ENGAGED',
    SHORTLIST: 'SHORTLISTED',
    OFFER: 'SHORTLISTED',
    PLACED: 'PLACED',
  }
  return map[stage]
}

// Returns true only if target is strictly higher than current
export function shouldUpgradeRelationship(
  current: RelationshipLevel,
  target: RelationshipLevel
): boolean {
  return RELATIONSHIP_ORDER.indexOf(target) > RELATIONSHIP_ORDER.indexOf(current)
}
