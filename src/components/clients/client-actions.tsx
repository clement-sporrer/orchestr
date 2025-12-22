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
  name: string
  sector: string | null
  website: string | null
  notes: string | null
}

interface ClientActionsProps {
  client: Client
}

export function ClientActions({ client }: ClientActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

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
        open={editOpen} 
        onOpenChange={setEditOpen}
      />
      <DeleteClientDialog 
        clientId={client.id} 
        clientName={client.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}

