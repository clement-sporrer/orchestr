'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteClient } from '@/lib/actions/clients'
import { toast } from 'sonner'

interface DeleteClientDialogProps {
  clientId: string
  clientName: string
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DeleteClientDialog({ clientId, clientName, children, open: controlledOpen, onOpenChange }: DeleteClientDialogProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const handleDelete = async () => {
    setLoading(true)

    try {
      await deleteClient(clientId)
      toast.success('Client supprimé')
      router.push('/clients')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {children && (
        <AlertDialogTrigger asChild>
          {children}
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>Supprimer le client</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-2">
            Êtes-vous sûr de vouloir supprimer <strong>{clientName}</strong>?
            <br /><br />
            Cette action supprimera également:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Tous les contacts associés</li>
              <li>Toutes les missions du client</li>
              <li>Tous les candidats dans le pipeline de ces missions</li>
            </ul>
            <br />
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              'Supprimer définitivement'
            )}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

