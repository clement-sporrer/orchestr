import { QueryClient, DefaultOptions } from '@tanstack/react-query'

/**
 * React Query configuration optimized for ultra-fast UX
 * 
 * Strategy:
 * - Aggressive caching: keep data fresh for 30s, in cache for 5min
 * - No automatic refetching to avoid unnecessary network calls
 * - Optimistic updates everywhere for instant feedback
 * - Prefetching on hover for sub-100ms navigation
 */

const queryConfig: DefaultOptions = {
  queries: {
    // Data is considered fresh for 30 seconds
    staleTime: 30 * 1000,
    
    // Keep unused data in cache for 5 minutes
    gcTime: 5 * 60 * 1000,
    
    // Don't refetch on window focus (user might be switching tabs)
    refetchOnWindowFocus: false,
    
    // Don't refetch on component mount if we have cached data
    refetchOnMount: false,
    
    // Retry failed requests once
    retry: 1,
    
    // Shorter retry delay for faster feedback
    retryDelay: 1000,
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
  },
}

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})

/**
 * Query keys factory for consistent cache management
 * Follows pattern: ['resource', ...filters]
 */
export const queryKeys = {
  // Candidates
  candidates: {
    all: ['candidates'] as const,
    lists: () => [...queryKeys.candidates.all, 'list'] as const,
    list: (filters: Record<string, unknown> = {}) => 
      [...queryKeys.candidates.lists(), filters] as const,
    details: () => [...queryKeys.candidates.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.candidates.details(), id] as const,
  },
  
  // Missions
  missions: {
    all: ['missions'] as const,
    lists: () => [...queryKeys.missions.all, 'list'] as const,
    list: (filters: Record<string, unknown> = {}) => 
      [...queryKeys.missions.lists(), filters] as const,
    details: () => [...queryKeys.missions.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.missions.details(), id] as const,
    /** Pipeline payload (mission candidates) — lazy-loaded on mission detail tabs */
    pipeline: (id: string) => [...queryKeys.missions.detail(id), 'pipeline'] as const,
  },
  
  // Clients
  clients: {
    all: ['clients'] as const,
    lists: () => [...queryKeys.clients.all, 'list'] as const,
    list: (filters: Record<string, unknown> = {}) => 
      [...queryKeys.clients.lists(), filters] as const,
    details: () => [...queryKeys.clients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clients.details(), id] as const,
  },
  
  // Dashboard stats
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    tasks: (userId: string) => [...queryKeys.dashboard.all, 'tasks', userId] as const,
    activity: () => [...queryKeys.dashboard.all, 'activity'] as const,
    missions: () => [...queryKeys.dashboard.all, 'missions'] as const,
  },
  
  // Suggestions
  suggestions: {
    companies: (query: string) => ['suggestions', 'companies', query] as const,
    positions: (query: string) => ['suggestions', 'positions', query] as const,
  },
}
