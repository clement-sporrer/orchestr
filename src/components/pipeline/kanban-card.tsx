'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { 
  MoreHorizontal, 
  MessageSquare, 
  Calendar, 
  Mail,
  Phone,
  ExternalLink,
  X,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { MissionCandidate, Candidate, Interaction, ContactStatus } from '@/generated/prisma'

interface CandidateWithDetails extends MissionCandidate {
  candidate: Candidate
  interactions: Interaction[]
}

interface KanbanCardProps {
  candidate: CandidateWithDetails
  missionId: string
  isDragging?: boolean
}

const contactStatusLabels: Record<ContactStatus, string> = {
  NOT_CONTACTED: 'Non contacté',
  NO_RESPONSE: 'Pas de réponse',
  OPEN: 'En discussion',
  CLOSED: 'Clôturé',
  LATER: 'À recontacter',
}

const contactStatusColors: Record<ContactStatus, string> = {
  NOT_CONTACTED: 'bg-gray-500/10 text-gray-600',
  NO_RESPONSE: 'bg-yellow-500/10 text-yellow-600',
  OPEN: 'bg-green-500/10 text-green-600',
  CLOSED: 'bg-blue-500/10 text-blue-600',
  LATER: 'bg-orange-500/10 text-orange-600',
}

export function KanbanCard({ candidate, missionId, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: candidate.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const lastInteraction = candidate.interactions[0]

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer hover:border-primary/50 transition-colors",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg rotate-2"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Link href={`/candidates/${candidate.candidateId}`}>
              <h4 className="font-medium text-sm truncate hover:underline">
                {candidate.candidate.firstName} {candidate.candidate.lastName}
              </h4>
            </Link>
            {(candidate.candidate.currentPosition || candidate.candidate.currentCompany) && (
              <p className="text-xs text-muted-foreground truncate">
                {candidate.candidate.currentPosition}
                {candidate.candidate.currentCompany && ` @ ${candidate.candidate.currentCompany}`}
              </p>
            )}

            {/* Status & Score */}
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="secondary" 
                className={cn("text-xs", contactStatusColors[candidate.contactStatus])}
              >
                {contactStatusLabels[candidate.contactStatus]}
              </Badge>
              {candidate.score && (
                <span className="text-xs font-medium text-muted-foreground">
                  {candidate.score}%
                </span>
              )}
            </div>

            {/* Last Interaction */}
            {lastInteraction && (
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {lastInteraction.type === 'MESSAGE' && <MessageSquare className="inline h-3 w-3 mr-1" />}
                {lastInteraction.type === 'INTERVIEW_SCHEDULED' && <Calendar className="inline h-3 w-3 mr-1" />}
                {new Date(lastInteraction.createdAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/candidates/${candidate.candidateId}`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Voir le profil
                </Link>
              </DropdownMenuItem>
              {candidate.candidate.email && (
                <DropdownMenuItem asChild>
                  <a href={`mailto:${candidate.candidate.email}`}>
                    <Mail className="mr-2 h-4 w-4" />
                    Envoyer un email
                  </a>
                </DropdownMenuItem>
              )}
              {candidate.candidate.phone && (
                <DropdownMenuItem asChild>
                  <a href={`tel:${candidate.candidate.phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Appeler
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Ajouter une note
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Calendar className="mr-2 h-4 w-4" />
                Inviter au parcours
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <X className="mr-2 h-4 w-4" />
                Rejeter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

