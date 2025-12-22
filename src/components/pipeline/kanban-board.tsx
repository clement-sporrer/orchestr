'use client'

import { useState } from 'react'
import { 
  DndContext, 
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { 
  SortableContext, 
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { updateCandidateStage } from '@/lib/actions/pipeline'
import { toast } from 'sonner'
import type { MissionCandidate, Candidate, Interaction, PipelineStage } from '@/generated/prisma'

interface CandidateWithDetails extends MissionCandidate {
  candidate: Candidate
  interactions: Interaction[]
}

interface Stage {
  value: PipelineStage
  label: string
  color: string
}

interface KanbanBoardProps {
  missionId: string
  candidates: CandidateWithDetails[]
  stages: Stage[]
}

export function KanbanBoard({ missionId, candidates, stages }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const activeCandidate = activeId 
    ? candidates.find((c) => c.id === activeId)
    : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const candidateId = active.id as string
    const targetStage = over.id as PipelineStage

    const candidate = candidates.find((c) => c.id === candidateId)
    if (!candidate || candidate.stage === targetStage) return

    try {
      await updateCandidateStage(candidateId, targetStage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du déplacement')
    }
  }

  // Group candidates by stage
  const candidatesByStage = stages.reduce((acc, stage) => {
    acc[stage.value] = candidates.filter((c) => c.stage === stage.value)
    return acc
  }, {} as Record<PipelineStage, CandidateWithDetails[]>)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.value}
            stage={stage}
            candidates={candidatesByStage[stage.value] || []}
          >
            <SortableContext
              items={(candidatesByStage[stage.value] || []).map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {(candidatesByStage[stage.value] || []).map((candidate) => (
                <KanbanCard
                  key={candidate.id}
                  candidate={candidate}
                  missionId={missionId}
                />
              ))}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>

      <DragOverlay>
        {activeCandidate && (
          <KanbanCard
            candidate={activeCandidate}
            missionId={missionId}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

