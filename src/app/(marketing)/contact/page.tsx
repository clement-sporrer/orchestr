'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Loader2, Mail, Building2, MessageSquare } from 'lucide-react'

const reasons = [
  { value: 'demo', label: 'Request a demo' },
  { value: 'pricing', label: 'Pricing question' },
  { value: 'support', label: 'Support inquiry' },
  { value: 'partnership', label: 'Partnership opportunity' },
]

export default function ContactPage() {
  const searchParams = useSearchParams()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')

  // Prefill reason from URL
  useEffect(() => {
    const urlReason = searchParams.get('reason')
    if (urlReason && reasons.some(r => r.value === urlReason)) {
      setReason(urlReason)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // For now, simulate a submission delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-2xl border border-border p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Message received!
            </h1>
            <p className="text-muted-foreground mb-6">
              Thank you for reaching out. We typically respond within one business day. Check your inbox for a confirmation email.
            </p>
            <div className="bg-muted/50 rounded-xl p-4 text-left">
              <h3 className="font-medium text-foreground mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">1.</span>
                  Our team reviews your request
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">2.</span>
                  We reach out to schedule a call or provide information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">3.</span>
                  For demos, we prepare a personalized walkthrough
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left column - Info */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Get in touch
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Have a question or want to see ORCHESTR in action? Fill out the form and we will be in touch shortly.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Email us directly</h3>
                  <a href="mailto:hello@orchestr.io" className="text-primary hover:text-primary/80">
                    hello@orchestr.io
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">For agencies</h3>
                  <p className="text-muted-foreground text-sm">
                    We work with recruitment agencies of all sizes across Europe.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Response time</h3>
                  <p className="text-muted-foreground text-sm">
                    We typically respond within one business day.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Form */}
          <div>
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-8">
              <div className="space-y-5">
                <div>
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Jean Dupont"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="jean@agency.com"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    placeholder="Recruitment Agency"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason for contact</Label>
                  <Select value={reason} onValueChange={setReason} required>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {reasons.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Tell us about your needs..."
                    rows={4}
                    className="mt-1.5"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send message'
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By submitting, you agree to our{' '}
                  <a href="/legal/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
