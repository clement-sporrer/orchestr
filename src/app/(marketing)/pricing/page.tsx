'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { HeroSection } from '@/components/marketing/hero-section'
import { CTASection } from '@/components/marketing/cta-section'
import { PricingToggle } from '@/components/billing/pricing-toggle'
import { PricingCard } from '@/components/billing/pricing-card'
import { createCheckoutSession } from '@/lib/actions/billing'
import { PRICING, formatPrice, calculateAnnualSavings } from '@/lib/stripe'
import { Loader2 } from 'lucide-react'

function PricingContent() {
  const t = useTranslations('pricing')
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

  // Get translated features
  const coreFeatures = [
    t('plans.core.features.0'),
    t('plans.core.features.1'),
    t('plans.core.features.2'),
    t('plans.core.features.3'),
    t('plans.core.features.4'),
    t('plans.core.features.5'),
    t('plans.core.features.6'),
    t('plans.core.features.7'),
    t('plans.core.features.8'),
  ]

  const proFeatures = [
    t('plans.pro.features.0'),
    t('plans.pro.features.1'),
    t('plans.pro.features.2'),
    t('plans.pro.features.3'),
    t('plans.pro.features.4'),
    t('plans.pro.features.5'),
    t('plans.pro.features.6'),
    t('plans.pro.features.7'),
  ]

  const whiteLabelFeatures = [
    t('plans.whiteLabel.features.0'),
    t('plans.whiteLabel.features.1'),
    t('plans.whiteLabel.features.2'),
    t('plans.whiteLabel.features.3'),
    t('plans.whiteLabel.features.4'),
    t('plans.whiteLabel.features.5'),
    t('plans.whiteLabel.features.6'),
    t('plans.whiteLabel.features.7'),
  ]

  return (
    <>
      <HeroSection
        title={t('title')}
        subtitle={t('subtitle')}
      />

      {canceled && (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-amber-800 text-sm">
              {t('canceled')}
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
                {formatPrice(coreSavings.savings)} / {formatPrice(proSavings.savings)}
              </p>
            )}
          </div>

          {/* Plans grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            <PricingCard
              name={t('plans.core.name')}
              description={t('plans.core.description')}
              price={period === 'monthly' ? PRICING.CORE.monthly.amount / 100 : PRICING.CORE.annual.amount / 100}
              period={period}
              features={coreFeatures}
              ctaLabel={t('startTrial')}
              onCtaClick={() => handleSelectPlan('CORE')}
              isLoading={loadingPlan === 'CORE'}
            />

            <PricingCard
              name={t('plans.pro.name')}
              description={t('plans.pro.description')}
              price={period === 'monthly' ? PRICING.PRO.monthly.amount / 100 : PRICING.PRO.annual.amount / 100}
              period={period}
              features={proFeatures}
              highlighted
              ctaLabel={t('startTrial')}
              onCtaClick={() => handleSelectPlan('PRO')}
              isLoading={loadingPlan === 'PRO'}
            />

            <PricingCard
              name={t('plans.whiteLabel.name')}
              description={t('plans.whiteLabel.description')}
              price="custom"
              period={period}
              features={whiteLabelFeatures}
              ctaLabel={t('contactSales')}
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
              {t('trialInfo')}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-20 max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-foreground mb-8 text-center">
              {t('faq.title')}
            </h4>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-6">
                <h5 className="font-medium text-foreground mb-2">
                  {t('faq.trial.question')}
                </h5>
                <p className="text-sm text-muted-foreground">
                  {t('faq.trial.answer')}
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-6">
                <h5 className="font-medium text-foreground mb-2">
                  {t('faq.fairUse.question')}
                </h5>
                <p className="text-sm text-muted-foreground">
                  {t('faq.fairUse.answer')}
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-6">
                <h5 className="font-medium text-foreground mb-2">
                  {t('faq.changePlan.question')}
                </h5>
                <p className="text-sm text-muted-foreground">
                  {t('faq.changePlan.answer')}
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-6">
                <h5 className="font-medium text-foreground mb-2">
                  {t('faq.billing.question')}
                </h5>
                <p className="text-sm text-muted-foreground">
                  {t('faq.billing.answer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title={t('cta.title')}
        subtitle={t('cta.subtitle')}
        primaryCta={{ label: t('contactSales'), href: '/contact?reason=pricing' }}
      />
    </>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}
