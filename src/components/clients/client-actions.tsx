'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditClientDialog } from './edit-client-dialog'
import { DeleteClientDialog } from './delete-client-dialog'

interface Client {
  id: string
  companyName: string
  category?: string | null
  sector: string | null
  website: string | null
  notes: string | null
}

interface ClientActionsProps {
  client: Client
  clientCategories?: string[]
}

export function ClientActions({ client, clientCategories = [] }: ClientActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const displayName = client.companyName

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onSelect={() => setDeleteOpen(true)}
            className="text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditClientDialog 
        client={client} 
        clientCategories={clientCategories}
        open={editOpen} 
        onOpenChange={setEditOpen}
      />
      <DeleteClientDialog 
        clientId={client.id} 
        clientName={displayName}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}

