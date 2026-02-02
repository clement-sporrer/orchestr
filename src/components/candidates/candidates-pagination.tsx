'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CandidatesPaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  baseParams: Record<string, string>
}

export function CandidatesPagination({
  page,
  totalPages,
  total,
  limit,
  baseParams,
}: CandidatesPaginationProps) {
  if (totalPages <= 1) return null

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams(baseParams)
    if (newPage > 1) params.set('page', String(newPage))
    else params.delete('page')
    const q = params.toString()
    return q ? `/candidates?${q}` : '/candidates'
  }

  return (
    <nav
      className="flex items-center justify-between gap-4 px-1 py-3"
      aria-label="Pagination des candidats"
    >
      <p className="text-sm text-muted-foreground">
        {from}–{to} sur {total}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild disabled={page <= 1}>
          <Link href={buildUrl(page - 1)} aria-label="Page précédente">
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          Page {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
          <Link href={buildUrl(page + 1)} aria-label="Page suivante">
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </nav>
  )
}
