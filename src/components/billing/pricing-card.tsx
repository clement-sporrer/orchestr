'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PricingCardProps {
  name: string
  description: string
  price: number | 'custom'
  period: 'fourWeeks' | 'annual'
  features: readonly string[]
  highlighted?: boolean
  ctaLabel: string
  ctaHref?: string
  onCtaClick?: () => void
  isLoading?: boolean
}

export function PricingCard({
  name,
  description,
  price,
  period,
  features,
  highlighted = false,
  ctaLabel,
  ctaHref,
  onCtaClick,
  isLoading = false,
}: PricingCardProps) {
  const t = useTranslations('pricing')
  // For 4-week billing, show per-period price. For annual, show equivalent per-period
  const displayPrice = price === 'custom' ? null : period === 'annual' ? Math.round(price / 13) : price

  return (
    <div
      className={cn(
        'relative rounded-2xl p-8 transition-all',
        highlighted
          ? 'bg-primary text-primary-foreground ring-4 ring-primary ring-offset-4 ring-offset-background'
          : 'bg-card border border-border hover:border-primary/30'
      )}
    >
      {highlighted && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-foreground text-background text-sm font-medium px-4 py-1 rounded-full">
          {t('mostPopular')}
        </span>
      )}

      <div className="mb-6">
        <h3
          className={cn(
            'text-xl font-bold',
            highlighted ? 'text-primary-foreground' : 'text-foreground'
          )}
        >
          {name}
        </h3>
        <p
          className={cn(
            'mt-1 text-sm',
            highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'
          )}
        >
          {description}
        </p>
      </div>

      <div className="mb-6">
        {price === 'custom' ? (
          <div className="flex items-baseline">
            <span
              className={cn(
                'text-4xl font-bold',
                highlighted ? 'text-primary-foreground' : 'text-foreground'
              )}
            >
              {t('customPrice')}
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline">
              <span
                className={cn(
                  'text-lg',
                  highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}
              >
                EUR
              </span>
              <span
                className={cn(
                  'text-4xl font-bold ml-1',
                  highlighted ? 'text-primary-foreground' : 'text-foreground'
                )}
              >
                {displayPrice}
              </span>
            </div>
            <p
              className={cn(
                'text-sm',
                highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'
              )}
            >
              {t('perUser')}{' '}
              {period === 'annual' && (
                <span className="opacity-70">({t('billedAnnually')})</span>
              )}
            </p>
          </>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check
              className={cn(
                'h-5 w-5 flex-shrink-0',
                highlighted ? 'text-primary-foreground/80' : 'text-primary'
              )}
            />
            <span
              className={cn(
                'text-sm',
                highlighted ? 'text-primary-foreground/90' : 'text-foreground/80'
              )}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {ctaHref ? (
        <Button
          asChild
          variant={highlighted ? 'secondary' : 'default'}
          className="w-full"
        >
          <a href={ctaHref}>{ctaLabel}</a>
        </Button>
      ) : (
        <Button
          variant={highlighted ? 'secondary' : 'default'}
          className="w-full"
          onClick={onCtaClick}
          disabled={isLoading}
        >
          {isLoading ? 'Chargement...' : ctaLabel}
        </Button>
      )}

      {price !== 'custom' && (
        <p
          className={cn(
            'mt-4 text-center text-xs',
            highlighted ? 'text-primary-foreground/60' : 'text-muted-foreground'
          )}
        >
          {t('trialIncluded')}
        </p>
      )}
    </div>
  )
}

