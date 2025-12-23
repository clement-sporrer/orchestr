import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Users, Search, Filter, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCandidates } from '@/lib/actions/candidates'
import { ExportButton } from '@/components/candidates/export-button'
import { formatDateClient } from '@/lib/utils/date'
import type { CandidateStatus } from '@/generated/prisma'

interface CandidatesPageProps {
  searchParams: Promise<{ 
    search?: string
    status?: CandidateStatus
  }>
}

const statusLabels: Record<CandidateStatus, string> = {
  ACTIVE: 'Actif',
  TO_RECONTACT: 'À recontacter',
  BLACKLIST: 'Blacklist',
  DELETED: 'Supprimé',
}

const statusColors: Record<CandidateStatus, string> = {
  ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20',
  TO_RECONTACT: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  BLACKLIST: 'bg-red-500/10 text-red-600 border-red-500/20',
  DELETED: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

async function CandidatesList({ search, status }: { search?: string; status?: CandidateStatus }) {
  let result: Awaited<ReturnType<typeof getCandidates>> | null = null
  
  try {
    result = await getCandidates({ search, status, page: 1, limit: 50 })
  } catch {
    result = null
  }

  const candidates = result?.candidates || []

  if (candidates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="mt-2 text-lg font-semibold">
            {search || status ? 'Aucun résultat' : 'Aucun candidat'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            {search || status
              ? 'Aucun candidat ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
              : 'Ajoutez des candidats à votre vivier pour commencer à recruter.'
            }
          </p>
          {!search && !status && (
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button asChild size="lg">
                <Link href="/candidates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un candidat
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/import">
                  <Upload className="mr-2 h-4 w-4" />
                  Importer CSV
                </Link>
              </Button>
            </div>
          )}
          {(search || status) && (
            <Button variant="outline" asChild className="mt-4">
              <Link href="/candidates">
                Réinitialiser les filtres
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {candidates.map((candidate) => (
        <Link key={candidate.id} href={`/candidates/${candidate.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">
                    {candidate.firstName} {candidate.lastName}
                  </h3>
                  {(candidate.currentPosition || candidate.currentCompany) && (
                    <p className="text-sm text-muted-foreground">
                      {candidate.currentPosition}
                      {candidate.currentCompany && ` @ ${candidate.currentCompany}`}
                    </p>
                  )}
                  {candidate.location && (
                    <p className="text-xs text-muted-foreground">{candidate.location}</p>
                  )}
                </div>
                <Badge className={statusColors[candidate.status]}>
                  {statusLabels[candidate.status]}
                </Badge>
              </div>

              {candidate.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {candidate.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {candidate.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{candidate.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                <span>{candidate._count?.missionCandidates ?? 0} mission{(candidate._count?.missionCandidates ?? 0) !== 1 ? 's' : ''}</span>
                <span>Ajouté le {formatDateClient(candidate.createdAt, 'fr')}</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function CandidatesListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
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



