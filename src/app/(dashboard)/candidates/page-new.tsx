'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/unified-view/search-bar'
import { FilterBar } from '@/components/unified-view/filter-bar'
import { QuickFilters } from '@/components/unified-view/quick-filters'
import { useCandidates } from '@/lib/query/hooks/use-candidates'
import { useFilters } from '@/lib/hooks/use-filters'
import { useSearch } from '@/lib/hooks/use-search'
import { applyFilters } from '@/lib/filters/filter-engine'
import { StaggerFadeIn } from '@/components/animations/stagger-fade-in'
import type { FilterField, QuickFilter } from '@/lib/filters/filter-types'

// Filter field definitions for candidates
const candidateFields: FilterField[] = [
  {
    key: 'status',
    label: 'Statut',
    type: 'select',
    options: [
      { value: 'ACTIVE', label: 'Actif' },
      { value: 'TO_RECONTACT', label: 'À recontacter' },
      { value: 'BLACKLIST', label: 'Blacklist' },
    ],
  },
  {
    key: 'relationshipLevel',
    label: 'Niveau relation',
    type: 'select',
    options: [
      { value: 'SOURCED', label: 'Sourcé' },
      { value: 'CONTACTED', label: 'Contacté' },
      { value: 'ENGAGED', label: 'Engagé' },
      { value: 'QUALIFIED', label: 'Qualifié' },
    ],
  },
  {
    key: 'currentCompany',
    label: 'Entreprise',
    type: 'text',
  },
  {
    key: 'currentPosition',
    label: 'Poste',
    type: 'text',
  },
]

// Quick filters
const quickFilters: QuickFilter[] = [
  {
    id: 'all',
    label: 'Tous',
    filters: { groups: [], globalCombinator: 'AND' },
  },
  {
    id: 'active',
    label: 'Actifs',
    filters: {
      groups: [{
        id: 'g1',
        combinator: 'AND',
        rules: [{ id: 'r1', field: 'status', operator: 'eq', value: 'ACTIVE' }],
      }],
      globalCombinator: 'AND',
    },
  },
  {
    id: 'to-recontact',
    label: 'À recontacter',
    filters: {
      groups: [{
        id: 'g1',
        combinator: 'AND',
        rules: [{ id: 'r1', field: 'status', operator: 'eq', value: 'TO_RECONTACT' }],
      }],
      globalCombinator: 'AND',
    },
  },
]

// Candidate card component
function CandidateCard({ candidate }: { candidate: { id: string; firstName: string; lastName: string; currentPosition?: string | null; currentCompany?: string | null; status: string; tags?: string[] | null } }) {
  return (
    <Link
      href={`/candidates/${candidate.id}`}
      className="block p-4 rounded-lg border bg-card hover:border-primary/50 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold group-hover:text-primary transition-colors">
            {candidate.firstName} {candidate.lastName}
          </h3>
          {candidate.currentPosition && (
            <p className="text-sm text-muted-foreground mt-1">
              {candidate.currentPosition}
            </p>
          )}
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
          {candidate.status}
        </span>
      </div>
      
      {candidate.currentCompany && (
        <p className="text-sm text-muted-foreground mb-2">
          {candidate.currentCompany}
        </p>
      )}
      
      {candidate.tags && candidate.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {candidate.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {candidate.tags.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
              +{candidate.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

export default function CandidatesPageNew() {
  const [activeQuickFilter, setActiveQuickFilter] = useState('all')
  const { query, setQuery } = useSearch()
  const { config, setConfig } = useFilters()
  
  // Fetch candidates (React Query)
  const { data, isLoading } = useCandidates({
    search: query,
    page: 1,
    limit: 100,
  })

  // Client-side filtering
  const candidates = data?.candidates || []
  const filteredCandidates = applyFilters(candidates, config)
  
  // Search filter
  const searchedCandidates = query
    ? filteredCandidates.filter(c =>
        `${c.firstName} ${c.lastName} ${c.currentCompany} ${c.currentPosition}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
    : filteredCandidates

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidats</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {searchedCandidates.length} candidat{searchedCandidates.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/import">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/candidates/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and quick filters */}
      <div className="space-y-3">
        <SearchBar
          placeholder="Rechercher un candidat..."
          defaultValue={query}
          onSearch={setQuery}
          className="max-w-md"
        />
        
        <QuickFilters
          filters={quickFilters}
          activeFilterId={activeQuickFilter}
          onFilterClick={(filter) => {
            setActiveQuickFilter(filter.id)
            setConfig(filter.filters)
          }}
        />
      </div>

      {/* Active filters */}
      <FilterBar
        config={config}
        fields={candidateFields}
        onConfigChange={setConfig}
        resultCount={searchedCandidates.length}
      />

      {/* Candidates grid with virtualization */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg border bg-card animate-pulse" />
          ))}
        </div>
      ) : searchedCandidates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucun candidat trouvé</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StaggerFadeIn>
            {searchedCandidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </StaggerFadeIn>
        </div>
      )}
    </div>
  )
}
