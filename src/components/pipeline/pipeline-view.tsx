'use client'

import { useState, useMemo, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutGrid, List, Filter, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KanbanBoard } from './kanban-board'
import { PipelineList } from './pipeline-list'
import type { Mission, MissionCandidate, Candidate, Interaction, PipelineStage } from '@/generated/prisma'

interface MissionWithCandidates extends Mission {
  missionCandidates: (MissionCandidate & {
    candidate: Candidate
    interactions: Interaction[]
  })[]
}

interface PipelineViewProps {
  mission: MissionWithCandidates
  /** Refresh lazy-loaded pipeline query after stage changes */
  onAfterPipelineMutation?: () => void
  /** Switch mission detail tab without full navigation (client tabs) */
  onNavigateToSourcing?: () => void
}

const stages: { value: PipelineStage; label: string; color: string }[] = [
  { value: 'SOURCED', label: 'Sourcé', color: 'bg-slate-500' },
  { value: 'CONTACTED', label: 'Contacté', color: 'bg-blue-500' },
  { value: 'RESPONSE', label: 'Réponse', color: 'bg-indigo-500' },
  { value: 'INTERVIEW', label: 'Entretien', color: 'bg-purple-500' },
  { value: 'SHORTLIST', label: 'Shortlist', color: 'bg-amber-500' },
  { value: 'OFFER', label: 'Offre', color: 'bg-orange-500' },
  { value: 'PLACED', label: 'Placé', color: 'bg-green-500' },
]

export function PipelineView({
  mission,
  onAfterPipelineMutation,
  onNavigateToSourcing,
}: Readonly<PipelineViewProps>) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all')

  const filteredCandidates = useMemo(() => 
    mission.missionCandidates.filter((mc) => {
      if (stageFilter === 'all') return true
      return mc.stage === stageFilter
    }), [mission.missionCandidates, stageFilter])

  const totalCandidates = mission.missionCandidates.length

  const stageCounts = useMemo(() => 
    stages.map((stage) => ({
      ...stage,
      count: mission.missionCandidates.filter((mc) => mc.stage === stage.value).length,
    })), [mission.missionCandidates])

  const emptyPipelineMessage =
    stageFilter === 'all'
      ? 'Commencez à sourcer des candidats pour cette mission.'
      : `Aucun candidat à l'étape "${stages.find((s) => s.value === stageFilter)?.label}"`

  let pipelineMain: ReactNode
  if (filteredCandidates.length === 0) {
    pipelineMain = (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserPlus className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun candidat</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            {emptyPipelineMessage}
          </p>
        </CardContent>
      </Card>
    )
  } else if (viewMode === 'kanban') {
    pipelineMain = (
      <KanbanBoard
        missionId={mission.id}
        candidates={filteredCandidates}
        stages={stages}
        onAfterStageChange={onAfterPipelineMutation}
      />
    )
  } else {
    pipelineMain = (
      <PipelineList
        missionId={mission.id}
        candidates={filteredCandidates}
        stages={stages}
        onAfterStageChange={onAfterPipelineMutation}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        <Badge
          variant={stageFilter === 'all' ? 'default' : 'outline'}
          className="whitespace-nowrap cursor-pointer hover:bg-muted"
          onClick={() => setStageFilter('all')}
        >
          Tous: {totalCandidates}
        </Badge>
        {stageCounts.map((stage) => (
          <Badge
            key={stage.value}
            variant={stageFilter === stage.value ? 'default' : 'outline'}
            className="whitespace-nowrap cursor-pointer hover:bg-muted transition-colors"
            onClick={() => setStageFilter(stageFilter === stage.value ? 'all' : stage.value)}
          >
            <span className={`w-2 h-2 rounded-full mr-1.5 ${stage.color}`} />
            {stage.label}: {stage.count}
          </Badge>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>

          <Select
            value={stageFilter}
            onValueChange={(v) => setStageFilter(v as PipelineStage | 'all')}
          >
            <SelectTrigger className="w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filtrer par étape" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les étapes</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${stage.color}`} />
                    {stage.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          onClick={() =>
            onNavigateToSourcing ? onNavigateToSourcing() : router.push(`/missions/${mission.id}?tab=sourcing`)
          }
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter un candidat
        </Button>
      </div>

      {/* Content */}
      {pipelineMain}
    </div>
  )
}





