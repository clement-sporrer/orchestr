'use client'

import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ViewMode = 'cards' | 'table'

interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  className?: string
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn('flex rounded-md border border-input bg-muted/50 p-0.5', className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3',
          value === 'cards' && 'bg-background shadow-sm'
        )}
        onClick={() => onChange('cards')}
        aria-label="Vue cartes"
        aria-pressed={value === 'cards'}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 px-3',
          value === 'table' && 'bg-background shadow-sm'
        )}
        onClick={() => onChange('table')}
        aria-label="Vue liste"
        aria-pressed={value === 'table'}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}
