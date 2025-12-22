'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createCheckoutSession } from '@/lib/actions/billing'
import { Loader2 } from 'lucide-react'

function CheckoutRedirect() {
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')?.toUpperCase() as 'CORE' | 'PRO' | null
  const period = (searchParams.get('period') || 'annual') as 'fourWeeks' | 'annual'

  useEffect(() => {
    if (plan && (plan === 'CORE' || plan === 'PRO')) {
      createCheckoutSession(plan, period)
    } else {
      // No valid plan, redirect to pricing
      window.location.href = '/pricing'
    }
  }, [plan, period])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <h1 className="text-xl font-semibold">Redirection vers le paiement...</h1>
      <p className="text-muted-foreground">
        Vous allez etre redirige vers notre partenaire de paiement securise.
      </p>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-xl font-semibold">Chargement...</h1>
      </div>
    }>
      <CheckoutRedirect />
    </Suspense>
  )
}

