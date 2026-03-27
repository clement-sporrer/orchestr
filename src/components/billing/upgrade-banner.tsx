'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getSubscriptionStatus } from '@/lib/actions/billing'
import { ArrowUpRight, Sparkles, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubscriptionData {
  plan: string
  status: string
  isTrialing: boolean
  daysUntilTrialEnd: number | null
}

export function UpgradeBanner({ className }: { className?: string }) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)

  useEffect(() => {
    getSubscriptionStatus().then((data) => {
      setSubscription(data as SubscriptionData)
    })
  }, [])

  if (!subscription) return null

  // Show trial ending soon banner
  if (subscription.isTrialing && subscription.daysUntilTrialEnd !== null && subscription.daysUntilTrialEnd <= 7) {
    return (
      <div className={cn('p-4 bg-amber-50 border border-amber-200 rounded-lg', className)}>
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-amber-900">
              Essai gratuit: {subscription.daysUntilTrialEnd} jour(s) restant(s)
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Configurez votre moyen de paiement pour continuer apres l&apos;essai.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/settings/billing">Configurer le paiement</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show upgrade banner for Core users
  if (subscription.plan === 'CORE') {
    return (
      <div className={cn('p-4 bg-primary/5 border border-primary/20 rounded-lg', className)}>
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">Passez a Pro</p>
            <p className="text-sm text-muted-foreground mt-1">
              Utilisateurs illimites, questionnaires custom, et acces API.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-3">
              <Link href="/pricing">
                Voir les avantages
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export function FeatureGate({
  feature: _feature,
  children,
  fallback,
}: {
  feature: 'customQuestionnaires' | 'apiAccess' | 'unlimitedUsers'
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSubscriptionStatus().then((data) => {
      setSubscription(data as SubscriptionData)
      setLoading(false)
    })
  }, [])

  if (loading) return null

  const isPro = subscription?.plan === 'PRO' || subscription?.plan === 'WHITE_LABEL'

  // Check feature availability based on plan
  const featureAvailable = isPro // All gated features are Pro+

  if (featureAvailable) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  // Default fallback - upgrade prompt
  return (
    <div className="p-6 text-center border rounded-lg bg-muted/30">
      <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
      <h3 className="font-semibold text-foreground mb-1">Fonctionnalite Pro</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Cette fonctionnalite est disponible avec le plan Pro.
      </p>
      <Button asChild>
        <Link href="/pricing">Passer a Pro</Link>
      </Button>
    </div>
  )
}





