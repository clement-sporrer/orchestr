'use client'

import { useState } from 'react'
import { Trash2, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

interface BulkActionBarProps {
  selectedCount: number
  onClearSelection: () => void
  onDelete: () => void | Promise<void>
  isDeleting?: boolean
  entityLabel?: string
  className?: string
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onDelete,
  isDeleting = false,
  entityLabel = 'élément',
  className,
}: BulkActionBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (selectedCount === 0) return null

  const label = selectedCount === 1 ? entityLabel : `${entityLabel}s`

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete()
      setConfirmOpen(false)
      onClearSelection()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border bg-muted/50 px-4 py-3',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="text-sm font-medium">
        {selectedCount} {label} sélectionné{selectedCount > 1 ? 's' : ''}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          disabled={isDeleting || deleting}
        >
          <X className="h-4 w-4 mr-1" />
          Tout désélectionner
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isDeleting || deleting}
          onClick={() => setConfirmOpen(true)}
        >
          {isDeleting || deleting ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Suppression...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-1" />
              Supprimer
            </>
          )}
        </Button>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer {selectedCount} {label} ? Cette action est irréversible pour les clients et missions. Les candidats seront marqués comme supprimés (soft delete).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
