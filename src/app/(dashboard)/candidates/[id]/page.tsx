import { notFound } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  FileText,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getCandidate } from '@/lib/actions/candidates'
import { CandidateTagsEditor } from '@/components/candidates/tags-editor'
import { CandidateStatusBadge } from '@/components/candidates/status-badge'
import { AddToMissionButton } from '@/components/candidates/add-to-mission-button'
import { InteractionsList } from '@/components/candidates/interactions-list'
import { EnrichmentPanel } from '@/components/candidates/enrichment-panel'
import type { PipelineStage } from '@/generated/prisma'

interface CandidateDetailPageProps {
  params: Promise<{ id: string }>
}

const stageLabels: Record<PipelineStage, string> = {
  SOURCED: 'Sourcé',
  CONTACTED: 'Contacté',
  RESPONSE: 'Réponse',
  INTERVIEW: 'Entretien',
  SHORTLIST: 'Shortlist',
  OFFER: 'Offre',
  PLACED: 'Placé',
}

export default async function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { id } = await params
  
  let candidate
  try {
    candidate = await getCandidate(id)
  } catch {
    notFound()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/candidates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">
                {candidate.firstName} {candidate.lastName}
              </h1>
              <CandidateStatusBadge 
                candidateId={candidate.id} 
                status={candidate.status} 
              />
            </div>
            <div className="flex items-center gap-4 mt-2 text-muted-foreground">
              {candidate.currentPosition && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {candidate.currentPosition}
                </span>
              )}
              {candidate.currentCompany && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {candidate.currentCompany}
                </span>
              )}
              {candidate.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {candidate.location}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <AddToMissionButton candidateId={candidate.id} />
          <Button variant="outline" asChild>
            <Link href={`/candidates/${candidate.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Télécharger CV
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MessageSquare className="mr-2 h-4 w-4" />
                Ajouter une note
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {candidate.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${candidate.email}`} className="hover:underline">
                      {candidate.email}
                    </a>
                  </div>
                )}
                {candidate.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${candidate.phone}`} className="hover:underline">
                      {candidate.phone}
                    </a>
                  </div>
                )}
              </div>
              {candidate.profileUrl && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={candidate.profileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {candidate.profileUrl}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          {candidate.comments && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{candidate.comments}</p>
              </CardContent>
            </Card>
          )}

          {/* Missions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Missions
              </CardTitle>
              <CardDescription>
                {candidate.missionCandidates.length} mission{candidate.missionCandidates.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {candidate.missionCandidates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ce candidat n&apos;est dans aucune mission
                </p>
              ) : (
                <div className="space-y-3">
                  {candidate.missionCandidates.map((mc) => (
                    <Link
                      key={mc.id}
                      href={`/missions/${mc.missionId}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{mc.mission.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {mc.mission.client.name}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {stageLabels[mc.stage]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interactions */}
          <InteractionsList 
            candidateId={candidate.id} 
            interactions={candidate.interactions} 
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrichment */}
          <EnrichmentPanel 
            enrichment={candidate.enrichment} 
            candidateId={candidate.id}
          />

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <CandidateTagsEditor 
                candidateId={candidate.id} 
                tags={candidate.tags} 
              />
            </CardContent>
          </Card>

          {/* Pools */}
          <Card>
            <CardHeader>
              <CardTitle>Pools</CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.poolMemberships.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ce candidat n&apos;est dans aucun pool
                </p>
              ) : (
                <div className="space-y-2">
                  {candidate.poolMemberships.map((pm) => (
                    <Link
                      key={pm.id}
                      href={`/pools/${pm.poolId}`}
                      className="block p-2 rounded hover:bg-muted/50"
                    >
                      {pm.pool.name}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé le</span>
                <span>{new Date(candidate.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mis à jour</span>
                <span>{new Date(candidate.updatedAt).toLocaleDateString('fr-FR')}</span>
              </div>
              {candidate.consentGiven && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consentement</span>
                  <span className="text-green-600">Donné</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

