'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get plan from URL params (from pricing page)
  const selectedPlan = searchParams.get('plan')?.toUpperCase() || null
  const selectedPeriod = searchParams.get('period') || 'annual'

  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const planLabels: Record<string, string> = {
    CORE: 'Core',
    PRO: 'Pro',
  }

  const validateForm = () => {
    if (!name.trim()) {
      setError('Veuillez entrer votre nom')
      return false
    }
    if (!organizationName.trim()) {
      setError('Veuillez entrer le nom de votre entreprise')
      return false
    }
    if (!email.trim()) {
      setError('Veuillez entrer votre email')
      return false
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres')
      return false
    }
    if (!acceptTerms) {
      setError('Veuillez accepter les conditions d\'utilisation')
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

      // Store plan info in user metadata for later
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            organization_name: organizationName,
            selected_plan: selectedPlan,
            selected_period: selectedPeriod,
          },
          emailRedirectTo: selectedPlan
            ? `${window.location.origin}/auth/callback?plan=${selectedPlan}&period=${selectedPeriod}`
            : `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Un compte existe deja avec cet email. Essayez de vous connecter.')
        } else {
          setError(authError.message)
        }
        return
      }

      // Redirect to check email page with plan info
      const checkEmailUrl = new URL('/check-email', window.location.origin)
      checkEmailUrl.searchParams.set('email', email)
      if (selectedPlan) {
        checkEmailUrl.searchParams.set('plan', selectedPlan)
        checkEmailUrl.searchParams.set('period', selectedPeriod)
      }
      router.push(checkEmailUrl.toString())
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Creez votre compte"
      subtitle={
        selectedPlan
          ? `Commencez votre essai gratuit de 14 jours avec le plan ${planLabels[selectedPlan] || selectedPlan}`
          : 'Demarrez votre essai gratuit de ORCHESTR'
      }
    >
      {selectedPlan && (
        <div className="mb-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Plan <strong>{planLabels[selectedPlan] || selectedPlan}</strong>{' '}
              {selectedPeriod === 'annual' ? '(facturation annuelle)' : '(facturation mensuelle)'}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-5">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div>
          <Label htmlFor="name">Votre nom complet</Label>
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
          <Label htmlFor="organization">Nom de votre entreprise</Label>
          <Input
            id="organization"
            type="text"
            placeholder="Cabinet Recrutement SA"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            required
            autoComplete="organization"
            disabled={loading}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="email">Email professionnel</Label>
          <Input
            id="email"
            type="email"
            placeholder="jean@cabinet.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="Au moins 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
            className="mt-1.5"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Minimum 8 caracteres
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
            J&apos;accepte les{' '}
            <Link href="/legal/terms" className="text-primary hover:underline">
              Conditions d&apos;utilisation
            </Link>{' '}
            et la{' '}
            <Link href="/legal/privacy" className="text-primary hover:underline">
              Politique de confidentialite
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
              Creation en cours...
            </>
          ) : selectedPlan ? (
            'Continuer vers le paiement'
          ) : (
            'Creer mon compte'
          )}
        </Button>
      </form>

      {selectedPlan && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Vous ne serez pas debite avant la fin de votre essai de 14 jours.
          <br />
          Annulez a tout moment.
        </p>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Vous avez deja un compte ?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
            Connectez-vous
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <AuthCard title="Creez votre compte" subtitle="Chargement...">
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AuthCard>
    }>
      <SignupForm />
    </Suspense>
  )
}
