'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

function LoginForm() {
  const t = useTranslations('auth.login')
  const tErrors = useTranslations('auth.errors')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? tErrors('invalidCredentials')
            : error.message
        )
        return
      }

      router.push(redirect)
      router.refresh()
    } catch {
      setError(tErrors('generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title={t('title')}
      subtitle={t('subtitle')}
    >
      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
            className="mt-1.5"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="password">{t('password')}</Label>
            <Link
              href="/reset-password"
              className="text-sm text-primary hover:text-primary/80"
            >
              {t('forgotPassword')}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            {t('rememberMe')}
          </label>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('submit')}...
            </>
          ) : (
            t('submit')
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t('noAccount')}{' '}
          <Link href="/signup" className="text-primary hover:text-primary/80 font-medium">
            {t('signupLink')}
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthCard title="" subtitle="">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthCard>
    }>
      <LoginForm />
    </Suspense>
  )
}
