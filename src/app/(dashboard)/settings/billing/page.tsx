'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  getSubscriptionStatus,
  createBillingPortalSession,
  cancelSubscription,
  reactivateSubscription,
} from '@/lib/actions/billing'
import { PLANS, formatPrice, PRICING } from '@/lib/stripe'
import { toast } from 'sonner'
import {
  Loader2,
  CreditCard,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react'

interface SubscriptionData {
  plan: 'CORE' | 'PRO' | 'WHITE_LABEL'
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID'
  billingPeriod: 'MONTHLY' | 'ANNUAL'
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  isActive: boolean
  isTrialing: boolean
  daysUntilTrialEnd: number | null
}

export default function BillingPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      const data = await getSubscriptionStatus()
      setSubscription(data as SubscriptionData)
    } catch (err) {
      console.error('Error loading subscription:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setActionLoading('portal')
    try {
      await createBillingPortalSession()
    } catch (err) {
      toast.error('Erreur lors de l\'ouverture du portail de facturation')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Etes-vous sur de vouloir annuler votre abonnement ? Vous garderez l\'acces jusqu\'a la fin de la periode en cours.')) {
      return
    }

    setActionLoading('cancel')
    try {
      await cancelSubscription()
      toast.success('Abonnement annule. Vous garderez l\'acces jusqu\'a la fin de la periode.')
      loadSubscription()
    } catch (err) {
      toast.error('Erreur lors de l\'annulation')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async () => {
    setActionLoading('reactivate')
    try {
      await reactivateSubscription()
      toast.success('Abonnement reactive !')
      loadSubscription()
    } catch (err) {
      toast.error('Erreur lors de la reactivation')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getStatusBadge = () => {
    if (!subscription) return null

    switch (subscription.status) {
      case 'TRIALING':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Essai gratuit</Badge>
      case 'ACTIVE':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Actif</Badge>
      case 'PAST_DUE':
        return <Badge variant="destructive">Paiement en retard</Badge>
      case 'CANCELED':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Annule</Badge>
      case 'UNPAID':
        return <Badge variant="destructive">Non paye</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Aucun abonnement</CardTitle>
            <CardDescription>
              Vous n&apos;avez pas encore d&apos;abonnement actif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/pricing')}>
              Voir les forfaits
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const plan = PLANS[subscription.plan]
  const pricing = subscription.plan !== 'WHITE_LABEL' 
    ? PRICING[subscription.plan][subscription.billingPeriod.toLowerCase() as 'monthly' | 'annual']
    : null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Facturation</h1>
        <p className="text-muted-foreground">Gerez votre abonnement et vos informations de paiement</p>
      </div>

      {/* Alerts */}
      {subscription.status === 'PAST_DUE' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Votre paiement a echoue. Veuillez mettre a jour vos informations de paiement pour eviter une interruption de service.
          </AlertDescription>
        </Alert>
      )}

      {subscription.isTrialing && subscription.daysUntilTrialEnd !== null && subscription.daysUntilTrialEnd <= 3 && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Votre essai gratuit se termine dans {subscription.daysUntilTrialEnd} jour(s). Ajoutez un moyen de paiement pour continuer a utiliser ORCHESTR.
          </AlertDescription>
        </Alert>
      )}

      {subscription.cancelAtPeriodEnd && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Votre abonnement est prevu pour s&apos;annuler le {formatDate(subscription.currentPeriodEnd)}.{' '}
            <button onClick={handleReactivate} className="font-medium underline hover:no-underline">
              Reactiver
            </button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Forfait actuel</CardTitle>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{plan.name}</p>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              {pricing && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {formatPrice(subscription.billingPeriod === 'ANNUAL' ? pricing.amount / 12 : pricing.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    /utilisateur/mois
                    {subscription.billingPeriod === 'ANNUAL' && ' (annuel)'}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              {subscription.isTrialing && subscription.trialEndsAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Essai gratuit jusqu&apos;au {formatDate(subscription.trialEndsAt)}</span>
                </div>
              )}
              {subscription.currentPeriodEnd && !subscription.isTrialing && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Prochaine facturation: {formatDate(subscription.currentPeriodEnd)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => router.push('/pricing')}>
                Changer de forfait
              </Button>
              {subscription.isActive && !subscription.cancelAtPeriodEnd && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                >
                  {actionLoading === 'cancel' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Annuler
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Moyen de paiement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Carte bancaire</p>
                <p className="text-sm text-muted-foreground">
                  Gerez vos moyens de paiement dans le portail Stripe
                </p>
              </div>
            </div>

            <Button onClick={handleManageBilling} disabled={actionLoading === 'portal'}>
              {actionLoading === 'portal' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Gerer la facturation
            </Button>
            <p className="text-xs text-muted-foreground">
              Vous serez redirige vers le portail securise de Stripe
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ce qui est inclus dans votre forfait</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>

          {subscription.plan === 'CORE' && (
            <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-start gap-3">
                <ArrowUpRight className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Passez a Pro</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Debloquez les utilisateurs illimites, les questionnaires personnalises, et l&apos;acces API.
                  </p>
                  <Button size="sm" className="mt-3" onClick={() => router.push('/pricing')}>
                    Voir les avantages Pro
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices - Link to Stripe */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des factures</CardTitle>
          <CardDescription>
            Consultez et telechargez vos factures depuis le portail de facturation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleManageBilling} disabled={actionLoading === 'portal'}>
            {actionLoading === 'portal' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Voir les factures
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

