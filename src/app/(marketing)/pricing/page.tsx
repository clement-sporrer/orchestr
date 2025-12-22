'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HeroSection } from '@/components/marketing/hero-section'
import { CTASection } from '@/components/marketing/cta-section'
import { PricingToggle } from '@/components/billing/pricing-toggle'
import { PricingCard } from '@/components/billing/pricing-card'
import { createCheckoutSession } from '@/lib/actions/billing'
import { PLANS, PRICING, formatPrice, calculateAnnualSavings } from '@/lib/stripe'
import { toast } from 'sonner'

export default function PricingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [period, setPeriod] = useState<'monthly' | 'annual'>('annual')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  // Check if user was redirected from canceled checkout
  const canceled = searchParams.get('canceled')

  const handleSelectPlan = async (plan: 'CORE' | 'PRO') => {
    setLoadingPlan(plan)
    try {
      await createCheckoutSession(plan, period)
    } catch {
      // If not authenticated, redirect to signup with plan
      router.push(`/signup?plan=${plan.toLowerCase()}&period=${period}`)
    } finally {
      setLoadingPlan(null)
    }
  }

  const coreSavings = calculateAnnualSavings('CORE')
  const proSavings = calculateAnnualSavings('PRO')

  return (
    <>
      <HeroSection
        title="Une tarification simple et transparente"
        subtitle="Choisissez le forfait adapte a votre agence. Tous les plans incluent les fonctionnalites essentielles. Changez de formule a tout moment."
      />

      {canceled && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-amber-800 text-sm">
              Vous avez annule le paiement. Pas de souci, vous pouvez reessayer quand vous voulez.
            </p>
          </div>
        </div>
      )}

      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Billing toggle */}
          <div className="mb-12">
            <PricingToggle period={period} onChange={setPeriod} />
            {period === 'annual' && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Economisez {formatPrice(coreSavings.savings)} par an sur Core ou{' '}
                {formatPrice(proSavings.savings)} sur Pro
              </p>
            )}
          </div>

          {/* Plans grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            <PricingCard
              name={PLANS.CORE.name}
              description={PLANS.CORE.description}
              price={period === 'monthly' ? PRICING.CORE.monthly.amount / 100 : PRICING.CORE.annual.amount / 100}
              period={period}
              features={PLANS.CORE.features}
              ctaLabel="Demarrer l'essai gratuit"
              onCtaClick={() => handleSelectPlan('CORE')}
              isLoading={loadingPlan === 'CORE'}
            />

            <PricingCard
              name={PLANS.PRO.name}
              description={PLANS.PRO.description}
              price={period === 'monthly' ? PRICING.PRO.monthly.amount / 100 : PRICING.PRO.annual.amount / 100}
              period={period}
              features={PLANS.PRO.features}
              highlighted
              ctaLabel="Demarrer l'essai gratuit"
              onCtaClick={() => handleSelectPlan('PRO')}
              isLoading={loadingPlan === 'PRO'}
            />

            <PricingCard
              name={PLANS.WHITE_LABEL.name}
              description={PLANS.WHITE_LABEL.description}
              price="custom"
              period={period}
              features={PLANS.WHITE_LABEL.features}
              ctaLabel="Contacter l'equipe commerciale"
              ctaHref="/contact?reason=pricing"
            />
          </div>

          {/* Trial info */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground">
              <svg
                className="h-5 w-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              14 jours d&apos;essai gratuit. Carte bancaire requise. Annulez a tout moment.
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-foreground mb-8 text-center">
              Questions frequentes
            </h4>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-6">
                <h5 className="font-medium text-foreground mb-2">
                  Qu&apos;est-ce que l&apos;essai gratuit ?
                </h5>
                <p className="text-sm text-muted-foreground">
                  Vous avez 14 jours pour tester ORCHESTR sans engagement. Une carte bancaire est
                  requise mais vous ne serez pas debite avant la fin de l&apos;essai. Vous pouvez
                  annuler a tout moment pendant cette periode.
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-6">
                <h5 className="font-medium text-foreground mb-2">
                  Que signifie usage equitable de l&apos;IA ?
                </h5>
                <p className="text-sm text-muted-foreground">
                  Les fonctionnalites IA comme le scoring et la generation de messages sont
                  incluses dans tous les plans. Nous surveillons l&apos;usage pour garantir des
                  performances optimales. Seuls les workflows automatises intensifs peuvent etre
                  limites, pas l&apos;usage quotidien normal.
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-6">
                <h5 className="font-medium text-foreground mb-2">
                  Puis-je changer de formule ?
                </h5>
                <p className="text-sm text-muted-foreground">
                  Oui. Vous pouvez passer a une formule superieure ou inferieure a tout moment.
                  Les changements prennent effet au debut de votre prochain cycle de facturation.
                  Vos donnees sont toujours preservees.
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-6">
                <h5 className="font-medium text-foreground mb-2">
                  Comment fonctionne la facturation par utilisateur ?
                </h5>
                <p className="text-sm text-muted-foreground">
                  Vous etes facture en fonction du nombre d&apos;utilisateurs actifs dans votre
                  organisation. Vous pouvez ajouter ou supprimer des utilisateurs a tout moment
                  depuis votre espace de facturation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="Besoin d'aide pour choisir ?"
        subtitle="Notre equipe est la pour vous aider a trouver la formule adaptee a votre agence."
        primaryCta={{ label: 'Contacter l\u0027equipe', href: '/contact?reason=pricing' }}
      />
    </>
  )
}
