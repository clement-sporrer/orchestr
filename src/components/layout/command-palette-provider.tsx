'use client'

import { CommandPalette, useCommandPalette } from './command-palette'

export function CommandPaletteProvider() {
  const { open, setOpen } = useCommandPalette()

  return <CommandPalette open={open} onOpenChange={setOpen} />
}
