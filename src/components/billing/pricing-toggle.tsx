'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface PricingToggleProps {
  period: 'fourWeeks' | 'annual'
  onChange: (period: 'fourWeeks' | 'annual') => void
}

export function PricingToggle({ period, onChange }: PricingToggleProps) {
  const t = useTranslations('pricing')
  
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={cn(
          'text-sm font-medium transition-colors cursor-pointer',
          period === 'fourWeeks' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onChange('fourWeeks')}
      >
        {t('fourWeeks')}
      </span>
      <button
        type="button"
        className="relative h-8 w-16 rounded-full bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        onClick={() => onChange(period === 'fourWeeks' ? 'annual' : 'fourWeeks')}
        aria-label="Toggle billing period"
      >
        <span
          className={cn(
            'absolute top-1 left-1 h-6 w-6 rounded-full bg-primary transition-transform',
            period === 'annual' && 'translate-x-8'
          )}
        />
      </button>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'text-sm font-medium transition-colors cursor-pointer',
            period === 'annual' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onChange('annual')}
        >
          {t('annual')}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          -15%
        </span>
      </div>
    </div>
  )
}

