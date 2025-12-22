'use client'

import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import type { PipelineStage, MissionCandidate, Candidate, Interaction } from '@/generated/prisma'

interface CandidateWithDetails extends MissionCandidate {
  candidate: Candidate
  interactions: Interaction[]
}

interface Stage {
  value: PipelineStage
  label: string
  color: string
}

interface KanbanColumnProps {
  stage: Stage
  candidates: CandidateWithDetails[]
  children: React.ReactNode
}

export function KanbanColumn({ stage, candidates, children }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.value,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 rounded-lg bg-muted/50 p-3",
        isOver && "bg-muted ring-2 ring-primary/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${stage.color}`} />
          <h3 className="font-medium text-sm">{stage.label}</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">
          {candidates.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-2 min-h-[100px]">
        {children}
      </div>
    </div>
  )
}



