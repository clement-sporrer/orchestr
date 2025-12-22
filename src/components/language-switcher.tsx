'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe } from 'lucide-react'
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config'
import { setLocale } from '@/lib/actions/locale'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  variant?: 'default' | 'minimal'
  className?: string
}

export function LanguageSwitcher({ variant = 'default', className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale
  const [isPending, startTransition] = useTransition()

  const handleLocaleChange = (newLocale: Locale) => {
    startTransition(() => {
      setLocale(newLocale)
    })
  }

  if (variant === 'minimal') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-9 w-9', className)}
            disabled={isPending}
          >
            <Globe className="h-4 w-4" />
            <span className="sr-only">Change language</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {locales.map((l) => (
            <DropdownMenuItem
              key={l}
              onClick={() => handleLocaleChange(l)}
              className={cn(
                'cursor-pointer',
                l === locale && 'bg-accent'
              )}
            >
              <span className="mr-2">{localeFlags[l]}</span>
              {localeNames[l]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2', className)}
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span>{localeFlags[locale]}</span>
          <span className="hidden sm:inline">{localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleLocaleChange(l)}
            className={cn(
              'cursor-pointer',
              l === locale && 'bg-accent'
            )}
          >
            <span className="mr-2">{localeFlags[l]}</span>
            {localeNames[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}



