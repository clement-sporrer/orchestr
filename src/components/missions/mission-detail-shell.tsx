'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  Users,
  MoreHorizontal,
  Pencil,
  Trash,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { PipelineView } from '@/components/pipeline/pipeline-view'
import { JobView } from '@/components/job-builder/job-view'
import { MissionSourcingView } from '@/components/missions/sourcing-view'
import { MissionShortlistView } from '@/components/missions/shortlist-view'
import { MissionStatusActions } from '@/components/missions/status-actions'
import {
  getMissionPipelineCandidates,
  type MissionDetailOverview,
  type MissionPipelineCandidateRow,
} from '@/lib/actions/missions'
import { queryKeys } from '@/lib/query/client'
import { displayClientCompanyName } from '@/lib/utils/client-display'
import type { MissionStatus } from '@/generated/prisma'

const MISSION_TABS = ['pipeline', 'job', 'sourcing', 'shortlist'] as const
type MissionTab = (typeof MISSION_TABS)[number]

function isMissionTab(v: string): v is MissionTab {
  return (MISSION_TABS as readonly string[]).includes(v)
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

export function invalidateMissionPipelineQuery(queryClient: ReturnType<typeof useQueryClient>, missionId: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.missions.pipeline(missionId) })
}

interface MissionDetailShellProps {
  missionId: string
  overview: MissionDetailOverview
  initialTab: string
}

export function MissionDetailShell({
  missionId,
  overview,
  initialTab,
}: Readonly<MissionDetailShellProps>) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<MissionTab>(() =>
    isMissionTab(initialTab) ? initialTab : 'pipeline',
  )

  const onTabChange = useCallback((value: string) => {
    if (!isMissionTab(value)) return
    setTab(value)
    if (globalThis.window !== undefined) {
      const url = new URL(globalThis.window.location.href)
      url.searchParams.set('tab', value)
      globalThis.window.history.replaceState(null, '', url)
    }
  }, [])

  const needsPipeline = tab === 'pipeline' || tab === 'sourcing'

  const {
    data: missionCandidates,
    isLoading: pipelineLoading,
    isError: pipelineError,
  } = useQuery({
    queryKey: queryKeys.missions.pipeline(missionId),
    queryFn: () => getMissionPipelineCandidates(missionId),
    enabled: needsPipeline,
    staleTime: 30 * 1000,
  })

  const mergedMission = useMemo(() => {
    const candidates: MissionPipelineCandidateRow[] = missionCandidates ?? []
    return {
      ...overview,
      missionCandidates: candidates,
    }
  }, [overview, missionCandidates])

  const candidateCount =
    missionCandidates === undefined
      ? overview._count.missionCandidates
      : missionCandidates.length

  const clientLabel = displayClientCompanyName(overview.client.companyName)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/missions">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">{overview.title}</h1>
              <Badge className={statusColors[overview.status as MissionStatus]}>
                {statusLabels[overview.status as MissionStatus]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground flex-wrap">
              <Link
                href={`/clients/${overview.clientId}`}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Building2 className="h-4 w-4" />
                {clientLabel}
              </Link>
              {overview.mainContact && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {[overview.mainContact.firstName, overview.mainContact.lastName].filter(Boolean).join(' ') ||
                    overview.mainContact.email}
                  {overview.mainContact.email && (
                    <a href={`mailto:${overview.mainContact.email}`} className="hover:text-foreground">
                      ({overview.mainContact.email})
                    </a>
                  )}
                </span>
              )}
              {(overview.location ?? overview.city) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {overview.city ?? overview.location}
                  {overview.country && `, ${overview.country}`}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {candidateCount} candidat
                {candidateCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <MissionStatusActions missionId={overview.id} currentStatus={overview.status as MissionStatus} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/missions/${overview.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="job">Fiche de poste</TabsTrigger>
          <TabsTrigger value="sourcing">Sourcing</TabsTrigger>
          <TabsTrigger value="shortlist">Shortlist</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-6">
          {pipelineLoading && (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-96 w-full rounded-lg" />
            </div>
          )}
          {pipelineError && (
            <p className="text-sm text-destructive">Impossible de charger le pipeline. Réessaie ou recharge la page.</p>
          )}
          {!pipelineLoading && !pipelineError && (
            <PipelineView
              mission={mergedMission as never}
              onAfterPipelineMutation={() => invalidateMissionPipelineQuery(queryClient, missionId)}
              onNavigateToSourcing={() => onTabChange('sourcing')}
            />
          )}
        </TabsContent>

        <TabsContent value="job" className="mt-6">
          <JobView mission={overview as never} />
        </TabsContent>

        <TabsContent value="sourcing" className="mt-6">
          {pipelineLoading && (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          )}
          {pipelineError && (
            <p className="text-sm text-destructive">Impossible de charger les candidats de la mission.</p>
          )}
          {!pipelineLoading && !pipelineError && (
            <MissionSourcingView
              mission={mergedMission as never}
              onPipelineChanged={() => invalidateMissionPipelineQuery(queryClient, missionId)}
            />
          )}
        </TabsContent>

        <TabsContent value="shortlist" className="mt-6">
          <MissionShortlistView mission={overview as never} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
