'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { AuthCard } from '@/components/auth/auth-card'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'

export default function CheckEmailPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const type = searchParams.get('type') || 'signup'
  
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    if (!email) return
    
    setResending(true)
    
    try {
      const supabase = createClient()
      
      if (type === 'reset') {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        })
      } else {
        await supabase.auth.resend({
          type: 'signup',
          email,
        })
      }
      
      setResent(true)
    } catch {
      // Silently fail - we don't want to reveal if email exists
    } finally {
      setResending(false)
    }
  }

  const isReset = type === 'reset'
  const title = isReset ? 'Check your email' : 'Verify your email'
  const subtitle = isReset
    ? 'We sent a password reset link to your email'
    : 'We sent a verification link to your email'

  return (
    <AuthCard title={title} subtitle={subtitle} showBackLink={false}>
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>

        {email && (
          <p className="text-gray-600 mb-6">
            We sent an email to{' '}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        )}

        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
          <p className="text-sm text-gray-600 mb-3">
            {isReset
              ? 'Click the link in the email to reset your password. The link expires in 1 hour.'
              : 'Click the link in the email to verify your account and complete registration.'}
          </p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>Check your spam folder if you do not see it</li>
            <li>Make sure you entered the correct email</li>
          </ul>
        </div>

        {resent ? (
          <div className="flex items-center justify-center gap-2 text-green-600 mb-6">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Email sent again</span>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending || !email}
            className="mb-6"
          >
            {resending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resending...
              </>
            ) : (
              'Resend email'
            )}
          </Button>
        )}

        <div className="pt-4 border-t border-gray-100">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthCard>
  )
}

