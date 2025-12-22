'use client'

import { useState } from 'react'
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Calendar, 
  FileText,
  Plus,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { addInteraction } from '@/lib/actions/candidates'
import { toast } from 'sonner'
import type { Interaction, InteractionType } from '@/generated/prisma'

interface InteractionsListProps {
  candidateId: string
  interactions: Interaction[]
}

const interactionIcons: Record<InteractionType, React.ReactNode> = {
  MESSAGE: <MessageSquare className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  CALL: <Phone className="h-4 w-4" />,
  INTERVIEW_SCHEDULED: <Calendar className="h-4 w-4" />,
  INTERVIEW_DONE: <Calendar className="h-4 w-4" />,
  NOTE: <FileText className="h-4 w-4" />,
  PORTAL_COMPLETED: <FileText className="h-4 w-4" />,
  CLIENT_FEEDBACK: <MessageSquare className="h-4 w-4" />,
  STATUS_CHANGE: <FileText className="h-4 w-4" />,
}

const interactionLabels: Record<InteractionType, string> = {
  MESSAGE: 'Message',
  EMAIL: 'Email',
  CALL: 'Appel',
  INTERVIEW_SCHEDULED: 'Entretien planifié',
  INTERVIEW_DONE: 'Entretien réalisé',
  NOTE: 'Note',
  PORTAL_COMPLETED: 'Portail complété',
  CLIENT_FEEDBACK: 'Feedback client',
  STATUS_CHANGE: 'Changement de statut',
}

export function InteractionsList({ candidateId, interactions }: InteractionsListProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<InteractionType>('NOTE')
  const [content, setContent] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    try {
      await addInteraction(candidateId, {
        type: type as 'MESSAGE' | 'EMAIL' | 'CALL' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_DONE' | 'NOTE',
        content: content.trim(),
      })
      toast.success('Interaction ajoutée')
      setContent('')
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Historique
          </CardTitle>
          <CardDescription>
            {interactions.length} interaction{interactions.length !== 1 ? 's' : ''}
          </CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle interaction</DialogTitle>
              <DialogDescription>
                Ajoutez une note ou un événement
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select 
                value={type} 
                onValueChange={(v) => setType(v as InteractionType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOTE">Note</SelectItem>
                  <SelectItem value="MESSAGE">Message</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="CALL">Appel</SelectItem>
                  <SelectItem value="INTERVIEW_DONE">Entretien réalisé</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Contenu..."
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={loading || !content.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ajout...
                    </>
                  ) : (
                    'Ajouter'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {interactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune interaction
          </p>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="flex gap-3">
                <div className="p-2 rounded-full bg-muted h-fit">
                  {interactionIcons[interaction.type]}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {interactionLabels[interaction.type]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(interaction.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {interaction.content && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {interaction.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

