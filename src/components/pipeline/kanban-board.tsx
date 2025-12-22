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
    const overId = over.id as string
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/969acf1d-f25c-4d68-8363-89eb500b6a8c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'kanban-board.tsx:handleDragEnd',message:'DragEnd event',data:{candidateId,overId,isStage:stages.some(s => s.value === overId)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    // H1 FIX: Check if overId is actually a stage value, not a card ID
    const targetStage = stages.find(s => s.value === overId)?.value
    if (!targetStage) {
      // Dropped on a card, not a column - find the stage of that card
      const targetCard = candidates.find(c => c.id === overId)
      if (!targetCard) return
      // Use the stage of the card we dropped on
      const stageFromCard = targetCard.stage
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/969acf1d-f25c-4d68-8363-89eb500b6a8c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'kanban-board.tsx:handleDragEnd',message:'Dropped on card, using card stage',data:{overId,stageFromCard},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      const candidate = candidates.find((c) => c.id === candidateId)
      if (!candidate || candidate.stage === stageFromCard) return
      try {
        await updateCandidateStage(candidateId, stageFromCard)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erreur lors du déplacement')
      }
      return
    }

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

