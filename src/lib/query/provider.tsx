'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './client'
import { useState, type ReactNode } from 'react'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * React Query Provider for the entire application
 * Wraps the app with QueryClientProvider and dev tools
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create client in useState to ensure it's stable across re-renders
  const [client] = useState(() => queryClient)
  
  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  )
}
