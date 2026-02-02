'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console with safe details (no sensitive data)
    console.error('[App Error]', {
      digest: error.digest,
      message: error.message,
      name: error.name,
      // Don't log full stack in production
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }, [error])

  // Determine if this is likely a database error
  const isDatabaseError = error.message?.includes('Prisma') ||
    error.message?.includes('database') ||
    error.message?.includes('connect') ||
    error.message?.includes('P1') ||
    error.message?.includes('P2') ||
    error.message?.includes('relation') ||
    error.message?.includes('column') ||
    error.message?.includes('does not exist')
  const showDevHint = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Une erreur est survenue</CardTitle>
          <CardDescription>
            {isDatabaseError
              ? 'Problème lié à la base de données. Vérifiez que les migrations Prisma ont été appliquées (npx prisma migrate deploy).'
              : 'Nous nous excusons pour ce désagrément. Notre équipe a été notifiée.'}
          </CardDescription>
          {showDevHint && error.message && (
            <p className="text-left text-xs text-muted-foreground mt-2 font-mono break-all">
              {error.message}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show digest for support reference */}
          {error.digest && (
            <div className="text-center text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
              Référence: {error.digest}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={reset} variant="default" className="flex-1">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Accueil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



