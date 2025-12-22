'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createContact, updateContact, deleteContact } from '@/lib/actions/clients'
import { toast } from 'sonner'

interface Contact {
  id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  notes: string | null
}

interface ContactDialogProps {
  clientId: string
  contact?: Contact
  children: React.ReactNode
}

export function ContactDialog({ clientId, contact, children }: ContactDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isEdit = !!contact

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      role: formData.get('role') as string || undefined,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    }

    try {
      if (isEdit) {
        await updateContact(contact.id, data)
        toast.success('Contact mis à jour')
      } else {
        await createContact(clientId, data)
        toast.success('Contact ajouté')
      }
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!contact) return
    setDeleting(true)

    try {
      await deleteContact(contact.id)
      toast.success('Contact supprimé')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le contact' : 'Nouveau contact'}</DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Modifiez les informations du contact'
              : 'Ajoutez un nouveau contact pour ce client'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={contact?.name}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Fonction</Label>
            <Input
              id="role"
              name="role"
              placeholder="Ex: DRH, Hiring Manager..."
              defaultValue={contact?.role || ''}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={contact?.email || ''}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={contact?.phone || ''}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={contact?.notes || ''}
              disabled={loading}
            />
          </div>

          <div className="flex justify-between pt-4">
            {isEdit ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading || deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  'Supprimer'
                )}
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={loading || deleting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading || deleting}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEdit ? 'Mise à jour...' : 'Création...'}
                  </>
                ) : (
                  isEdit ? 'Mettre à jour' : 'Ajouter'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

