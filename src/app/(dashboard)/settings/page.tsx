'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Building2, Shield, Clock, ListChecks, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success('Parametres enregistres')
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parametres</h1>
        <p className="text-muted-foreground">
          Configurez votre organisation
        </p>
      </div>

      {/* PRD v2: Billing and Extension out of scope - cards hidden */}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organisation
            </CardTitle>
            <CardDescription>
              Informations de base de votre cabinet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Nom de l&apos;organisation</Label>
              <Input
                id="orgName"
                placeholder="Mon Cabinet de Recrutement"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email de contact candidat</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="recrutement@exemple.com"
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Champs et listes (domaines, secteurs, etc.) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Champs et listes
            </CardTitle>
            <CardDescription>
              Configurez les listes utilisées dans l&apos;application : domaines, secteurs, familles de métiers, catégories clients, types de contrat, séniorités.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings/organization">
              <Button variant="outline" className="w-full sm:w-auto justify-between gap-2">
                Configurer les champs
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* PRD v2: Calendly out of scope */}

        {/* Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Rétention des données
            </CardTitle>
            <CardDescription>
              Conformité RGPD
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="retentionIgnored">Candidats ignorés (jours)</Label>
                <Input
                  id="retentionIgnored"
                  type="number"
                  defaultValue={90}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retentionActive">Candidats actifs (jours)</Label>
                <Input
                  id="retentionActive"
                  type="number"
                  defaultValue={365}
                  disabled={loading}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Les candidats seront automatiquement anonymisés après cette période
            </p>
          </CardContent>
        </Card>

        {/* PRD v2: Chrome Extension out of scope */}

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Paramètres de sécurité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Expiration des liens candidat</p>
                <p className="text-sm text-muted-foreground">7 jours</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Expiration des liens client</p>
                <p className="text-sm text-muted-foreground">30 jours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Enregistrer les paramètres'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

