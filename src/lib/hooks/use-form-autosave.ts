'use client'

import { UseFormWatch, type FieldValues } from 'react-hook-form'
import { useAutosave } from './use-autosave'

interface UseFormAutosaveOptions<T extends FieldValues> {
  key: string
  watch: UseFormWatch<T>
  enabled?: boolean
  delay?: number
}

/**
 * Hook for auto-saving React Hook Form data
 * Integrates with useAutosave for form-specific use cases
 */
export function useFormAutosave<T extends FieldValues>({
  key,
  watch,
  enabled = true,
  delay = 2000,
}: UseFormAutosaveOptions<T>) {
  const formData = watch()
  
  const { loadSaved, clearSaved, hasSaved } = useAutosave({
    key,
    data: formData,
    delay,
    enabled,
  })

  return {
    loadSaved,
    clearSaved,
    hasSaved,
  }
}
