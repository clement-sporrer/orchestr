'use client'

import { useState } from 'react'
import { Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddToMissionDialog } from './add-to-mission-dialog'

interface AddToMissionButtonProps {
  candidateId: string
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

export function AddToMissionButton({
  candidateId,
  variant = 'outline',
  size = 'default',
  className,
  children,
}: AddToMissionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children ?? (
          <>
            <Briefcase className="mr-2 h-4 w-4" />
            Ajouter à une mission
          </>
        )}
      </Button>
      <AddToMissionDialog
        candidateIds={[candidateId]}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => setOpen(false)}
      />
    </>
  )
}
