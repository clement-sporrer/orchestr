'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Loading skeleton for JobBuilderForm
function JobBuilderFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

// Dynamically import JobBuilderForm with SSR disabled for better code-splitting
export const JobBuilderFormLazy = dynamic(
  () => import('./form').then(mod => ({ default: mod.JobBuilderForm })),
  {
    ssr: false,
    loading: () => <JobBuilderFormSkeleton />,
  }
)
