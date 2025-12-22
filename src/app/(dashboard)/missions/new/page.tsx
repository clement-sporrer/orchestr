import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { JobBuilderForm } from '@/components/job-builder/form'
import { getClientsForSelect } from '@/lib/actions/missions'

interface NewMissionPageProps {
  searchParams: Promise<{ clientId?: string }>
}

async function JobBuilderWithClients({ defaultClientId }: { defaultClientId?: string }) {
  let clients: Awaited<ReturnType<typeof getClientsForSelect>> = []
  
  try {
    clients = await getClientsForSelect()
  } catch {
    clients = []
  }

  return <JobBuilderForm clients={clients} defaultClientId={defaultClientId} />
}

function JobBuilderSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

export default async function NewMissionPage({ searchParams }: NewMissionPageProps) {
  const { clientId } = await searchParams

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/missions">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle mission</h1>
          <p className="text-muted-foreground">
            Créez une fiche de poste multi-audience
          </p>
        </div>
      </div>

      {/* Job Builder Form */}
      <Suspense fallback={<JobBuilderSkeleton />}>
        <JobBuilderWithClients defaultClientId={clientId} />
      </Suspense>
    </div>
  )
}

