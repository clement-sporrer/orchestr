import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Briefcase, Search, Filter } from 'lucide-react'
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
import { getMissions, type MissionWithCount } from '@/lib/actions/missions'
import type { MissionStatus } from '@/generated/prisma'

interface MissionsPageProps {
  searchParams: Promise<{ 
    search?: string
    status?: MissionStatus
  }>
}

const statusLabels: Record<MissionStatus, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Active',
  ON_HOLD: 'En pause',
  CLOSED_FILLED: 'Pourvue',
  CLOSED_CANCELLED: 'Annulée',
}

const statusColors: Record<MissionStatus, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20',
  ON_HOLD: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  CLOSED_FILLED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  CLOSED_CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/20',
}

async function MissionsList({ search, status }: { search?: string; status?: MissionStatus }) {
  let missions: MissionWithCount[] = []
  
  try {
    const result = await getMissions({ search, status, page: 1, limit: 50 })
    missions = result.missions
  } catch {
    missions = []
  }

  if (missions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Briefcase className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="mt-2 text-lg font-semibold">
            {search || status ? 'Aucun résultat' : 'Aucune mission'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            {search || status
              ? 'Aucune mission ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
              : 'Créez votre première mission pour commencer à recruter.'
            }
          </p>
          {!search && !status && (
            <Button asChild size="lg" className="mt-6">
              <Link href="/missions/new">
                <Plus className="mr-2 h-4 w-4" />
                Créer une mission
              </Link>
            </Button>
          )}
          {(search || status) && (
            <Button variant="outline" asChild className="mt-4">
              <Link href="/missions">
                Réinitialiser les filtres
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {missions.map((mission) => (
        <Link key={mission.id} href={`/missions/${mission.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{mission.title}</h3>
                    <Badge className={statusColors[mission.status]}>
                      {statusLabels[mission.status]}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{mission.client.name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    {mission.location && <span>{mission.location}</span>}
                    {mission.contractType && <span>{mission.contractType}</span>}
                    {mission.recruiter && <span>Assigné à {mission.recruiter.name}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{mission._count.missionCandidates}</p>
                  <p className="text-sm text-muted-foreground">candidat{mission._count.missionCandidates !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function MissionsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-12 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function MissionsPage({ searchParams }: MissionsPageProps) {
  const { search, status } = await searchParams

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Missions</h1>
          <p className="text-muted-foreground">
            Gérez vos missions de recrutement
          </p>
        </div>
        <Button asChild>
          <Link href="/missions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle mission
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <form className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="search"
            placeholder="Rechercher une mission..."
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
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="DRAFT">Brouillon</SelectItem>
              <SelectItem value="ON_HOLD">En pause</SelectItem>
              <SelectItem value="CLOSED_FILLED">Pourvue</SelectItem>
              <SelectItem value="CLOSED_CANCELLED">Annulée</SelectItem>
            </SelectContent>
          </Select>
        </form>
      </div>

      {/* Missions List */}
      <Suspense fallback={<MissionsListSkeleton />}>
        <MissionsList search={search} status={status} />
      </Suspense>
    </div>
  )
}



