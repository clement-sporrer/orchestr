import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { getClients, type ClientWithCount } from '@/lib/actions/clients'
import { ClientsListWithViews } from '@/components/clients/clients-list-views'

interface ClientsPageProps {
  searchParams: Promise<{ search?: string }>
}

async function ClientsList({ search }: { search?: string }) {
  let clients: ClientWithCount[] = []
  
  try {
    const result = await getClients(search, 1, 50)
    clients = result.clients
  } catch {
    clients = []
  }

  return <ClientsListWithViews clients={clients} search={search} />
}

function ClientsListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-40 w-full rounded-lg" />
      ))}
    </div>
  )
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { search } = await searchParams

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Gérez vos comptes clients et contacts
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau client
          </Link>
        </Button>
      </div>

      {/* Search */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="search"
          placeholder="Rechercher un client..."
          defaultValue={search}
          className="pl-10"
        />
      </form>

      {/* Clients List */}
      <Suspense fallback={<ClientsListSkeleton />}>
        <ClientsList search={search} />
      </Suspense>
    </div>
  )
}



