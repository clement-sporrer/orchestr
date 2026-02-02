'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateCandidateStatus } from '@/lib/actions/candidates'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CandidateStatus } from '@/generated/prisma'

interface CandidateStatusBadgeProps {
  candidateId: string
  status: CandidateStatus
}

const statusLabels: Record<CandidateStatus, string> = {
  ACTIVE: 'Actif',
  TO_RECONTACT: 'À recontacter',
  BLACKLIST: 'Blacklist',
  DELETED: 'Supprimé',
}

const statusColors: Record<CandidateStatus, string> = {
  ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20',
  TO_RECONTACT: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20',
  BLACKLIST: 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20',
  DELETED: 'bg-gray-500/10 text-gray-600 border-gray-500/20 hover:bg-gray-500/20',
}

export function CandidateStatusBadge({ candidateId, status }: CandidateStatusBadgeProps) {
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: CandidateStatus) => {
    if (newStatus === status) return
    
    setLoading(true)
    try {
      await updateCandidateStatus(candidateId, newStatus)
      toast.success('Statut mis à jour')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={loading}>
        <Badge 
          className={cn(
            "cursor-pointer transition-colors",
            statusColors[status]
          )}
        >
          {statusLabels[status]}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {(Object.keys(statusLabels) as CandidateStatus[])
          .filter((s) => s !== 'DELETED')
          .map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={() => handleStatusChange(s)}
              className={cn(
                s === status && "bg-muted"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full mr-2",
                s === 'ACTIVE' && "bg-green-500",
                s === 'TO_RECONTACT' && "bg-yellow-500",
                s === 'BLACKLIST' && "bg-red-500"
              )} />
              {statusLabels[s]}
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}





