'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    if (!name.trim()) {
      setError('Please enter your name')
      return false
    }
    if (!email.trim()) {
      setError('Please enter your email')
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (!acceptTerms) {
      setError('Please accept the terms and privacy policy')
      return false
    }
    return true
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) return
    
    setLoading(true)

    try {
      const supabase = createClient()
      
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('An account with this email already exists. Try signing in.')
        } else {
          setError(authError.message)
        }
        return
      }

      // Redirect to check email page
      router.push('/check-email?email=' + encodeURIComponent(email))
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start your free trial of ORCHESTR"
    >
      <form onSubmit={handleSignup} className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Jean Dupont"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            disabled={loading}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="jean@agency.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Must be at least 8 characters
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked === true)}
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
            I agree to the{' '}
            <Link href="/legal/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
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
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}
