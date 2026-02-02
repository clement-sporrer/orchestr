'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { FilterConfig } from '@/lib/filters/filter-types'
import { clearFilters } from '@/lib/filters/filter-engine'

interface UseFiltersOptions {
  persistToUrl?: boolean
  defaultConfig?: FilterConfig
}

/**
 * Hook for managing filter state with optional URL persistence
 * Provides seamless filter state management across page navigation
 */
export function useFilters(options: UseFiltersOptions = {}) {
  const { persistToUrl = true, defaultConfig } = options
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize from URL or default
  const [config, setConfig] = useState<FilterConfig>(() => {
    if (persistToUrl) {
      const urlFilters = searchParams.get('filters')
      if (urlFilters) {
        try {
          return JSON.parse(decodeURIComponent(urlFilters))
        } catch {
          // Invalid JSON in URL, fallback to default
        }
      }
    }
    return defaultConfig || clearFilters()
  })

  // Sync to URL when config changes
  useEffect(() => {
    if (!persistToUrl) return

    const params = new URLSearchParams(searchParams.toString())
    
    // If filters are active, add to URL
    if (config.groups.length > 0 && config.groups.some(g => g.rules.length > 0)) {
      params.set('filters', encodeURIComponent(JSON.stringify(config)))
    } else {
      params.delete('filters')
    }

    // Update URL without scroll or page reload
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [config, persistToUrl, pathname, searchParams, router])

  // Update config and sync to URL
  const updateConfig = useCallback((newConfig: FilterConfig) => {
    setConfig(newConfig)
  }, [])

  // Clear all filters
  const clear = useCallback(() => {
    setConfig(clearFilters())
  }, [])

  return {
    config,
    setConfig: updateConfig,
    clear,
  }
}
