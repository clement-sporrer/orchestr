'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { Loader2, Building2, Link, Shield, Clock, CreditCard, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

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

      {/* Billing Link */}
      <NextLink href="/settings/billing">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Facturation</p>
                <p className="text-sm text-muted-foreground">
                  Gerez votre abonnement et vos moyens de paiement
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </NextLink>

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

        {/* Calendly */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Calendly
            </CardTitle>
            <CardDescription>
              Configuration par défaut pour les missions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCalendly">Lien Calendly par défaut</Label>
              <Input
                id="defaultCalendly"
                placeholder="https://calendly.com/votre-lien"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Ce lien sera utilisé par défaut pour les nouvelles missions
              </p>
            </div>
          </CardContent>
        </Card>

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

