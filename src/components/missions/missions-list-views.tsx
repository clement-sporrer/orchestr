'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { deleteMission } from '@/lib/actions/missions'
import { toast } from 'sonner'
import type { MissionWithCount } from '@/lib/actions/missions'
import { displayClientCompanyName } from '@/lib/utils/client-display'
import type { MissionStatus } from '@/generated/prisma'

const statusLabels: Record<MissionStatus, string> = {
  DRAFT: 'Brouillon',
  ACTIVE: 'Active',
  ON_HOLD: 'En pause',
  CLOSED_FILLED: 'Pourvue',
  CLOSED_CANCELLED: 'Annulée',
}

const statusColors: Record<MissionStatus, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20',
  ON_HOLD: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  CLOSED_FILLED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  CLOSED_CANCELLED: 'bg-red-500/10 text-red-600 border-red-500/20',
}

interface MissionsListWithViewsProps {
  missions: MissionWithCount[]
  search?: string
  status?: MissionStatus
}

export function MissionsListWithViews({
  missions,
  search,
  status,
}: Readonly<MissionsListWithViewsProps>) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllMissions = () => setSelectedIds(new Set(missions.map((m) => m.id)))
  const clearAllMissionSelection = () => setSelectedIds(new Set())

  const allSelected = missions.length > 0 && selectedIds.size === missions.length
  const someSelected = selectedIds.size > 0

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setIsDeleting(true)
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteMission(id)))
      toast.success(`${selectedIds.size} mission(s) supprimée(s)`)
      setSelectedIds(new Set())
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  if (missions.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Briefcase className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <h3 className="mt-2 text-lg font-semibold">
            {search || status ? 'Aucun résultat' : 'Aucune mission'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            {search || status
              ? 'Aucune mission ne correspond à vos critères. Essayez de modifier vos filtres.'
              : 'Créez votre première mission pour commencer à recruter.'}
          </p>
          {!search && !status && (
            <Button asChild size="lg" className="mt-6">
              <Link href="/missions/new">
                <Plus className="mr-2 h-4 w-4" />
                Créer une mission
              </Link>
            </Button>
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
          entityLabel="mission"
        />
      )}

      {viewMode === 'cards' ? (
        <div className="space-y-4">
          {missions.map((mission) => (
            <div key={mission.id} className="relative flex items-start gap-3">
              <Checkbox
                checked={selectedIds.has(mission.id)}
                onCheckedChange={() => toggleSelect(mission.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-6 shrink-0"
                aria-label={`Sélectionner ${mission.title}`}
              />
              <Link href={`/missions/${mission.id}`} className="flex-1 min-w-0">
                <Card
                  data-testid="mission-card"
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{mission.title}</h3>
                          <Badge className={statusColors[mission.status]}>
                            {statusLabels[mission.status]}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{displayClientCompanyName(mission.client.companyName)}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          {mission.location && <span>{mission.location}</span>}
                          {mission.contractType && <span>{mission.contractType}</span>}
                          {mission.recruiter && <span>Assigné à {mission.recruiter.name}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{mission._count.missionCandidates}</p>
                        <p className="text-sm text-muted-foreground">
                          candidat{mission._count.missionCandidates === 1 ? '' : 's'}
                        </p>
                      </div>
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
                    onCheckedChange={(state) => {
                      if (state === true) selectAllMissions()
                      else clearAllMissionSelection()
                    }}
                    aria-label="Tout sélectionner"
                  />
                </TableHead>
                <TableHead>Mission</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Localisation</TableHead>
                <TableHead>Candidats</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {missions.map((mission) => (
                <TableRow
                  key={mission.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/missions/${mission.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(mission.id)}
                      onCheckedChange={() => toggleSelect(mission.id)}
                      aria-label={`Sélectionner ${mission.title}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{mission.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {displayClientCompanyName(mission.client.companyName)}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[mission.status]}>
                      {statusLabels[mission.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{mission.location || '-'}</TableCell>
                  <TableCell>{mission._count.missionCandidates}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
