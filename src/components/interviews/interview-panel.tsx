'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  Plus,
  FileText,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Interview, InterviewType, InterviewStatus } from '@/generated/prisma'

interface InterviewPanelProps {
  missionCandidateId: string
  interviews: Interview[]
  candidateName: string
  onUpdate?: () => void
}

const statusColors: Record<InterviewStatus, string> = {
  SCHEDULED: 'bg-blue-500/10 text-blue-600 border-blue-200',
  CONFIRMED: 'bg-green-500/10 text-green-600 border-green-200',
  COMPLETED: 'bg-gray-500/10 text-gray-600 border-gray-200',
  CANCELLED: 'bg-red-500/10 text-red-600 border-red-200',
  NO_SHOW: 'bg-orange-500/10 text-orange-600 border-orange-200',
}

const typeIcons: Record<InterviewType, typeof Phone> = {
  PHONE_SCREEN: Phone,
  VIDEO_RECRUITER: Video,
  VIDEO_CLIENT: Video,
  ONSITE: MapPin,
}

export function InterviewPanel({ 
  missionCandidateId, 
  interviews, 
  candidateName,
  onUpdate 
}: InterviewPanelProps) {
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  // New interview form state
  const [newInterview, setNewInterview] = useState({
    type: 'VIDEO_RECRUITER' as InterviewType,
    scheduledAt: '',
    duration: 45,
    meetingUrl: '',
    location: '',
  })

  const handleCreate = async () => {
    if (!newInterview.scheduledAt) {
      toast.error('Veuillez selectionner une date')
      return
    }

    setCreating(true)
    try {
      await createInterview({
        missionCandidateId,
        type: newInterview.type,
        scheduledAt: new Date(newInterview.scheduledAt),
        duration: newInterview.duration,
        meetingUrl: newInterview.meetingUrl || undefined,
        location: newInterview.location || undefined,
      })
      toast.success('Entretien planifie')
      setShowNewDialog(false)
      setNewInterview({
        type: 'VIDEO_RECRUITER',
        scheduledAt: '',
        duration: 45,
        meetingUrl: '',
        location: '',
      })
      onUpdate?.()
    } catch {
      toast.error('Erreur lors de la creation')
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (id: string, status: InterviewStatus) => {
    try {
      await updateInterviewStatus(id, status)
      toast.success('Statut mis a jour')
      onUpdate?.()
    } catch {
      toast.error('Erreur lors de la mise a jour')
    }
  }

  const handleSaveNotes = async (id: string) => {
    setSavingNotes(true)
    try {
      await saveInterviewNotes(id, notes)
      toast.success('Notes enregistrees')
      setEditingNotes(null)
      onUpdate?.()
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Entretiens
            </CardTitle>
            <CardDescription>
              {interviews.length} entretien{interviews.length !== 1 ? 's' : ''} pour {candidateName}
            </CardDescription>
          </div>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Planifier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Planifier un entretien</DialogTitle>
                <DialogDescription>
                  Planifiez un entretien avec {candidateName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Type d&apos;entretien</Label>
                  <Select
                    value={newInterview.type}
                    onValueChange={(value) => setNewInterview({ ...newInterview, type: value as InterviewType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(interviewTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date et heure</Label>
                  <Input
                    type="datetime-local"
                    value={newInterview.scheduledAt}
                    onChange={(e) => setNewInterview({ ...newInterview, scheduledAt: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duree (minutes)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={240}
                    value={newInterview.duration}
                    onChange={(e) => setNewInterview({ ...newInterview, duration: parseInt(e.target.value) })}
                  />
                </div>
                {(newInterview.type === 'VIDEO_RECRUITER' || newInterview.type === 'VIDEO_CLIENT') && (
                  <div className="space-y-2">
                    <Label>Lien visio (optionnel)</Label>
                    <Input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={newInterview.meetingUrl}
                      onChange={(e) => setNewInterview({ ...newInterview, meetingUrl: e.target.value })}
                    />
                  </div>
                )}
                {newInterview.type === 'ONSITE' && (
                  <div className="space-y-2">
                    <Label>Lieu</Label>
                    <Input
                      placeholder="Adresse du rendez-vous"
                      value={newInterview.location}
                      onChange={(e) => setNewInterview({ ...newInterview, location: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Planifier
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {interviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun entretien planifie
          </p>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => {
              const Icon = typeIcons[interview.type]
              const isPast = new Date(interview.scheduledAt) < new Date()
              
              return (
                <div 
                  key={interview.id} 
                  className={cn(
                    "p-4 rounded-lg border",
                    isPast && interview.status === 'SCHEDULED' && "border-orange-200 bg-orange-50/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {interviewTypeLabels[interview.type]}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(interview.scheduledAt).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          <Clock className="h-3 w-3 ml-2" />
                          {interview.duration} min
                        </div>
                        {interview.meetingUrl && (
                          <a 
                            href={interview.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Rejoindre la visio
                          </a>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[interview.status]}>
                      {interviewStatusLabels[interview.status]}
                    </Badge>
                  </div>

                  {/* Action buttons */}
                  {interview.status === 'SCHEDULED' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(interview.id, 'CONFIRMED')}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Confirmer
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(interview.id, 'COMPLETED')}
                      >
                        Marquer termine
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleStatusChange(interview.id, 'CANCELLED')}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Annuler
                      </Button>
                    </div>
                  )}

                  {interview.status === 'CONFIRMED' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleStatusChange(interview.id, 'COMPLETED')}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Marquer termine
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(interview.id, 'NO_SHOW')}
                      >
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Absent
                      </Button>
                    </div>
                  )}

                  {/* Notes section for completed interviews */}
                  {interview.status === 'COMPLETED' && (
                    <div className="mt-3 pt-3 border-t">
                      {editingNotes === interview.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notes de l'entretien..."
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleSaveNotes(interview.id)}
                              disabled={savingNotes}
                            >
                              {savingNotes && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              Enregistrer
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => setEditingNotes(null)}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {interview.recruiterNotes ? (
                            <div className="space-y-2">
                              <p className="text-sm whitespace-pre-wrap">{interview.recruiterNotes}</p>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setNotes(interview.recruiterNotes || '')
                                  setEditingNotes(interview.id)
                                }}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Modifier notes
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setNotes('')
                                setEditingNotes(interview.id)
                              }}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Ajouter des notes
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}





