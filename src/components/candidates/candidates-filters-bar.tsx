'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Filter, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SENIORITY_LABELS } from '@/lib/validations/candidate'

const statusLabels: Record<string, string> = {
  all: 'Tous les statuts',
  ACTIVE: 'Actif',
  TO_RECONTACT: 'À recontacter',
  BLACKLIST: 'Blacklist',
}

interface OrgSettings {
  domains: string[]
  sectors: string[]
  jobFamilies: string[]
}

interface Pool {
  id: string
  name: string
}

interface CandidatesFiltersBarProps {
  orgSettings: OrgSettings | null
  pools: Pool[]
}

function getInitialFromParams(searchParams: URLSearchParams) {
  return {
    search: searchParams.get('search') ?? '',
    status: searchParams.get('status') ?? 'all',
    seniority: searchParams.get('seniority') ?? '',
    domain: searchParams.get('domain') ?? '',
    sector: searchParams.get('sector') ?? '',
    jobFamily: searchParams.get('jobFamily') ?? '',
    poolId: searchParams.get('poolId') ?? '',
  }
}

export function CandidatesFiltersBar({ orgSettings, pools }: CandidatesFiltersBarProps) {
  const searchParams = useSearchParams()
  const initial = getInitialFromParams(searchParams)
  const [search, setSearch] = useState(initial.search)
  const [status, setStatus] = useState(initial.status)
  const [seniority, setSeniority] = useState(initial.seniority)
  const [domain, setDomain] = useState(initial.domain)
  const [sector, setSector] = useState(initial.sector)
  const [jobFamily, setJobFamily] = useState(initial.jobFamily)
  const [poolId, setPoolId] = useState(initial.poolId)
  const [advancedOpen, setAdvancedOpen] = useState(
    !!(initial.seniority || initial.domain || initial.sector || initial.jobFamily || initial.poolId)
  )

  const buildUrl = useCallback(
    (overrides: Record<string, string | null> = {}) => {
      const params = new URLSearchParams()
      const s = overrides.search !== undefined ? overrides.search : search
      if (s) params.set('search', s)
      const st = overrides.status !== undefined ? overrides.status : status
      if (st && st !== 'all') params.set('status', st)
      const sen = overrides.seniority !== undefined ? overrides.seniority : seniority
      if (sen) params.set('seniority', sen)
      const d = overrides.domain !== undefined ? overrides.domain : domain
      if (d) params.set('domain', d)
      const sec = overrides.sector !== undefined ? overrides.sector : sector
      if (sec) params.set('sector', sec)
      const jf = overrides.jobFamily !== undefined ? overrides.jobFamily : jobFamily
      if (jf) params.set('jobFamily', jf)
      const p = overrides.poolId !== undefined ? overrides.poolId : poolId
      if (p) params.set('poolId', p)
      params.set('page', '1')
      const q = params.toString()
      return q ? `/candidates?${q}` : '/candidates'
    },
    [search, status, seniority, domain, sector, jobFamily, poolId]
  )

  const activeFilters: { key: string; label: string }[] = []
  if (status && status !== 'all') activeFilters.push({ key: 'status', label: `Statut : ${statusLabels[status] ?? status}` })
  if (seniority) activeFilters.push({ key: 'seniority', label: `Séniorité : ${SENIORITY_LABELS[seniority as keyof typeof SENIORITY_LABELS] ?? seniority}` })
  if (domain) activeFilters.push({ key: 'domain', label: `Domaine : ${domain}` })
  if (sector) activeFilters.push({ key: 'sector', label: `Secteur : ${sector}` })
  if (jobFamily) activeFilters.push({ key: 'jobFamily', label: `Famille : ${jobFamily}` })
  if (poolId) {
    const pool = pools.find((p) => p.id === poolId)
    activeFilters.push({ key: 'poolId', label: `Pool : ${pool?.name ?? poolId}` })
  }

  const removeFilterLink = (key: string) => buildUrl({ [key]: null })

  return (
    <div className="space-y-3">
      <form method="get" action="/candidates" className="flex flex-col gap-4">
        <input type="hidden" name="page" value="1" />
        <input type="hidden" name="search" value={search} />
        <input type="hidden" name="status" value={status === 'all' ? '' : status} />
        <input type="hidden" name="seniority" value={seniority} />
        <input type="hidden" name="domain" value={domain} />
        <input type="hidden" name="sector" value={sector} />
        <input type="hidden" name="jobFamily" value={jobFamily} />
        <input type="hidden" name="poolId" value={poolId} />
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Rechercher un candidat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
              aria-label="Rechercher"
            />
          </div>
          <Select value={status || 'all'} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]" aria-label="Statut">
              <Filter className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{statusLabels.all}</SelectItem>
              <SelectItem value="ACTIVE">{statusLabels.ACTIVE}</SelectItem>
              <SelectItem value="TO_RECONTACT">{statusLabels.TO_RECONTACT}</SelectItem>
              <SelectItem value="BLACKLIST">{statusLabels.BLACKLIST}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setAdvancedOpen((o) => !o)}
              aria-expanded={advancedOpen}
            >
              Filtres avancés
              {advancedOpen ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : (
                <ChevronDown className="ml-2 h-4 w-4" />
              )}
            </Button>
            {advancedOpen && (
              <div className="flex flex-wrap items-center gap-3 pt-0 border-t-0 mt-0 pl-0 w-full md:w-auto md:border-t md:mt-3 md:pt-3 md:pl-3">
                <Select value={seniority || '_none'} onValueChange={(v) => setSeniority(v === '_none' ? '' : v)}>
                  <SelectTrigger className="w-[160px]" aria-label="Séniorité">
                    <SelectValue placeholder="Séniorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Toutes</SelectItem>
                    {Object.entries(SENIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={domain || '_none'} onValueChange={(v) => setDomain(v === '_none' ? '' : v)}>
                  <SelectTrigger className="w-[160px]" aria-label="Domaine">
                    <SelectValue placeholder="Domaine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Tous</SelectItem>
                    {(orgSettings?.domains ?? []).map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sector || '_none'} onValueChange={(v) => setSector(v === '_none' ? '' : v)}>
                  <SelectTrigger className="w-[160px]" aria-label="Secteur">
                    <SelectValue placeholder="Secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Tous</SelectItem>
                    {(orgSettings?.sectors ?? []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={jobFamily || '_none'} onValueChange={(v) => setJobFamily(v === '_none' ? '' : v)}>
                  <SelectTrigger className="w-[180px]" aria-label="Famille de métier">
                    <SelectValue placeholder="Famille de métier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Toutes</SelectItem>
                    {(orgSettings?.jobFamilies ?? []).map((j) => (
                      <SelectItem key={j} value={j}>
                        {j}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={poolId || '_none'} onValueChange={(v) => setPoolId(v === '_none' ? '' : v)}>
                  <SelectTrigger className="w-[160px]" aria-label="Pool">
                    <SelectValue placeholder="Pool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Tous</SelectItem>
                    {pools.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button type="submit">Appliquer</Button>
        </div>
      </form>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtres actifs :</span>
          {activeFilters.map(({ key, label }) => (
            <Badge
              key={key}
              variant="secondary"
              className="gap-1 pr-1 pl-2 font-normal"
              asChild
            >
              <Link href={removeFilterLink(key)} className="hover:bg-secondary/80">
                {label}
                <span className="rounded-full p-0.5 hover:bg-muted" aria-hidden>
                  <X className="h-3 w-3" />
                </span>
              </Link>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
