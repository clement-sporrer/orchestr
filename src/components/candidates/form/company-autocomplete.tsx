'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Command, CommandGroup, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Building2, Loader2 } from 'lucide-react'
import { suggestCompanies } from '@/lib/actions/suggestions'
import { useDebounce } from '@/lib/hooks/use-debounce'

interface CompanyAutocompleteProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/**
 * CompanyAutocomplete component
 * Auto-suggests companies from existing candidates
 */
export function CompanyAutocomplete({
  value,
  onChange,
  disabled,
}: CompanyAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<
    Array<{ value: string; count: number }>
  >([])
  const [isLoading, setIsLoading] = useState(false)

  // Debounce search query
  const debouncedValue = useDebounce(value, 300)

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([])
      return
    }

    setIsLoading(true)
    try {
      const result = await suggestCompanies(query, 10)
      if (result.success && result.data) {
        setSuggestions(result.data)
        setIsOpen(result.data.length > 0)
      }
    } catch (error) {
      console.error('Error fetching company suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Trigger fetch when debounced value changes
  useEffect(() => {
    fetchSuggestions(debouncedValue)
  }, [debouncedValue, fetchSuggestions])

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue)
    setIsOpen(false)
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Entreprise actuelle
      </Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Ex: Google, Microsoft..."
              disabled={disabled}
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </PopoverTrigger>
        {suggestions.length > 0 && (
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
          >
            <Command>
              <CommandGroup>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion.value}
                    onSelect={() => handleSelect(suggestion.value)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{suggestion.value}</span>
                      <span className="text-xs text-muted-foreground">
                        {suggestion.count} candidat{suggestion.count > 1 ? 's' : ''}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        )}
      </Popover>
      <p className="text-xs text-muted-foreground">
        Suggestions depuis vos candidats existants
      </p>
    </div>
  )
}
