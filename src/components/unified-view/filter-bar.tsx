'use client'

import { FilterChip } from './filter-chip'
import { Button } from '@/components/ui/button'
import { X, Filter } from 'lucide-react'
import type { FilterConfig, FilterField } from '@/lib/filters/filter-types'
import { removeRule, clearFilters, hasActiveFilters } from '@/lib/filters/filter-engine'

interface FilterBarProps {
  config: FilterConfig
  fields: FilterField[]
  onConfigChange: (config: FilterConfig) => void
  resultCount?: number
}

export function FilterBar({ config, fields, onConfigChange, resultCount }: FilterBarProps) {
  const hasFilters = hasActiveFilters(config)
  
  if (!hasFilters) return null

  const allRules = config.groups.flatMap(group => group.rules)
  
  const getFieldLabel = (fieldKey: string) => {
    return fields.find(f => f.key === fieldKey)?.label || fieldKey
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
      <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      
      <div className="flex items-center gap-2 flex-1 overflow-x-auto">
        {allRules.map((rule) => (
          <FilterChip
            key={rule.id}
            rule={rule}
            fieldLabel={getFieldLabel(rule.field)}
            onRemove={() => onConfigChange(removeRule(config, rule.id))}
          />
        ))}
      </div>

      {resultCount !== undefined && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {resultCount} résultat{resultCount !== 1 ? 's' : ''}
        </span>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onConfigChange(clearFilters())}
        className="flex-shrink-0"
      >
        <X className="h-4 w-4 mr-1" />
        Effacer
      </Button>
    </div>
  )
}
