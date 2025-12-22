import Link from 'next/link'
import { HeroSection } from '@/components/marketing/hero-section'
import { CTASection } from '@/components/marketing/cta-section'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

export const metadata = {
  title: 'Pricing - ORCHESTR',
  description: 'Simple, transparent pricing for recruitment agencies of all sizes.',
}

const plans = [
  {
    name: 'Core',
    description: 'For small agencies getting started',
    price: '49',
    period: 'per user/month',
    features: [
      'Up to 3 users',
      'Unlimited missions',
      'Candidate database',
      'CSV import',
      'Pipeline management',
      'Candidate portal',
      'Client shortlists',
      'Basic AI features (fair-use)',
      'Email support',
    ],
    cta: { label: 'Request access', href: '/contact?reason=demo' },
    highlighted: false,
  },
  {
    name: 'Pro',
    description: 'For growing agencies with more needs',
    price: '89',
    period: 'per user/month',
    features: [
      'Unlimited users',
      'Everything in Core',
      'Advanced AI features',
      'Custom questionnaires',
      'Analytics dashboard',
      'API access',
      'Priority support',
      'Dedicated onboarding',
    ],
    cta: { label: 'Contact sales', href: '/contact?reason=pricing' },
    highlighted: true,
  },
  {
    name: 'White-label',
    description: 'Your brand, our platform',
    price: 'Custom',
    period: 'tailored to your needs',
    features: [
      'Everything in Pro',
      'Custom branding',
      'Custom domain',
      'White-labeled portals',
      'Custom integrations',
      'SLA guarantee',
      'Dedicated account manager',
      'Training sessions',
    ],
    cta: { label: 'Contact sales', href: '/contact?reason=pricing' },
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <>
      <HeroSection
        title="Simple pricing, no surprises"
        subtitle="Choose the plan that fits your agency. All plans include core features. Upgrade or downgrade anytime."
      />

      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary ring-offset-4 ring-offset-background'
                    : 'bg-card border border-border'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-foreground text-background text-sm font-medium px-4 py-1 rounded-full">
                    Most popular
                  </span>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {plan.name}
                  </h3>
                  <p className={`mt-1 text-sm ${plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    {plan.price !== 'Custom' && (
                      <span className={`text-lg ${plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>€</span>
                    )}
                    <span className={`text-4xl font-bold ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {plan.price}
                    </span>
                  </div>
                  <p className={`text-sm ${plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {plan.period}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 ${plan.highlighted ? 'text-primary-foreground/80' : 'text-primary'}`} />
                      <span className={`text-sm ${plan.highlighted ? 'text-primary-foreground/90' : 'text-foreground/80'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  variant={plan.highlighted ? 'secondary' : 'default'}
                  className="w-full"
                >
                  <Link href={plan.cta.href}>{plan.cta.label}</Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Footnotes */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-foreground mb-4 text-center">
              Frequently asked questions
            </h4>
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-xl p-6">
                <h5 className="font-medium text-foreground mb-2">What does fair-use AI mean?</h5>
                <p className="text-sm text-muted-foreground">
                  AI features like scoring and message generation are included in all plans. We monitor usage to ensure the system remains fast for everyone. Heavy users may be asked to upgrade or reduce usage. In practice, this only affects automated workflows, not normal daily use.
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-6">
                <h5 className="font-medium text-foreground mb-2">Can I switch plans later?</h5>
                <p className="text-sm text-muted-foreground">
                  Yes. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle. Your data is always preserved.
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-6">
                <h5 className="font-medium text-foreground mb-2">Is there a free trial?</h5>
                <p className="text-sm text-muted-foreground">
                  We offer personalized demos and pilot programs for agencies evaluating ORCHESTR. Contact us to discuss your needs and we will find the right approach.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="Not sure which plan is right?"
        subtitle="Talk to our team and we will help you find the best fit for your agency."
        primaryCta={{ label: 'Contact sales', href: '/contact?reason=pricing' }}
      />
    </>
  )
}
