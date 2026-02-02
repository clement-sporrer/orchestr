import type { Prisma } from '@/generated/prisma'
import {
  candidateFiltersSchema,
  type CandidateFilters,
} from '@/lib/validations/candidate'

/**
 * Build Prisma where clause for candidate list/export.
 * Shared by getCandidates (candidates.ts) and exportCandidatesCSV (export.ts).
 * Pure logic – no 'use server'.
 */
export function buildCandidateWhereClause(
  organizationId: string,
  filters?: Partial<CandidateFilters>
): Prisma.CandidateWhereInput {
  const validated = filters
    ? candidateFiltersSchema.partial().parse(filters)
    : {}
  const mode = 'insensitive' as const
  return {
    organizationId,
    status: validated.status ?? { not: 'DELETED' as const },
    ...(validated.search && {
      OR: [
        { firstName: { contains: validated.search, mode } },
        { lastName: { contains: validated.search, mode } },
        { email: { contains: validated.search, mode } },
        { currentCompany: { contains: validated.search, mode } },
        { currentPosition: { contains: validated.search, mode } },
      ],
    }),
    ...(validated.seniority && { seniority: validated.seniority }),
    ...(validated.domain && { domain: validated.domain }),
    ...(validated.sector && { sector: validated.sector }),
    ...(validated.jobFamily && { jobFamily: validated.jobFamily }),
    ...(validated.country && { country: validated.country }),
    ...(validated.city && { city: validated.city }),
    ...(validated.recruitable && { recruitable: validated.recruitable }),
    ...(validated.tags?.length ? { tags: { hasSome: validated.tags } } : {}),
    ...(validated.poolId
      ? { poolMemberships: { some: { poolId: validated.poolId } } }
      : {}),
  }
}
