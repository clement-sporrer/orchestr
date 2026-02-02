import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCandidates, type CandidateWithCount } from '@/lib/actions/candidates'
import { ExportButton } from '@/components/candidates/export-button'
import { CandidatesListWithViews } from '@/components/candidates/candidates-list-views'
import type { CandidateStatus } from '@/generated/prisma'

interface CandidatesPageProps {
  searchParams: Promise<{ 
    search?: string
    status?: CandidateStatus
  }>
}

async function CandidatesList({ search, status }: { search?: string; status?: CandidateStatus }) {
  let candidates: CandidateWithCount[] = []
  
  try {
    const result = await getCandidates({ search, status, page: 1, limit: 50 })
    candidates = result.candidates
  } catch {
    candidates = []
  }

  return (
    <CandidatesListWithViews
      candidates={candidates}
      search={search}
      status={status}
    />
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
  const { search, status } = await searchParams

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidats</h1>
          <p className="text-muted-foreground">
            Gérez votre vivier de talents
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton filters={{ status }} />
          <Button variant="outline" asChild>
            <Link href="/import">
              <Upload className="mr-2 h-4 w-4" />
              Importer CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/candidates/new">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau candidat
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <form className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="search"
            placeholder="Rechercher un candidat..."
            defaultValue={search}
            className="pl-10"
          />
        </form>
        
        <form>
          <input type="hidden" name="search" value={search || ''} />
          <Select name="status" defaultValue={status || 'all'}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="ACTIVE">Actif</SelectItem>
              <SelectItem value="TO_RECONTACT">À recontacter</SelectItem>
              <SelectItem value="BLACKLIST">Blacklist</SelectItem>
            </SelectContent>
          </Select>
        </form>
      </div>

      {/* Candidates List */}
      <Suspense fallback={<CandidatesListSkeleton />}>
        <CandidatesList search={search} status={status} />
      </Suspense>
    </div>
  )
}



