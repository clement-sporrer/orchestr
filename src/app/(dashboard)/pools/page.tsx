import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, FolderKanban, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getPools } from '@/lib/actions/pools'
import { CreatePoolDialog } from '@/components/pools/create-pool-dialog'

async function PoolsList() {
  let pools: Awaited<ReturnType<typeof getPools>> = []
  
  try {
    pools = await getPools()
  } catch {
    pools = []
  }

  if (pools.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun pool</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            Les pools vous permettent de segmenter votre vivier de candidats
          </p>
          <CreatePoolDialog>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Créer un pool
            </Button>
          </CreatePoolDialog>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {pools.map((pool) => (
        <Link key={pool.id} href={`/pools/${pool.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-primary" />
                {pool.name}
              </CardTitle>
              {pool.description && (
                <CardDescription>{pool.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {pool._count.candidates} candidat{pool._count.candidates !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function PoolsListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function PoolsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pools</h1>
          <p className="text-muted-foreground">
            Segmentez votre vivier de candidats
          </p>
        </div>
        <CreatePoolDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau pool
          </Button>
        </CreatePoolDialog>
      </div>

      <Suspense fallback={<PoolsListSkeleton />}>
        <PoolsList />
      </Suspense>
    </div>
  )
}



