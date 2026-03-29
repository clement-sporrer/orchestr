'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, Briefcase, Building2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { globalSearch, type SearchResult } from '@/lib/actions/search'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { cn } from '@/lib/utils'

interface GlobalSearchProps {
  children?: React.ReactNode
  className?: string
}

const typeIcons = {
  candidate: Users,
  mission: Briefcase,
  client: Building2,
}

const typeLabels = {
  candidate: 'Candidat',
  mission: 'Mission',
  client: 'Client',
}

export function GlobalSearch({ children, className }: Readonly<GlobalSearchProps>) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isPending, startTransition] = useTransition()
  
  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setQuery('')
      setResults([])
    }
  }

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale results when query too short
      setResults([])
      return
    }

    startTransition(async () => {
      const searchResults = await globalSearch(debouncedQuery)
      setResults(searchResults)
    })
  }, [debouncedQuery])

  const handleSelect = (result: SearchResult) => {
    router.push(result.url)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  // Group results by type (memoized to avoid recalculating on every render)
  const groupedResults = useMemo(() => 
    results.reduce((acc, result) => {
      if (!acc[result.type]) {
        acc[result.type] = []
      }
      acc[result.type].push(result)
      return acc
    }, {} as Record<string, SearchResult[]>), [results])

  return (
    <>
      {children ? (
        <button
          type="button"
          className={cn('inline cursor-pointer border-0 bg-transparent p-0 text-left font-inherit', className)}
          onClick={() => setOpen(true)}
        >
          {children}
        </button>
      ) : (
        <div className={cn('relative w-full max-w-md', className)}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher candidats, missions, clients... (⌘K)"
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 cursor-pointer"
            onClick={() => setOpen(true)}
            readOnly
          />
        </div>
      )}

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder="Rechercher candidats, missions, clients..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isPending && query.length >= 2 && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Recherche en cours...</p>
            </div>
          )}
          {!isPending && query.length >= 2 && results.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-1">Aucun résultat trouvé</p>
              <p className="text-xs text-muted-foreground/70">Essayez avec d&apos;autres mots-clés</p>
            </div>
          )}
          {!isPending && query.length < 2 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground mb-1">Recherche globale</p>
              <p className="text-xs text-muted-foreground/70">Tapez au moins 2 caractères pour rechercher</p>
            </div>
          )}
          {!isPending && Object.keys(groupedResults).length > 0 && (
            <>
              {Object.entries(groupedResults).map(([type, items]) => {
                const Icon = typeIcons[type as keyof typeof typeIcons]
                return (
                  <CommandGroup key={type} heading={typeLabels[type as keyof typeof typeLabels]}>
                    {items.map((result) => (
                      <CommandItem
                        key={result.id}
                        value={`${result.type}-${result.id}`}
                        onSelect={() => handleSelect(result)}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.subtitle && (
                            <span className="text-xs text-muted-foreground">
                              {result.subtitle}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}

