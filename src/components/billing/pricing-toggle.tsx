'use client'

import { cn } from '@/lib/utils'

interface PricingToggleProps {
  period: 'monthly' | 'annual'
  onChange: (period: 'monthly' | 'annual') => void
}

export function PricingToggle({ period, onChange }: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className={cn(
          'text-sm font-medium transition-colors cursor-pointer',
          period === 'monthly' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        )}
        onClick={() => onChange('monthly')}
      >
        Mensuel
      </span>
      <button
        type="button"
        className="relative h-8 w-16 rounded-full bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        onClick={() => onChange(period === 'monthly' ? 'annual' : 'monthly')}
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
          Annuel
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          -17%
        </span>
      </div>
    </div>
  )
}

