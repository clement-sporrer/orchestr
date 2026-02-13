'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ViewToggle, type ViewMode } from '@/components/list-views/view-toggle'
import { BulkActionBar } from '@/components/list-views/bulk-action-bar'
import { deleteClient } from '@/lib/actions/clients'
import { toast } from 'sonner'
import type { ClientWithCount } from '@/lib/actions/clients'

interface ClientsListWithViewsProps {
  clients: ClientWithCount[]
  search?: string
}

export function ClientsListWithViews({ clients, search }: ClientsListWithViewsProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(clients.map((c) => c.id)))
    else setSelectedIds(new Set())
  }

  const allSelected = clients.length > 0 && selectedIds.size === clients.length
  const someSelected = selectedIds.size > 0

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setIsDeleting(true)
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteClient(id)))
      toast.success(`${selectedIds.size} client(s) supprimé(s)`)
      setSelectedIds(new Set())
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
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
              : 'Créez votre premier client pour commencer à gérer vos missions.'}
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {someSelected && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          onDelete={handleBulkDelete}
          isDeleting={isDeleting}
          entityLabel="client"
        />
      )}

      {viewMode === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <div key={client.id} className="relative flex items-start gap-3">
              <Checkbox
                checked={selectedIds.has(client.id)}
                onCheckedChange={() => toggleSelect(client.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-5 shrink-0"
                aria-label={`Sélectionner ${client.companyName ?? client.name}`}
              />
              <Link href={`/clients/${client.id}`} className="flex-1 min-w-0">
                <Card
                  data-testid="client-card"
                  className="hover:border-primary/50 transition-colors cursor-pointer h-full"
                >
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
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{client._count.missions} mission{client._count.missions !== 1 ? 's' : ''}</span>
                      {(client.activeMissionsCount ?? 0) > 0 && (
                        <span className="text-green-600 font-medium">{client.activeMissionsCount} active{(client.activeMissionsCount ?? 0) !== 1 ? 's' : ''}</span>
                      )}
                      {(client.placedCount ?? 0) > 0 && (
                        <span className="text-primary font-medium">{client.placedCount} placement{(client.placedCount ?? 0) !== 1 ? 's' : ''}</span>
                      )}
                      <span>{client._count.contacts} contact{client._count.contacts !== 1 ? 's' : ''}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                    aria-label="Tout sélectionner"
                  />
                </TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead className="hidden sm:table-cell">Catégorie / Secteur</TableHead>
                <TableHead>Missions</TableHead>
                <TableHead className="hidden md:table-cell">Actives</TableHead>
                <TableHead className="hidden lg:table-cell">Placements</TableHead>
                <TableHead className="hidden sm:table-cell">Contacts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(client.id)}
                      onCheckedChange={() => toggleSelect(client.id)}
                      aria-label={`Sélectionner ${client.companyName ?? client.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {client.companyName ?? client.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden sm:table-cell">
                    {[client.category, client.sector].filter(Boolean).join(' / ') || '-'}
                  </TableCell>
                  <TableCell>{client._count.missions}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {(client.activeMissionsCount ?? 0) > 0 ? (
                      <span className="text-green-600 font-medium">{client.activeMissionsCount}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {(client.placedCount ?? 0) > 0 ? (
                      <span className="text-primary font-medium">{client.placedCount}</span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{client._count.contacts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
