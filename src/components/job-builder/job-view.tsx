'use client'

import { useState } from 'react'
import { Eye, Users, Building2, UserCircle, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MapPin, Briefcase, Calendar, DollarSign, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { Mission } from '@/generated/prisma'

interface JobViewProps {
  mission: Mission
}

type Audience = 'internal' | 'client' | 'candidate'

const contractLabels: Record<string, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  FREELANCE: 'Freelance',
  INTERNSHIP: 'Stage',
  APPRENTICESHIP: 'Alternance',
  OTHER: 'Autre',
}

const seniorityLabels: Record<string, string> = {
  JUNIOR: 'Junior',
  MID: 'Confirmé',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
}

function isVisible(visibility: string, audience: Audience): boolean {
  switch (visibility) {
    case 'INTERNAL':
      return audience === 'internal'
    case 'INTERNAL_CLIENT':
      return audience === 'internal' || audience === 'client'
    case 'INTERNAL_CANDIDATE':
      return audience === 'internal' || audience === 'candidate'
    case 'ALL':
      return true
    default:
      return false
  }
}

export function JobView({ mission }: JobViewProps) {
  const [audience, setAudience] = useState<Audience>('internal')

  return (
    <div className="space-y-6">
      {/* Audience Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={audience === 'internal' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAudience('internal')}
          >
            <Users className="mr-2 h-4 w-4" />
            Vue interne
          </Button>
          <Button
            variant={audience === 'client' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAudience('client')}
          >
            <Building2 className="mr-2 h-4 w-4" />
            Vue client
          </Button>
          <Button
            variant={audience === 'candidate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAudience('candidate')}
          >
            <UserCircle className="mr-2 h-4 w-4" />
            Vue candidat
          </Button>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/missions/${mission.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </Link>
        </Button>
      </div>

      {/* Job Post Content */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold">{mission.title}</h2>
            <div className="flex flex-wrap gap-3 mt-3">
              {mission.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {mission.location}
                </Badge>
              )}
              {mission.contractType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {contractLabels[mission.contractType] || mission.contractType}
                </Badge>
              )}
              {mission.seniority && (
                <Badge variant="secondary">
                  {seniorityLabels[mission.seniority] || mission.seniority}
                </Badge>
              )}
              {mission.salaryVisible && mission.salaryMin && mission.salaryMax && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {mission.salaryMin}€ - {mission.salaryMax}€
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Context */}
          {mission.context && isVisible(mission.contextVisibility, audience) && (
            <div>
              <h3 className="font-semibold mb-2">Contexte</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{mission.context}</p>
            </div>
          )}

          {/* Responsibilities */}
          {mission.responsibilities && isVisible(mission.responsibilitiesVisibility, audience) && (
            <div>
              <h3 className="font-semibold mb-2">Responsabilités</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{mission.responsibilities}</p>
            </div>
          )}

          {/* Must Have */}
          {mission.mustHave && isVisible(mission.mustHaveVisibility, audience) && (
            <div>
              <h3 className="font-semibold mb-2">Compétences requises</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{mission.mustHave}</p>
            </div>
          )}

          {/* Nice to Have */}
          {mission.niceToHave && isVisible(mission.niceToHaveVisibility, audience) && (
            <div>
              <h3 className="font-semibold mb-2">Compétences appréciées</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{mission.niceToHave}</p>
            </div>
          )}

          {/* Red Flags - Internal Only */}
          {mission.redFlags && audience === 'internal' && (
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Red Flags (Interne)
              </h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{mission.redFlags}</p>
            </div>
          )}

          {/* Process */}
          {mission.process && isVisible(mission.processVisibility, audience) && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Processus de recrutement
              </h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{mission.process}</p>
            </div>
          )}

          {/* CTA for candidate view */}
          {audience === 'candidate' && (
            <div className="pt-4">
              <Button size="lg" className="w-full">
                Postuler à cette offre
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

