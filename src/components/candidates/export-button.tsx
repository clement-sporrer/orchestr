'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportCandidatesCsv } from '@/lib/actions/exports'
import { toast } from 'sonner'

interface ExportButtonProps {
  filters?: {
    tags?: string[]
    status?: string
    poolId?: string
  }
  className?: string
}

export function ExportButton({ filters, className }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const csv = await exportCandidatesCsv(filters)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `candidats-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Export réussi')
    } catch (err) {
      toast.error('Erreur lors de l\'export')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Export...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </>
      )}
    </Button>
  )
}



