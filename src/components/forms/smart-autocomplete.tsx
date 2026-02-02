'use client'

import { useState, useCallback, useEffect } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmartAutocompleteProps {
  value?: string
  onValueChange: (value: string) => void
  fetchSuggestions: (query: string) => Promise<string[]>
  placeholder?: string
  emptyText?: string
  debounceMs?: number
  className?: string
}

/**
 * Smart autocomplete with async suggestions
 * Debounced fetching and keyboard navigation
 */
export function SmartAutocomplete({
  value = '',
  onValueChange,
  fetchSuggestions,
  placeholder = 'Rechercher...',
  emptyText = 'Aucun résultat',
  debounceMs = 300,
  className,
}: SmartAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  // Debounced fetch
  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(query)
        setSuggestions(results)
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, fetchSuggestions, debounceMs])

  const handleSelect = useCallback((selectedValue: string) => {
    onValueChange(selectedValue)
    setQuery(selectedValue)
    setOpen(false)
  }, [onValueChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandEmpty>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              emptyText
            )}
          </CommandEmpty>
          {suggestions.length > 0 && (
            <CommandGroup>
              {suggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion}
                  value={suggestion}
                  onSelect={() => handleSelect(suggestion)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === suggestion ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {suggestion}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
