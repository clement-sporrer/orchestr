'use client'

import { useState, useEffect, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  defaultValue?: string
  onSearch: (query: string) => void
  debounceMs?: number
  className?: string
}

export function SearchBar({
  placeholder = 'Rechercher...',
  defaultValue = '',
  onSearch,
  debounceMs = 150,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        onSearch(query)
      })
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, debounceMs, onSearch])

  return (
    <div className={cn('relative flex-1', className)}>
      <Search className={cn(
        'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-opacity',
        isPending && 'opacity-50'
      )} />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => setQuery('')}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
