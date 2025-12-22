'use client'

import { useState } from 'react'
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
}

const stages: { value: PipelineStage; label: string; color: string }[] = [
  { value: 'SOURCED', label: 'Sourcé', color: 'bg-gray-500' },
  { value: 'CONTACTED', label: 'Contacté', color: 'bg-blue-500' },
  { value: 'RESPONSE_RECEIVED', label: 'Réponse', color: 'bg-indigo-500' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Entretien planifié', color: 'bg-purple-500' },
  { value: 'INTERVIEW_DONE', label: 'Entretien fait', color: 'bg-pink-500' },
  { value: 'SENT_TO_CLIENT', label: 'Envoyé client', color: 'bg-orange-500' },
  { value: 'CLIENT_INTERVIEW', label: 'Entretien client', color: 'bg-amber-500' },
  { value: 'OFFER', label: 'Offre', color: 'bg-yellow-500' },
  { value: 'CLOSED_HIRED', label: 'Embauché', color: 'bg-green-500' },
  { value: 'CLOSED_REJECTED', label: 'Refusé', color: 'bg-red-500' },
]

export function PipelineView({ mission }: PipelineViewProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all')

  const filteredCandidates = mission.missionCandidates.filter((mc) => {
    if (stageFilter === 'all') return true
    return mc.stage === stageFilter
  })

  const stageCounts = stages.map((stage) => ({
    ...stage,
    count: mission.missionCandidates.filter((mc) => mc.stage === stage.value).length,
  }))

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {stageCounts.map((stage) => (
          <Badge
            key={stage.value}
            variant="outline"
            className="whitespace-nowrap cursor-pointer hover:bg-muted"
            onClick={() => setStageFilter(stageFilter === stage.value ? 'all' : stage.value)}
          >
            <span className={`w-2 h-2 rounded-full mr-2 ${stage.color}`} />
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

        <Button size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter un candidat
        </Button>
      </div>

      {/* Content */}
      {filteredCandidates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Aucun candidat</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              {stageFilter !== 'all'
                ? `Aucun candidat à l'étape "${stages.find((s) => s.value === stageFilter)?.label}"`
                : 'Commencez à sourcer des candidats pour cette mission.'
              }
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          missionId={mission.id}
          candidates={filteredCandidates}
          stages={stages}
        />
      ) : (
        <PipelineList
          missionId={mission.id}
          candidates={filteredCandidates}
          stages={stages}
        />
      )}
    </div>
  )
}



