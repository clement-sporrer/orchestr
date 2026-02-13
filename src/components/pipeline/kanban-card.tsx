'use client'

import { useState, memo } from 'react'
import { useLocale } from 'next-intl'
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
  Link2,
  Copy,
  Check,
  Sparkles,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatDateClient } from '@/lib/utils/date'
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

export const KanbanCard = memo(function KanbanCard({ candidate, missionId, isDragging }: KanbanCardProps) {
  const locale = useLocale()
  const [copied, setCopied] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
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
  const hasPortalLink = candidate.contactStatus === 'OPEN' && candidate.portalToken
  const portalUrl = hasPortalLink 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/candidate/${candidate.portalToken}`
    : null

  const copyPortalLink = async () => {
    if (!portalUrl) return
    await navigator.clipboard.writeText(portalUrl)
    setCopied(true)
    toast.success('Lien copie!')
    setTimeout(() => setCopied(false), 2000)
  }

  const generateInviteMessage = () => {
    const firstName = candidate.candidate.firstName
    // Short message for LinkedIn connection request (max 200 chars)
    return `Merci pour votre interet ${firstName}! Voici le lien pour completer votre profil et decouvrir l'opportunite: ${portalUrl}`
  }

  const copyInviteMessage = async () => {
    const message = generateInviteMessage()
    await navigator.clipboard.writeText(message)
    toast.success('Message copie!')
    setShowInviteDialog(false)
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      role="button"
      tabIndex={0}
      aria-label={`Candidat ${candidate.candidate.firstName} ${candidate.candidate.lastName}`}
      className={cn(
        "cursor-pointer hover:border-primary/50 transition-all",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg rotate-2",
        isUpdating && "opacity-75"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
            aria-label={`Déplacer ${candidate.candidate.firstName} ${candidate.candidate.lastName}`}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
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
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge 
                variant="secondary" 
                className={cn("text-xs", contactStatusColors[candidate.contactStatus])}
              >
                {contactStatusLabels[candidate.contactStatus]}
              </Badge>
              {hasPortalLink && (
                <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                  <Link2 className="h-3 w-3 mr-1" />
                  Lien pret
                </Badge>
              )}
            </div>
            
            {/* Portal Link Actions */}
            {hasPortalLink && (
              <div className="flex items-center gap-1 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyPortalLink()
                  }}
                >
                  {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied ? 'Copie!' : 'Copier lien'}
                </Button>
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                      <DialogTitle>Message d&apos;invitation</DialogTitle>
                      <DialogDescription>
                        Copiez ce message pour LinkedIn (max 200 caracteres)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg text-sm">
                        {generateInviteMessage()}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {generateInviteMessage().length}/200 caracteres
                        </span>
                        <Button onClick={copyInviteMessage}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copier le message
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Last Interaction */}
            {lastInteraction && (
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {lastInteraction.type === 'MESSAGE' && <MessageSquare className="inline h-3 w-3 mr-1" aria-hidden="true" />}
                {lastInteraction.type === 'INTERVIEW_SCHEDULED' && <Calendar className="inline h-3 w-3 mr-1" aria-hidden="true" />}
                {formatDateClient(lastInteraction.createdAt, locale)}
              </p>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                aria-label={`Actions pour ${candidate.candidate.firstName} ${candidate.candidate.lastName}`}
              >
                <MoreHorizontal className="h-3 w-3" aria-hidden="true" />
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
})

