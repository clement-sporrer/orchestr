'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, UserPlus, Database, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCandidates, type CandidateWithCount } from '@/lib/actions/candidates'
import { addCandidateToMission } from '@/lib/actions/pipeline'
import { toast } from 'sonner'
import type { Mission, MissionCandidate, Candidate } from '@/generated/prisma'

interface MissionWithCandidates extends Mission {
  missionCandidates: (MissionCandidate & {
    candidate: Candidate
  })[]
}

interface MissionSourcingViewProps {
  mission: MissionWithCandidates
  /** After adding a candidate, invalidate lazy pipeline cache on mission detail */
  onPipelineChanged?: () => void
}

export function MissionSourcingView({ mission, onPipelineChanged }: MissionSourcingViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<CandidateWithCount[]>([])
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) {
      toast.error('Entrez un terme de recherche')
      return
    }
    setSearching(true)
    try {
      const res = await getCandidates({
        search: q,
        limit: 25,
        excludeMissionId: mission.id,
      })
      setResults(res.candidates)
      if (res.candidates.length === 0) {
        toast.info('Aucun candidat trouvé (hors ceux déjà dans la mission)')
      }
    } catch {
      toast.error('Erreur lors de la recherche')
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleAddToMission = async (candidateId: string) => {
    setAddingId(candidateId)
    try {
      await addCandidateToMission(mission.id, candidateId)
      toast.success('Candidat ajouté à la mission')
      onPipelineChanged?.()
      setResults((prev) => prev.filter((c) => c.id !== candidateId))
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('déjà dans cette mission')) {
        toast.warning('Ce candidat est déjà dans cette mission')
        setResults((prev) => prev.filter((c) => c.id !== candidateId))
      } else {
        toast.error(msg || 'Erreur lors de l\'ajout')
      }
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="opacity-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Chercher dans le vivier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Trouvez des candidats déjà dans votre base (formulaire ci-dessous)
            </CardDescription>
          </CardContent>
        </Card>

        <Link href={`/candidates/new?missionId=${mission.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Créer un candidat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Ajouter manuellement un profil
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rechercher dans le vivier</CardTitle>
          <CardDescription>
            Trouvez des candidats existants à ajouter à cette mission (les candidats déjà dans la mission sont exclus)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, entreprise, poste..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                disabled={searching}
                aria-label="Recherche vivier"
              />
            </div>
            <Button type="submit" disabled={searching}>
              {searching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recherche...
                </>
              ) : (
                'Rechercher'
              )}
            </Button>
          </form>

          {results.length > 0 ? (
            <div className="rounded-md border">
              <div className="divide-y">
                {results.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="flex items-center justify-between gap-4 p-3 hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {candidate.firstName} {candidate.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {candidate.currentPosition || candidate.currentCompany
                          ? `${candidate.currentPosition || ''}${candidate.currentCompany ? ` @ ${candidate.currentCompany}` : ''}`
                          : candidate.email || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        disabled={addingId === candidate.id}
                        onClick={() => handleAddToMission(candidate.id)}
                      >
                        {addingId === candidate.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter à la mission
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/candidates/${candidate.id}`} target="_blank" rel="noopener noreferrer">
                          Voir
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {searching
                  ? 'Recherche en cours...'
                  : 'Entrez un terme de recherche puis cliquez sur Rechercher pour trouver des candidats à ajouter.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {mission.missionCandidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Récemment ajoutés à cette mission</CardTitle>
            <CardDescription>
              Les derniers candidats sourcés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mission.missionCandidates.slice(0, 5).map((mc) => (
                <div
                  key={mc.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">
                      {mc.candidate.firstName} {mc.candidate.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mc.candidate.currentPosition} {mc.candidate.currentCompany && `@ ${mc.candidate.currentCompany}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
