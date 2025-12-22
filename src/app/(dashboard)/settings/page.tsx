'use client'

import { useState, useEffect } from 'react'
import NextLink from 'next/link'
import { Loader2, Building2, Link, Shield, Clock, CreditCard, ChevronRight, Linkedin, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface LinkedInStatus {
  connected: boolean
  riskLevel?: string | null
  requestCount?: number
  lastUsed?: Date | null
  blockedUntil?: Date | null
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [linkedInStatus, setLinkedInStatus] = useState<LinkedInStatus | null>(null)
  const [linkedInLoading, setLinkedInLoading] = useState(false)

  // Charger le statut LinkedIn
  useEffect(() => {
    loadLinkedInStatus()
  }, [])

  const loadLinkedInStatus = async () => {
    try {
      const response = await fetch('/api/settings/linkedin/status')
      if (response.ok) {
        const data = await response.json()
        setLinkedInStatus(data)
      }
    } catch (error) {
      console.error('Error loading LinkedIn status:', error)
    }
  }

  const handleConnectLinkedIn = async () => {
    setLinkedInLoading(true)
    try {
      window.location.href = '/api/auth/linkedin/connect'
    } catch (error) {
      toast.error('Erreur lors de la connexion LinkedIn')
      setLinkedInLoading(false)
    }
  }

  const handleDisconnectLinkedIn = async () => {
    setLinkedInLoading(true)
    try {
      const response = await fetch('/api/settings/linkedin/disconnect', {
        method: 'POST',
      })
      if (response.ok) {
        toast.success('Compte LinkedIn déconnecté')
        await loadLinkedInStatus()
      } else {
        toast.error('Erreur lors de la déconnexion')
      }
    } catch (error) {
      toast.error('Erreur lors de la déconnexion LinkedIn')
    } finally {
      setLinkedInLoading(false)
    }
  }

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

        {/* LinkedIn Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-[#0077B5]" />
              Intégration LinkedIn
            </CardTitle>
            <CardDescription>
              Connectez votre compte LinkedIn pour enrichir automatiquement les profils candidats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {linkedInStatus?.connected ? (
              <>
                <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-600">Compte LinkedIn connecté</p>
                      <p className="text-sm text-muted-foreground">
                        Votre compte est prêt pour l&apos;enrichissement automatique
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    Actif
                  </Badge>
                </div>

                {linkedInStatus.riskLevel && linkedInStatus.riskLevel !== 'low' && (
                  <Alert className={linkedInStatus.riskLevel === 'blocked' ? 'border-red-500/50 bg-red-500/10' : 'border-amber-500/50 bg-amber-500/10'}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {linkedInStatus.riskLevel === 'blocked' ? (
                        <>
                          <strong>Compte temporairement bloqué</strong>
                          {linkedInStatus.blockedUntil && (
                            <p className="text-xs mt-1">
                              Déblocage prévu : {new Date(linkedInStatus.blockedUntil).toLocaleString('fr-FR')}
                            </p>
                          )}
                          <p className="text-xs mt-1">
                            LinkedIn a détecté une activité suspecte. Le compte sera automatiquement débloqué après la période de blocage.
                          </p>
                        </>
                      ) : (
                        <>
                          <strong>Niveau de risque : {linkedInStatus.riskLevel}</strong>
                          <p className="text-xs mt-1">
                            Le système surveille automatiquement l&apos;utilisation pour protéger votre compte.
                          </p>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requêtes cette heure</p>
                    <p className="font-medium">{linkedInStatus.requestCount || 0} / 30</p>
                  </div>
                  {linkedInStatus.lastUsed && (
                    <div>
                      <p className="text-muted-foreground">Dernière utilisation</p>
                      <p className="font-medium">
                        {new Date(linkedInStatus.lastUsed).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Limites de sécurité</p>
                    <p className="text-sm text-muted-foreground">
                      30 requêtes/heure maximum • 3 secondes entre chaque requête
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDisconnectLinkedIn}
                    disabled={linkedInLoading}
                  >
                    {linkedInLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Déconnexion...
                      </>
                    ) : (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        Déconnecter
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Alert>
                  <Linkedin className="h-4 w-4" />
                  <AlertDescription>
                    Connectez votre compte LinkedIn pour activer l&apos;enrichissement automatique des profils.
                    Le système utilisera votre session authentifiée pour extraire les données de manière sécurisée.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Avantages :</p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Enrichissement automatique depuis une URL LinkedIn</li>
                    <li>Extraction des expériences, compétences, formation</li>
                    <li>Génération automatique de tags par IA</li>
                    <li>Protection de votre compte avec limites de sécurité</li>
                  </ul>
                </div>

                <Button
                  type="button"
                  onClick={handleConnectLinkedIn}
                  disabled={linkedInLoading}
                  className="w-full bg-[#0077B5] hover:bg-[#006399]"
                >
                  {linkedInLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <Linkedin className="mr-2 h-4 w-4" />
                      Connecter mon compte LinkedIn
                    </>
                  )}
                </Button>
              </>
            )}
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

