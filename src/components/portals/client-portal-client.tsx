'use client'

import { useState } from 'react'
import { User, MapPin, Briefcase, ThumbsUp, ThumbsDown, HelpCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { submitClientFeedback } from '@/lib/actions/shortlist'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Shortlist, ShortlistCandidate, MissionCandidate, Candidate, ClientFeedback, Mission, Client, FeedbackDecision } from '@/generated/prisma'

interface ShortlistWithDetails extends Shortlist {
  mission: Mission & { client: Client }
  candidates: (ShortlistCandidate & {
    missionCandidate: MissionCandidate & { candidate: Candidate }
    feedback: ClientFeedback | null
  })[]
}

interface ClientPortalClientProps {
  shortlist: ShortlistWithDetails
}

export function ClientPortalClient({ shortlist }: ClientPortalClientProps) {
  const [feedbackStates, setFeedbackStates] = useState<Record<string, {
    decision?: FeedbackDecision
    comment: string
    loading: boolean
    submitted: boolean
  }>>(
    shortlist.candidates.reduce((acc, sc) => ({
      ...acc,
      [sc.id]: {
        decision: sc.feedback?.decision,
        comment: sc.feedback?.comment || '',
        loading: false,
        submitted: !!sc.feedback,
      },
    }), {})
  )

  const handleFeedback = async (shortlistCandidateId: string, decision: FeedbackDecision) => {
    const state = feedbackStates[shortlistCandidateId]
    
    setFeedbackStates((prev) => ({
      ...prev,
      [shortlistCandidateId]: { ...state, decision, loading: true },
    }))

    try {
      await submitClientFeedback(shortlistCandidateId, {
        decision,
        comment: state.comment,
      })
      setFeedbackStates((prev) => ({
        ...prev,
        [shortlistCandidateId]: { ...prev[shortlistCandidateId], loading: false, submitted: true },
      }))
      toast.success('Feedback enregistré')
    } catch (err) {
      toast.error('Erreur lors de l\'envoi')
      setFeedbackStates((prev) => ({
        ...prev,
        [shortlistCandidateId]: { ...prev[shortlistCandidateId], loading: false },
      }))
    }
  }

  const pendingCount = shortlist.candidates.filter((sc) => !feedbackStates[sc.id]?.submitted).length
  const completedCount = shortlist.candidates.filter((sc) => feedbackStates[sc.id]?.submitted).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <span className="text-xl font-bold text-primary">ORCHESTR</span>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {completedCount}/{shortlist.candidates.length} évalués
            </Badge>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8 px-4">
        {/* Mission Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{shortlist.mission.title}</CardTitle>
            <CardDescription>
              Shortlist: {shortlist.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Veuillez évaluer chaque candidat. Votre feedback nous aide à affiner notre recherche.
            </p>
          </CardContent>
        </Card>

        {/* Candidates */}
        <div className="space-y-6">
          {shortlist.candidates.map((sc) => {
            const candidate = sc.missionCandidate.candidate
            const state = feedbackStates[sc.id]

            return (
              <Card key={sc.id} className={cn(
                state.submitted && "border-primary/30 bg-primary/5"
              )}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {candidate.firstName} {candidate.lastName}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {candidate.currentPosition && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {candidate.currentPosition}
                              {candidate.currentCompany && ` @ ${candidate.currentCompany}`}
                            </span>
                          )}
                          {candidate.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {candidate.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {sc.missionCandidate.score && (
                      <Badge variant="secondary" className="text-lg">
                        {sc.missionCandidate.score}%
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Summary */}
                  {sc.summary && (
                    <p className="text-muted-foreground">{sc.summary}</p>
                  )}

                  {/* Tags */}
                  {candidate.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {candidate.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Feedback Section */}
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Commentaire (optionnel)..."
                      value={state.comment}
                      onChange={(e) => setFeedbackStates((prev) => ({
                        ...prev,
                        [sc.id]: { ...prev[sc.id], comment: e.target.value },
                      }))}
                      disabled={state.submitted}
                      rows={2}
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        variant={state.decision === 'OK' ? 'default' : 'outline'}
                        className={cn(
                          "flex-1",
                          state.decision === 'OK' && "bg-green-600 hover:bg-green-700"
                        )}
                        onClick={() => handleFeedback(sc.id, 'OK')}
                        disabled={state.loading || state.submitted}
                      >
                        {state.loading && state.decision === 'OK' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="mr-2 h-4 w-4" />
                        )}
                        OK
                      </Button>
                      <Button
                        variant={state.decision === 'TO_DISCUSS' ? 'default' : 'outline'}
                        className={cn(
                          "flex-1",
                          state.decision === 'TO_DISCUSS' && "bg-yellow-600 hover:bg-yellow-700"
                        )}
                        onClick={() => handleFeedback(sc.id, 'TO_DISCUSS')}
                        disabled={state.loading || state.submitted}
                      >
                        {state.loading && state.decision === 'TO_DISCUSS' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <HelpCircle className="mr-2 h-4 w-4" />
                        )}
                        À creuser
                      </Button>
                      <Button
                        variant={state.decision === 'NO' ? 'default' : 'outline'}
                        className={cn(
                          "flex-1",
                          state.decision === 'NO' && "bg-red-600 hover:bg-red-700"
                        )}
                        onClick={() => handleFeedback(sc.id, 'NO')}
                        disabled={state.loading || state.submitted}
                      >
                        {state.loading && state.decision === 'NO' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsDown className="mr-2 h-4 w-4" />
                        )}
                        Non
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* All done message */}
        {pendingCount === 0 && (
          <Card className="mt-8 border-green-500/30 bg-green-500/5">
            <CardContent className="text-center py-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <ThumbsUp className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold">Merci pour votre feedback!</h2>
              <p className="text-muted-foreground mt-2">
                Notre équipe va analyser vos retours et reviendra vers vous rapidement.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}



