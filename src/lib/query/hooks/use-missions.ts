import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../client'
import {
  getMissions,
  getMission,
  createMission,
  updateMission,
  deleteMission,
  type MissionWithCount,
} from '@/lib/actions/missions'
import type { MissionStatus } from '@/generated/prisma'

type MissionsListData = Awaited<ReturnType<typeof getMissions>>
type MissionDetailData = Awaited<ReturnType<typeof getMission>>
type MissionUpdatePayload = Parameters<typeof updateMission>[1]

interface MissionsFilters {
  search?: string
  status?: MissionStatus
  page?: number
  limit?: number
}

/**
 * Hook to fetch missions list with caching
 */
export function useMissions(filters: MissionsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.missions.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const result = await getMissions(filters)
      return result
    },
  })
}

/**
 * Hook to fetch a single mission by ID
 */
export function useMission(id: string | null) {
  return useQuery({
    queryKey: queryKeys.missions.detail(id || ''),
    queryFn: async () => {
      if (!id) throw new Error('Mission ID is required')
      return await getMission(id)
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a new mission with optimistic update
 */
export function useCreateMission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createMission,
    onMutate: async (newMission) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.missions.lists() })
      
      const previousMissions = queryClient.getQueriesData({ 
        queryKey: queryKeys.missions.lists() 
      })
      
      queryClient.setQueriesData(
        { queryKey: queryKeys.missions.lists() },
        (old: MissionsListData | undefined) => {
          if (!old) return old
          const tempMission = {
            ...newMission,
            id: 'temp-' + Date.now(),
            createdAt: new Date(),
            updatedAt: new Date(),
            _count: { missionCandidates: 0 },
          } as unknown as MissionWithCount
          const nextTotal = old.pagination.total + 1
          return {
            ...old,
            missions: [tempMission, ...old.missions],
            pagination: {
              ...old.pagination,
              total: nextTotal,
              totalPages: Math.ceil(nextTotal / old.pagination.limit),
            },
          }
        }
      )
      
      return { previousMissions }
    },
    onError: (_err, _newMission, context) => {
      if (context?.previousMissions) {
        context.previousMissions.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.missions() })
    },
  })
}

/**
 * Hook to update a mission with optimistic update
 */
export function useUpdateMission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MissionUpdatePayload }) =>
      updateMission(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.missions.detail(id) })
      
      const previousMission = queryClient.getQueryData(
        queryKeys.missions.detail(id)
      )
      
      queryClient.setQueryData(
        queryKeys.missions.detail(id),
        (old: MissionDetailData | undefined) => {
          if (!old) return old
          return { ...old, ...data, updatedAt: new Date() }
        }
      )
      
      return { previousMission, id }
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMission && context?.id) {
        queryClient.setQueryData(
          queryKeys.missions.detail(context.id),
          context.previousMission
        )
      }
    },
    onSettled: (_data, _error, variables) => {
      const id = variables?.id
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.missions.detail(id) })
        queryClient.invalidateQueries({ queryKey: queryKeys.missions.pipeline(id) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.missions() })
    },
  })
}

/**
 * Hook to delete a mission
 */
export function useDeleteMission() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteMission,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.missions.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.missions() })
    },
  })
}

/**
 * Prefetch missions list (useful for hover states)
 */
export function usePrefetchMissions() {
  const queryClient = useQueryClient()
  
  return (filters: MissionsFilters = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.missions.list(filters as Record<string, unknown>),
      queryFn: async () => {
        const result = await getMissions(filters)
        return result
      },
    })
  }
}

/**
 * Prefetch a single mission (useful for hover states)
 */
export function usePrefetchMission() {
  const queryClient = useQueryClient()
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.missions.detail(id),
      queryFn: () => getMission(id),
    })
  }
}
