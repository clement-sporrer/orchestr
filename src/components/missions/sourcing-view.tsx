'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Upload, UserPlus, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Mission, MissionCandidate, Candidate } from '@/generated/prisma'

interface MissionWithCandidates extends Mission {
  missionCandidates: (MissionCandidate & {
    candidate: Candidate
  })[]
}

interface MissionSourcingViewProps {
  mission: MissionWithCandidates
}

export function MissionSourcingView({ mission }: MissionSourcingViewProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Chercher dans le vivier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Trouvez des candidats déjà dans votre base
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

        <Link href={`/import?missionId=${mission.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Importer CSV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Importer des candidats depuis un fichier
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Search in Database */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher dans le vivier</CardTitle>
          <CardDescription>
            Trouvez des candidats existants à ajouter à cette mission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email, entreprise, compétences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>Rechercher</Button>
          </div>

          {/* Results would go here */}
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Entrez un terme de recherche pour trouver des candidats</p>
          </div>
        </CardContent>
      </Card>

      {/* Recently Added to This Mission */}
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
                  {mc.score && (
                    <div className="text-right">
                      <p className="font-bold text-lg">{mc.score}%</p>
                      <p className="text-xs text-muted-foreground">Score</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

