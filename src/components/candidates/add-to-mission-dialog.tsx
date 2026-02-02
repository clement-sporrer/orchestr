'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getMissions } from '@/lib/actions/missions'
import { addCandidateToMission } from '@/lib/actions/pipeline'
import { toast } from 'sonner'

interface MissionOption {
  id: string
  title: string
  status: string
  client: { id: string; name: string }
}

interface AddToMissionDialogProps {
  candidateIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddToMissionDialog({
  candidateIds,
  open,
  onOpenChange,
  onSuccess,
}: AddToMissionDialogProps) {
  const router = useRouter()
  const [missions, setMissions] = useState<MissionOption[]>([])
  const [loadingMissions, setLoadingMissions] = useState(false)
  const [selectedMissionId, setSelectedMissionId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingMissions(true)
    setSelectedMissionId('')
    getMissions({ status: undefined, limit: 100 })
      .then((res) => {
        setMissions(res.missions as MissionOption[])
      })
      .catch(() => {
        toast.error('Impossible de charger les missions')
      })
      .finally(() => setLoadingMissions(false))
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMissionId) {
      toast.error('Veuillez choisir une mission')
      return
    }
    setSubmitting(true)
    let successCount = 0
    let alreadyInMission = 0
    let errors = 0
    try {
      for (const candidateId of candidateIds) {
        try {
          await addCandidateToMission(selectedMissionId, candidateId)
          successCount++
        } catch (err) {
          const msg = err instanceof Error ? err.message : ''
          if (msg.includes('déjà dans cette mission')) alreadyInMission++
          else errors++
        }
      }
      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? 'Candidat ajouté à la mission'
            : `${successCount} candidat(s) ajouté(s) à la mission`
        )
        router.refresh()
        onSuccess?.()
        onOpenChange(false)
      }
      if (alreadyInMission > 0) {
        toast.warning(
          alreadyInMission === 1
            ? 'Ce candidat est déjà dans cette mission'
            : `${alreadyInMission} candidat(s) déjà dans cette mission`
        )
        if (successCount === 0) onOpenChange(false)
      }
      if (errors > 0) {
        toast.error(
          errors === 1
            ? 'Erreur lors de l\'ajout'
            : `${errors} erreur(s) lors de l'ajout`
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const count = candidateIds.length
  const missionLabel = (m: MissionOption) =>
    m.client?.name ? `${m.title} — ${m.client.name}` : m.title

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Ajouter à une mission
          </DialogTitle>
          <DialogDescription>
            {count === 1
              ? 'Choisissez la mission à laquelle associer ce candidat.'
              : `Choisissez la mission à laquelle associer les ${count} candidats sélectionnés.`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mission">Mission</Label>
            {loadingMissions ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement des missions...
              </div>
            ) : (
              <Select
                value={selectedMissionId}
                onValueChange={setSelectedMissionId}
                disabled={missions.length === 0}
              >
                <SelectTrigger id="mission" aria-label="Choisir une mission">
                  <SelectValue placeholder="Sélectionner une mission" />
                </SelectTrigger>
                <SelectContent>
                  {missions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {missionLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!loadingMissions && missions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aucune mission disponible. Créez une mission d’abord.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={submitting || !selectedMissionId || loadingMissions}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout...
                </>
              ) : (
                'Ajouter'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
