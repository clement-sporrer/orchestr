import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'
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
import { getMissions, type MissionWithCount } from '@/lib/actions/missions'
import { MissionsListWithViews } from '@/components/missions/missions-list-views'
import type { MissionStatus } from '@/generated/prisma'

interface MissionsPageProps {
  searchParams: Promise<{ 
    search?: string
    status?: MissionStatus
  }>
}

async function MissionsList({ search, status }: { search?: string; status?: MissionStatus }) {
  let missions: MissionWithCount[] = []
  
  try {
    const result = await getMissions({ search, status, page: 1, limit: 50 })
    missions = result.missions
  } catch {
    missions = []
  }

  return (
    <MissionsListWithViews
      missions={missions}
      search={search}
      status={status}
    />
  )
}

function MissionsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
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



