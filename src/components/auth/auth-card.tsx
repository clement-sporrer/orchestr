import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface AuthCardProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showBackLink?: boolean
}

export function AuthCard({
  children,
  title,
  subtitle,
  showBackLink = true,
}: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-primary">
            ORCHESTR
          </Link>
          {showBackLink && (
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to website
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ORCHESTR. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
