'use client'

import { useState } from 'react'
import { Loader2, Play, Pause, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateMissionStatus } from '@/lib/actions/missions'
import { toast } from 'sonner'
import type { MissionStatus } from '@/generated/prisma'

interface MissionStatusActionsProps {
  missionId: string
  currentStatus: MissionStatus
}

export function MissionStatusActions({ missionId, currentStatus }: MissionStatusActionsProps) {
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (status: MissionStatus) => {
    setLoading(true)
    try {
      await updateMissionStatus(missionId, status)
      toast.success('Statut mis à jour')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === 'CLOSED_FILLED' || currentStatus === 'CLOSED_CANCELLED') {
    return (
      <Button
        variant="outline"
        onClick={() => handleStatusChange('ACTIVE')}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
        Réouvrir
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Changer le statut
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {currentStatus !== 'ACTIVE' && (
          <DropdownMenuItem onClick={() => handleStatusChange('ACTIVE')}>
            <Play className="mr-2 h-4 w-4 text-green-600" />
            Activer
          </DropdownMenuItem>
        )}
        {currentStatus !== 'ON_HOLD' && currentStatus !== 'DRAFT' && (
          <DropdownMenuItem onClick={() => handleStatusChange('ON_HOLD')}>
            <Pause className="mr-2 h-4 w-4 text-yellow-600" />
            Mettre en pause
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleStatusChange('CLOSED_FILLED')}>
          <CheckCircle className="mr-2 h-4 w-4 text-blue-600" />
          Marquer comme pourvue
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange('CLOSED_CANCELLED')}>
          <XCircle className="mr-2 h-4 w-4 text-red-600" />
          Annuler la mission
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}





