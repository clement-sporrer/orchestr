import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getCandidates, type CandidateWithCount } from '@/lib/actions/candidates'
import { getOrganizationSettings } from '@/lib/actions/organization-settings'
import { getPools } from '@/lib/actions/pools'
import { ExportButton } from '@/components/candidates/export-button'
import { CandidatesFiltersBar } from '@/components/candidates/candidates-filters-bar'
import { CandidatesListWithViews } from '@/components/candidates/candidates-list-views'
import { CandidatesPagination } from '@/components/candidates/candidates-pagination'
import type { CandidateFilters } from '@/lib/validations/candidate'
import type { CandidateStatus } from '@/generated/prisma'

interface CandidatesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    seniority?: string
    domain?: string
    sector?: string
    jobFamily?: string
    poolId?: string
    page?: string
  }>
}

function parseFilters(params: Awaited<CandidatesPageProps['searchParams']>) {
  const status = params.status && params.status !== 'all' ? (params.status as CandidateStatus) : undefined
  const seniority = params.seniority && params.seniority !== '_none' ? params.seniority : undefined
  const domain = params.domain && params.domain !== '_none' ? params.domain : undefined
  const sector = params.sector && params.sector !== '_none' ? params.sector : undefined
  const jobFamily = params.jobFamily && params.jobFamily !== '_none' ? params.jobFamily : undefined
  const poolId = params.poolId && params.poolId !== '_none' ? params.poolId : undefined
  const page = params.page ? Math.max(1, parseInt(params.page, 10) || 1) : 1
  const search = params.search?.trim() || undefined
  return { search, status, seniority, domain, sector, jobFamily, poolId, page }
}

function buildBaseParams(params: Awaited<CandidatesPageProps['searchParams']>) {
  const o: Record<string, string> = {}
  if (params.search) o.search = params.search
  if (params.status && params.status !== 'all') o.status = params.status
  if (params.seniority && params.seniority !== '_none') o.seniority = params.seniority
  if (params.domain && params.domain !== '_none') o.domain = params.domain
  if (params.sector && params.sector !== '_none') o.sector = params.sector
  if (params.jobFamily && params.jobFamily !== '_none') o.jobFamily = params.jobFamily
  if (params.poolId && params.poolId !== '_none') o.poolId = params.poolId
  return o
}

async function CandidatesList({ searchParams }: { searchParams: Awaited<CandidatesPageProps['searchParams']> }) {
  const filters = parseFilters(searchParams)
  let candidates: CandidateWithCount[] = []
  let pagination = { page: 1, limit: 50, total: 0, totalPages: 0 }

  try {
    const result = await getCandidates({
      search: filters.search,
      status: filters.status,
      seniority: filters.seniority as 'ONE_TO_FIVE' | 'FIVE_TO_TEN' | 'TEN_TO_TWENTY' | 'TWENTY_PLUS' | undefined,
      domain: filters.domain,
      sector: filters.sector,
      jobFamily: filters.jobFamily,
      poolId: filters.poolId,
      page: filters.page,
      limit: 50,
    })
    candidates = result.candidates
    pagination = result.pagination
  } catch {
    candidates = []
  }

  const baseParams = buildBaseParams(searchParams)
  const hasActiveFilters = !!(
    filters.search ||
    filters.status ||
    filters.seniority ||
    filters.domain ||
    filters.sector ||
    filters.jobFamily ||
    filters.poolId
  )

  return (
    <>
      <CandidatesListWithViews
        candidates={candidates}
        search={filters.search}
        status={filters.status}
        hasActiveFilters={hasActiveFilters}
      />
      <CandidatesPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        limit={pagination.limit}
        baseParams={baseParams}
      />
    </>
  )
}

function CandidatesListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-48 w-full rounded-lg" />
      ))}
    </div>
  )
}

export default async function CandidatesPage({ searchParams }: CandidatesPageProps) {
  const params = await searchParams
  const filters = parseFilters(params)

  let orgSettings: { domains: string[]; sectors: string[]; jobFamilies: string[] } | null = null
  let pools: { id: string; name: string }[] = []
  try {
    const [settingsRes, poolsList] = await Promise.all([
      getOrganizationSettings(),
      getPools(),
    ])
    if (settingsRes.success && settingsRes.data) {
      orgSettings = {
        domains: settingsRes.data.domains ?? [],
        sectors: settingsRes.data.sectors ?? [],
        jobFamilies: settingsRes.data.jobFamilies ?? [],
      }
    }
    pools = poolsList.map((p) => ({ id: p.id, name: p.name }))
  } catch {
    // use defaults
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidats</h1>
          <p className="text-muted-foreground">Gérez votre vivier de talents</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            filters={
              {
                search: filters.search,
                status: filters.status,
                seniority: filters.seniority,
                domain: filters.domain,
                sector: filters.sector,
                jobFamily: filters.jobFamily,
                poolId: filters.poolId,
              } as Partial<CandidateFilters>
            }
          />
          <Button asChild>
            <Link href="/candidates/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau candidat
            </Link>
          </Button>
        </div>
      </div>

      <CandidatesFiltersBar orgSettings={orgSettings} pools={pools} />

      <Suspense fallback={<CandidatesListSkeleton />}>
        <CandidatesList searchParams={params} />
      </Suspense>
    </div>
  )
}
