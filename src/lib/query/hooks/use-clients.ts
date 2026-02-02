import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../client'
import { 
  getClients, 
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from '@/lib/actions/clients'

interface ClientsFilters {
  search?: string
  page?: number
  limit?: number
}

/**
 * Hook to fetch clients list with caching
 */
export function useClients(filters: ClientsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const result = await getClients(filters.search, filters.page, filters.limit)
      return result
    },
  })
}

/**
 * Hook to fetch a single client by ID
 */
export function useClient(id: string | null) {
  return useQuery({
    queryKey: queryKeys.clients.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Client ID is required')
      return await getClient(id)
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new client with optimistic update
 */
export function useCreateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createClient,
    onMutate: async (newClient) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.lists() })
      
      const previousClients = queryClient.getQueriesData({ 
        queryKey: queryKeys.clients.lists() 
      })
      
      queryClient.setQueriesData(
        { queryKey: queryKeys.clients.lists() },
        (old: any) => {
          if (!old) return old
          return {
            ...old,
            clients: [
              {
                ...newClient,
                id: 'temp-' + Date.now(),
                createdAt: new Date(),
                updatedAt: new Date(),
                _count: { missions: 0, contacts: 0 },
              },
              ...old.clients,
            ],
            total: old.total + 1,
          }
        }
      )
      
      return { previousClients }
    },
    onError: (_err, _newClient, context) => {
      if (context?.previousClients) {
        context.previousClients.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
    },
  })
}

/**
 * Hook to update a client with optimistic update
 */
export function useUpdateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      updateClient(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.clients.detail(id) })
      
      const previousClient = queryClient.getQueryData(
        queryKeys.clients.detail(id)
      )
      
      queryClient.setQueryData(
        queryKeys.clients.detail(id),
        (old: any) => {
          if (!old) return old
          return { ...old, ...data, updatedAt: new Date() }
        }
      )
      
      return { previousClient, id }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousClient && context?.id) {
        queryClient.setQueryData(
          queryKeys.clients.detail(context.id),
          context.previousClient
        )
      }
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
    },
  })
}

/**
 * Hook to delete a client
 */
export function useDeleteClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteClient,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients.lists() })
    },
  })
}

/**
 * Prefetch clients list (useful for hover states)
 */
export function usePrefetchClients() {
  const queryClient = useQueryClient()
  
  return (filters: ClientsFilters = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.clients.list(filters as Record<string, unknown>),
      queryFn: async () => {
        const result = await getClients(filters.search, filters.page, filters.limit)
        return result
      },
    })
  }
}

/**
 * Prefetch a single client (useful for hover states)
 */
export function usePrefetchClient() {
  const queryClient = useQueryClient()
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.clients.detail(id),
      queryFn: () => getClient(id),
    })
  }
}
