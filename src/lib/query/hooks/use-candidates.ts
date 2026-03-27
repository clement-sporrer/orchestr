import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../client'
import { 
  getCandidates, 
  getCandidate, 
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '@/lib/actions/candidates'
import type { CandidateStatus } from '@/generated/prisma'

interface CandidatesFilters {
  search?: string
  status?: CandidateStatus
  page?: number
  limit?: number
}

/**
 * Hook to fetch candidates list with caching and prefetching
 */
export function useCandidates(filters: CandidatesFilters = {}) {
  return useQuery({
    queryKey: queryKeys.candidates.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const result = await getCandidates(filters)
      return result
    },
  })
}

/**
 * Hook to fetch a single candidate by ID
 */
export function useCandidate(id: string | null) {
  return useQuery({
    queryKey: queryKeys.candidates.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Candidate ID is required')
      return await getCandidate(id)
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new candidate with optimistic update
 */
export function useCreateCandidate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createCandidate,
    onMutate: async (newCandidate) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.candidates.lists() })
      
      // Snapshot previous value
      const previousCandidates = queryClient.getQueriesData({ 
        queryKey: queryKeys.candidates.lists() 
      })
      
      // Optimistically update cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.candidates.lists() },
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            candidates: [
              {
                ...newCandidate,
                id: 'temp-' + Date.now(),
                createdAt: new Date(),
                updatedAt: new Date(),
                _count: { missionCandidates: 0 },
              },
              ...old.candidates,
            ],
            total: old.total + 1,
          }
        }
      )
      
      return { previousCandidates }
    },
    onError: (_err, _newCandidate, context) => {
      // Rollback on error
      if (context?.previousCandidates) {
        context.previousCandidates.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Refetch to get server state
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.lists() })
    },
  })
}

/**
 * Hook to update a candidate with optimistic update
 */
export function useUpdateCandidate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      updateCandidate(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.candidates.detail(id) })
      
      // Snapshot previous value
      const previousCandidate = queryClient.getQueryData(
        queryKeys.candidates.detail(id)
      )
      
      // Optimistically update cache
      queryClient.setQueryData(
        queryKeys.candidates.detail(id),
        (old: any) => {
          if (!old) return old
          return { ...old, ...data, updatedAt: new Date() }
        }
      )
      
      return { previousCandidate, id }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousCandidate && context?.id) {
        queryClient.setQueryData(
          queryKeys.candidates.detail(context.id),
          context.previousCandidate
        )
      }
    },
    onSettled: (_data, _error, { id }) => {
      // Refetch to get server state
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.lists() })
    },
  })
}

/**
 * Hook to delete a candidate with optimistic update
 */
export function useDeleteCandidate() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteCandidate,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.candidates.lists() })
      
      // Snapshot previous value
      const previousCandidates = queryClient.getQueriesData({ 
        queryKey: queryKeys.candidates.lists() 
      })
      
      // Optimistically remove from cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.candidates.lists() },
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            candidates: old.candidates.filter((c: any) => c.id !== id),
            total: old.total - 1,
          }
        }
      )
      
      return { previousCandidates }
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousCandidates) {
        context.previousCandidates.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Refetch to get server state
      queryClient.invalidateQueries({ queryKey: queryKeys.candidates.lists() })
    },
  })
}

/**
 * Prefetch candidates list (useful for hover states)
 */
export function usePrefetchCandidates() {
  const queryClient = useQueryClient()
  
  return (filters: CandidatesFilters = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.candidates.list(filters as Record<string, unknown>),
      queryFn: async () => {
        const result = await getCandidates(filters)
        return result
      },
    })
  }
}

/**
 * Prefetch a single candidate (useful for hover states)
 */
export function usePrefetchCandidate() {
  const queryClient = useQueryClient()
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.candidates.detail(id),
      queryFn: () => getCandidate(id),
    })
  }
}
