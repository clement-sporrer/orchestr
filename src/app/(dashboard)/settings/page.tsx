'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { Loader2, Building2, Link, Shield, Clock, CreditCard, ChevronRight, Linkedin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

        {/* LinkedIn Extension */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-[#0077B5]" />
              Extension Chrome LinkedIn
            </CardTitle>
            <CardDescription>
              Installez l&apos;extension Chrome pour capturer facilement les profils LinkedIn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Linkedin className="h-4 w-4" />
              <AlertDescription>
                L&apos;extension Chrome est la méthode recommandée pour enrichir les profils LinkedIn.
                Elle fonctionne directement depuis votre navigateur, sans connexion OAuth complexe.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">Avantages de l&apos;extension :</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>✅ 100% gratuit - Pas de connexion OAuth nécessaire</li>
                <li>✅ Capture instantanée depuis n&apos;importe quelle page LinkedIn</li>
                <li>✅ Extraction complète : expériences, compétences, formation</li>
                <li>✅ Ajout direct à une mission avec scoring automatique</li>
                <li>✅ Détection automatique des doublons</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm font-medium mb-2">📥 Installation :</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Téléchargez l&apos;extension depuis le dépôt GitHub</li>
                <li>Ouvrez Chrome et allez dans Extensions → Mode développeur</li>
                <li>Chargez le dossier <code className="bg-muted px-1 rounded">chrome-extension</code></li>
                <li>Configurez l&apos;URL de l&apos;API et votre clé dans les paramètres</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-3">
                📖 Consultez le guide complet d&apos;installation dans <code className="bg-muted px-1 rounded">chrome-extension/INSTALLATION.md</code>
              </p>
            </div>

            <NextLink href="/settings/extension" className="block">
              <Button
                type="button"
                className="w-full bg-[#0077B5] hover:bg-[#006399]"
              >
                <Linkedin className="mr-2 h-4 w-4" />
                Voir le guide d&apos;installation complet
              </Button>
            </NextLink>
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

