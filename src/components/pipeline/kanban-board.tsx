'use client'

import { useState, useMemo } from 'react'
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
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, PipelineStage>>({})
  const [, setIsUpdating] = useState<string | null>(null)
  
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
    const overId = over.id as string
    
    // Check if overId is actually a stage value, not a card ID
    const targetStage = stages.find(s => s.value === overId)?.value
    if (!targetStage) {
      // Dropped on a card, not a column - find the stage of that card
      const targetCard = candidates.find(c => c.id === overId)
      if (!targetCard) return
      // Use the stage of the card we dropped on
      const stageFromCard = targetCard.stage
      const candidate = candidates.find((c) => c.id === candidateId)
      if (!candidate || candidate.stage === stageFromCard) return
      
      // Optimistic update
      setOptimisticUpdates(prev => ({ ...prev, [candidateId]: stageFromCard }))
      setIsUpdating(candidateId)
      
      try {
        await updateCandidateStage(candidateId, stageFromCard)
        toast.success('Candidat déplacé')
      } catch (err) {
        // Revert optimistic update
        setOptimisticUpdates(prev => {
          const next = { ...prev }
          delete next[candidateId]
          return next
        })
        toast.error(err instanceof Error ? err.message : 'Erreur lors du déplacement')
      } finally {
        setIsUpdating(null)
      }
      return
    }

    const candidate = candidates.find((c) => c.id === candidateId)
    if (!candidate || candidate.stage === targetStage) return

    // Optimistic update
    setOptimisticUpdates(prev => ({ ...prev, [candidateId]: targetStage }))
    setIsUpdating(candidateId)

    try {
      await updateCandidateStage(candidateId, targetStage)
      toast.success('Candidat déplacé')
    } catch (err) {
      // Revert optimistic update
      setOptimisticUpdates(prev => {
        const next = { ...prev }
        delete next[candidateId]
        return next
      })
      toast.error(err instanceof Error ? err.message : 'Erreur lors du déplacement')
    } finally {
      setIsUpdating(null)
    }
  }

  // Apply optimistic updates to candidates
  const candidatesWithOptimistic = useMemo(() => 
    candidates.map(c => ({
      ...c,
      stage: optimisticUpdates[c.id] || c.stage,
    })), [candidates, optimisticUpdates])

  // Group candidates by stage (with optimistic updates)
  const candidatesByStage = useMemo(() => 
    stages.reduce((acc, stage) => {
      acc[stage.value] = candidatesWithOptimistic.filter((c) => c.stage === stage.value)
      return acc
    }, {} as Record<PipelineStage, CandidateWithDetails[]>), 
    [stages, candidatesWithOptimistic]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none">
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

