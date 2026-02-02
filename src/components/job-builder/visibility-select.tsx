'use client'

import { Eye, Users, Building2, UserCircle, Lock } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Visibility } from '@/generated/prisma'

interface VisibilitySelectProps {
  value: Visibility
  onChange: (value: Visibility) => void
}

const visibilityOptions: { value: Visibility; label: string; icon: React.ReactNode }[] = [
  { value: 'INTERNAL', label: 'Interne', icon: <Lock className="h-3 w-3" /> },
  { value: 'INTERNAL_CLIENT', label: 'Interne + Client', icon: <Building2 className="h-3 w-3" /> },
  { value: 'INTERNAL_CANDIDATE', label: 'Interne + Candidat', icon: <UserCircle className="h-3 w-3" /> },
  { value: 'ALL', label: 'Tout le monde', icon: <Users className="h-3 w-3" /> },
]

export function VisibilitySelect({ value, onChange }: VisibilitySelectProps) {
  const selected = visibilityOptions.find((o) => o.value === value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48 h-8 text-xs">
        <Eye className="mr-2 h-3 w-3" />
        <SelectValue>
          <span className="flex items-center gap-2">
            {selected?.icon}
            {selected?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {visibilityOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              {option.icon}
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}





