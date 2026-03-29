'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Users,
  Briefcase,
  Building2,
  Plus,
  Home,
  Settings,
  List,
} from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false)
    command()
  }, [onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Rechercher ou exécuter une action..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        
        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Tableau de bord</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/candidates'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Candidats</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/missions'))}>
            <Briefcase className="mr-2 h-4 w-4" />
            <span>Missions</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/clients'))}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Clients</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/pools'))}>
            <List className="mr-2 h-4 w-4" />
            <span>Pools</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Quick actions */}
        <CommandGroup heading="Actions rapides">
          <CommandItem onSelect={() => runCommand(() => router.push('/candidates/new'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Nouveau candidat</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>N
            </kbd>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/missions/new'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Nouvelle mission</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>M
            </kbd>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/clients/new'))}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Nouveau client</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Settings */}
        <CommandGroup heading="Paramètres">
          <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

/**
 * Hook to use command palette
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      // Quick actions
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        window.location.href = '/candidates/new'
      }
      if (e.key === 'm' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        window.location.href = '/missions/new'
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return { open, setOpen }
}
