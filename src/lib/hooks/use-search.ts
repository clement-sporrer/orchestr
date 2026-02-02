'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface UseSearchOptions {
  persistToUrl?: boolean
  defaultValue?: string
  debounceMs?: number
}

/**
 * Hook for managing search state with URL persistence
 */
export function useSearch(options: UseSearchOptions = {}) {
  const { persistToUrl = true, defaultValue = '', debounceMs = 150 } = options
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize from URL or default
  const [query, setQuery] = useState(() => {
    if (persistToUrl) {
      return searchParams.get('search') || defaultValue
    }
    return defaultValue
  })

  // Debounced URL sync
  useEffect(() => {
    if (!persistToUrl) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (query) {
        params.set('search', query)
      } else {
        params.delete('search')
      }

      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.replace(newUrl, { scroll: false })
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, persistToUrl, pathname, searchParams, router, debounceMs])

  // Update query
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery)
  }, [])

  // Clear query
  const clear = useCallback(() => {
    setQuery('')
  }, [])

  return {
    query,
    setQuery: updateQuery,
    clear,
  }
}
