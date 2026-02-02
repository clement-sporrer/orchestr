import { Suspense } from 'react'
import Link from 'next/link'
import { Plus, Building2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getClients, type ClientWithCount } from '@/lib/actions/clients'

interface ClientsPageProps {
  searchParams: Promise<{ search?: string }>
}

async function ClientsList({ search }: { search?: string }) {
  let clients: ClientWithCount[] = []
  
  try {
    const result = await getClients(search, 1, 50)
    clients = result.clients
  } catch {
    // Handle case when database is not connected
    clients = []
  }

  if (clients.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Aucun client</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
            {search 
              ? `Aucun client ne correspond à "${search}"`
              : 'Créez votre premier client pour commencer à gérer vos missions.'
            }
          </p>
          {!search && (
            <Button asChild className="mt-4">
              <Link href="/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                Créer un client
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <Link key={client.id} href={`/clients/${client.id}`}>
          <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {client.companyName ?? client.name}
              </CardTitle>
              {(client.category ?? client.sector) && (
                <CardDescription>{client.category ?? client.sector}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{client._count.missions} mission{client._count.missions !== 1 ? 's' : ''}</span>
                <span>{client._count.contacts} contact{client._count.contacts !== 1 ? 's' : ''}</span>
              </div>
              {client.notes && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {client.notes}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function ClientsListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
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



