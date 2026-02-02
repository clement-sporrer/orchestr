'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { FilterRule } from '@/lib/filters/filter-types'

interface FilterChipProps {
  rule: FilterRule
  fieldLabel?: string
  onRemove: () => void
}

const operatorLabels: Record<string, string> = {
  eq: 'est',
  ne: 'n\'est pas',
  contains: 'contient',
  notContains: 'ne contient pas',
  startsWith: 'commence par',
  endsWith: 'finit par',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  in: 'dans',
  notIn: 'pas dans',
  isEmpty: 'est vide',
  isNotEmpty: 'n\'est pas vide',
}

export function FilterChip({ rule, fieldLabel, onRemove }: FilterChipProps) {
  const label = fieldLabel || rule.field
  const operator = operatorLabels[rule.operator] || rule.operator
  
  // Format value display
  const valueDisplay = Array.isArray(rule.value)
    ? rule.value.join(', ')
    : rule.value?.toString() || ''

  return (
    <Badge 
      variant="secondary" 
      className="gap-1 pr-1 text-sm font-normal hover:bg-secondary"
    >
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{operator}</span>
      {valueDisplay && <span>{valueDisplay}</span>}
      <Button
        variant="ghost"
        size="icon"
        className="h-4 w-4 p-0 hover:bg-destructive/10 hover:text-destructive ml-1"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  )
}
