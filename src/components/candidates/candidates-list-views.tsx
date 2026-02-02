'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Users, Search, Upload, Building2, Loader2, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ViewToggle, type ViewMode } from '@/components/list-views/view-toggle'
import { BulkActionBar } from '@/components/list-views/bulk-action-bar'
import { AddToMissionDialog } from '@/components/candidates/add-to-mission-dialog'
import { formatDateClient } from '@/lib/utils/date'
import { deleteCandidate } from '@/lib/actions/candidates'
import { toast } from 'sonner'
import type { CandidateWithCount } from '@/lib/actions/candidates'
import type { CandidateStatus } from '@/generated/prisma'

const statusLabels: Record<CandidateStatus, string> = {
  ACTIVE: 'Actif',
  TO_RECONTACT: 'À recontacter',
  BLACKLIST: 'Blacklist',
  DELETED: 'Supprimé',
}

const statusColors: Record<CandidateStatus, string> = {
  ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20',
  TO_RECONTACT: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  BLACKLIST: 'bg-red-500/10 text-red-600 border-red-500/20',
  DELETED: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

interface CandidatesListWithViewsProps {
  candidates: CandidateWithCount[]
  search?: string
  status?: CandidateStatus
  hasActiveFilters?: boolean
}

export function CandidatesListWithViews({
  candidates,
  search,
  status,
  hasActiveFilters = !!(search || status),
}: CandidatesListWithViewsProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [addToMissionOpen, setAddToMissionOpen] = useState(false)
  const [addToMissionCandidateIds, setAddToMissionCandidateIds] = useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(candidates.map((c) => c.id)))
    else setSelectedIds(new Set())
  }

  const allSelected = candidates.length > 0 && selectedIds.size === candidates.length
  const someSelected = selectedIds.size > 0

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setIsDeleting(true)
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteCandidate(id)))
      toast.success(`${selectedIds.size} candidat(s) supprimé(s)`)
      setSelectedIds(new Set())
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  if (candidates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="mt-2 text-lg font-semibold">
            {hasActiveFilters ? 'Aucun résultat' : 'Aucun candidat'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            {hasActiveFilters
              ? 'Aucun candidat ne correspond à vos critères. Essayez de modifier vos filtres.'
              : 'Ajoutez des candidats à votre vivier pour commencer à recruter.'
            }
          </p>
          {!hasActiveFilters && (
            <div className="flex flex-col sm:flex-row gap-2 mt-6">
              <Button asChild size="lg">
                <Link href="/candidates/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un candidat
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/import">
                  <Upload className="mr-2 h-4 w-4" />
                  Importer CSV
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {someSelected && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          onDelete={handleBulkDelete}
          isDeleting={isDeleting}
          entityLabel="candidat"
          secondaryAction={{
            label: 'Ajouter à une mission',
            icon: <Briefcase className="h-4 w-4 mr-1" />,
            onClick: () => {
              setAddToMissionCandidateIds(Array.from(selectedIds))
              setAddToMissionOpen(true)
            },
          }}
        />
      )}

      <AddToMissionDialog
        candidateIds={addToMissionCandidateIds}
        open={addToMissionOpen}
        onOpenChange={(open) => {
          setAddToMissionOpen(open)
          if (!open) setAddToMissionCandidateIds([])
        }}
        onSuccess={() => {
          setSelectedIds(new Set())
          router.refresh()
        }}
      />

      {viewMode === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="relative flex items-start gap-3">
              <Checkbox
                checked={selectedIds.has(candidate.id)}
                onCheckedChange={() => toggleSelect(candidate.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-5 shrink-0"
                aria-label={`Sélectionner ${candidate.firstName} ${candidate.lastName}`}
              />
              <Link href={`/candidates/${candidate.id}`} className="flex-1 min-w-0">
                <Card
                  data-testid="candidate-card"
                  className="hover:border-primary/50 transition-colors cursor-pointer h-full focus-within:ring-2 focus-within:ring-primary/20"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        {(candidate.currentPosition || candidate.currentCompany) && (
                          <p className="text-sm text-muted-foreground truncate">
                            {candidate.currentPosition}
                            {candidate.currentCompany && ` @ ${candidate.currentCompany}`}
                          </p>
                        )}
                        {candidate.location && (
                          <p className="text-xs text-muted-foreground truncate">{candidate.location}</p>
                        )}
                      </div>
                      <Badge className={statusColors[candidate.status]} aria-label={`Statut : ${statusLabels[candidate.status]}`}>
                        {statusLabels[candidate.status]}
                      </Badge>
                    </div>
                    {candidate.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {candidate.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {candidate.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{candidate.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                      <span>{candidate._count.missionCandidates} mission{candidate._count.missionCandidates !== 1 ? 's' : ''}</span>
                      <span>Ajouté le {formatDateClient(candidate.createdAt, 'fr')}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs w-full justify-start focus-visible:ring-2 focus-visible:ring-primary"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setAddToMissionCandidateIds([candidate.id])
                          setAddToMissionOpen(true)
                        }}
                        aria-label={`Ajouter ${candidate.firstName} ${candidate.lastName} à une mission`}
                      >
                        <Briefcase className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                        Ajouter à une mission
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                    aria-label="Tout sélectionner"
                  />
                </TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Poste / Entreprise</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Missions</TableHead>
                <TableHead>Ajouté le</TableHead>
                <TableHead className="w-[140px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow
                  key={candidate.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/candidates/${candidate.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(candidate.id)}
                      onCheckedChange={() => toggleSelect(candidate.id)}
                      aria-label={`Sélectionner ${candidate.firstName} ${candidate.lastName}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {candidate.firstName} {candidate.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {candidate.currentPosition || candidate.currentCompany
                      ? `${candidate.currentPosition || ''}${candidate.currentCompany ? ` @ ${candidate.currentCompany}` : ''}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[candidate.status]}>
                      {statusLabels[candidate.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{candidate._count.missionCandidates}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateClient(candidate.createdAt, 'fr')}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => {
                        setAddToMissionCandidateIds([candidate.id])
                        setAddToMissionOpen(true)
                      }}
                      aria-label={`Ajouter ${candidate.firstName} ${candidate.lastName} à une mission`}
                    >
                      <Briefcase className="h-3.5 w-3.5 mr-1" />
                      Ajouter à une mission
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
