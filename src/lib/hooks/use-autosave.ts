'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useDebounce } from './use-debounce'

interface UseAutosaveOptions<T> {
  key: string
  data: T
  delay?: number
  onSave?: (data: T) => void
  enabled?: boolean
}

/**
 * Hook for auto-saving form data to localStorage
 * Prevents data loss on page navigation or browser crash
 */
export function useAutosave<T>({
  key,
  data,
  delay = 2000,
  onSave,
  enabled = true,
}: UseAutosaveOptions<T>) {
  const debouncedData = useDebounce(data, delay)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip first render to avoid saving initial state
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!enabled) return

    try {
      const serialized = JSON.stringify(debouncedData)
      localStorage.setItem(`autosave:${key}`, serialized)
      onSave?.(debouncedData)
    } catch (error) {
      console.error('Autosave failed:', error)
    }
  }, [debouncedData, key, onSave, enabled])

  /**
   * Load saved data from localStorage
   */
  const loadSaved = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(`autosave:${key}`)
      if (!saved) return null
      return JSON.parse(saved) as T
    } catch (error) {
      console.error('Load autosave failed:', error)
      return null
    }
  }, [key])

  /**
   * Clear saved data from localStorage
   */
  const clearSaved = useCallback(() => {
    try {
      localStorage.removeItem(`autosave:${key}`)
    } catch (error) {
      console.error('Clear autosave failed:', error)
    }
  }, [key])

  /**
   * Check if there's saved data
   */
  const hasSaved = useCallback((): boolean => {
    try {
      return localStorage.getItem(`autosave:${key}`) !== null
    } catch {
      return false
    }
  }, [key])

  return {
    loadSaved,
    clearSaved,
    hasSaved,
  }
}
