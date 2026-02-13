'use client'

import Link from 'next/link'
import { 
  MoreHorizontal, 
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateCandidateStage } from '@/lib/actions/pipeline'
import { toast } from 'sonner'
import type { MissionCandidate, Candidate, Interaction, PipelineStage, ContactStatus } from '@/generated/prisma'

interface CandidateWithDetails extends MissionCandidate {
  candidate: Candidate
  interactions: Interaction[]
}

interface Stage {
  value: PipelineStage
  label: string
  color: string
}

interface PipelineListProps {
  missionId: string
  candidates: CandidateWithDetails[]
  stages: Stage[]
}

const contactStatusLabels: Record<ContactStatus, string> = {
  NOT_CONTACTED: 'Non contacté',
  NO_RESPONSE: 'Pas de réponse',
  OPEN: 'En discussion',
  CLOSED: 'Clôturé',
  LATER: 'À recontacter',
}

export function PipelineList({ missionId, candidates, stages }: PipelineListProps) {
  const handleStageChange = async (candidateId: string, newStage: PipelineStage) => {
    try {
      await updateCandidateStage(candidateId, newStage)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="rounded-md border">
      <Table aria-label="Liste des candidats du pipeline">
        <TableHeader>
          <TableRow>
            <TableHead>Candidat</TableHead>
            <TableHead className="hidden md:table-cell">Poste actuel</TableHead>
            <TableHead>Étape</TableHead>
            <TableHead className="hidden sm:table-cell">Statut contact</TableHead>
            <TableHead className="hidden lg:table-cell">Dernière activité</TableHead>
            <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((mc) => {
            const lastInteraction = mc.interactions[0]
            const currentStage = stages.find((s) => s.value === mc.stage)

            return (
              <TableRow key={mc.id}>
                <TableCell>
                  <Link 
                    href={`/candidates/${mc.candidateId}`}
                    className="font-medium hover:underline"
                  >
                    {mc.candidate.firstName} {mc.candidate.lastName}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    {mc.candidate.email && (
                      <a href={`mailto:${mc.candidate.email}`} className="text-muted-foreground hover:text-foreground">
                        <Mail className="h-3 w-3" />
                      </a>
                    )}
                    {mc.candidate.phone && (
                      <a href={`tel:${mc.candidate.phone}`} className="text-muted-foreground hover:text-foreground">
                        <Phone className="h-3 w-3" />
                      </a>
                    )}
                    {mc.candidate.profileUrl && (
                      <a href={mc.candidate.profileUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm">
                    {mc.candidate.currentPosition || '-'}
                    {mc.candidate.currentCompany && (
                      <span className="text-muted-foreground"> @ {mc.candidate.currentCompany}</span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <Select
                    value={mc.stage}
                    onValueChange={(v) => handleStageChange(mc.id, v as PipelineStage)}
                  >
                    <SelectTrigger className="w-36 h-8">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${currentStage?.color}`} />
                          {currentStage?.label}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
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
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="secondary" className="text-xs">
                    {contactStatusLabels[mc.contactStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {lastInteraction ? (
                    <span className="text-sm text-muted-foreground">
                      {new Date(lastInteraction.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/candidates/${mc.candidateId}`}>
                          Voir le profil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>Ajouter une note</DropdownMenuItem>
                      <DropdownMenuItem>Inviter au parcours</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Rejeter
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}





