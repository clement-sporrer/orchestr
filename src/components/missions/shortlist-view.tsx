'use client'

import { useState } from 'react'
import { Plus, FileText, ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Mission, Shortlist } from '@/generated/prisma'

interface MissionWithShortlists extends Mission {
  shortlists: Shortlist[]
}

interface MissionShortlistViewProps {
  mission: MissionWithShortlists
}

export function MissionShortlistView({ mission }: MissionShortlistViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyLink = async (shortlist: Shortlist) => {
    const link = shortlist.clientPortalUrl ?? ''
    if (!link) {
      toast.error('URL non disponible')
      return
    }
    await navigator.clipboard.writeText(link)
    setCopiedId(shortlist.id)
    toast.success('Lien copié')
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Create Shortlist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shortlists</CardTitle>
              <CardDescription>
                Créez et partagez des shortlists avec vos clients
              </CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle shortlist
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {mission.shortlists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune shortlist créée</p>
              <p className="text-sm mt-1">
                Créez une shortlist pour partager des candidats avec votre client
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mission.shortlists.map((shortlist) => (
                <div 
                  key={shortlist.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{shortlist.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Créée le {new Date(shortlist.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyLink(shortlist)}
                    >
                      {copiedId === shortlist.id ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copié
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copier le lien
                        </>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" asChild disabled={!shortlist.clientPortalUrl}>
                      <a
                        href={shortlist.clientPortalUrl ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Prévisualiser
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Exports</CardTitle>
          <CardDescription>
            Téléchargez les données de cette mission
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Exporter CSV
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Dossier PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}





