'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { QuickFilter } from '@/lib/filters/filter-types'
import { cn } from '@/lib/utils'

interface QuickFiltersProps {
  filters: QuickFilter[]
  activeFilterId?: string
  onFilterClick: (filter: QuickFilter) => void
}

export function QuickFilters({ filters, activeFilterId, onFilterClick }: QuickFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilterId === filter.id ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'whitespace-nowrap',
            activeFilterId === filter.id && 'shadow-sm'
          )}
          onClick={() => onFilterClick(filter)}
        >
          {filter.icon && <span className="mr-2">{filter.icon}</span>}
          {filter.label}
          {filter.badge !== undefined && filter.badge > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 px-1.5 py-0 text-xs font-medium"
            >
              {filter.badge}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  )
}
