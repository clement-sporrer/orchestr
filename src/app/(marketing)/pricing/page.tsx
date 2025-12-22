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
                    ? 'bg-blue-600 text-white ring-4 ring-blue-600 ring-offset-4'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-800 text-white text-sm font-medium px-4 py-1 rounded-full">
                    Most popular
                  </span>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`mt-1 text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    {plan.price !== 'Custom' && (
                      <span className={`text-lg ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>€</span>
                    )}
                    <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                  </div>
                  <p className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-500'}`}>
                    {plan.period}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 flex-shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-blue-600'}`} />
                      <span className={`text-sm ${plan.highlighted ? 'text-blue-50' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`w-full ${
                    plan.highlighted
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Link href={plan.cta.href}>{plan.cta.label}</Link>
                </Button>
              </div>
            ))}
          </div>

          {/* Footnotes */}
          <div className="mt-16 max-w-2xl mx-auto">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Frequently asked questions
            </h4>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-6">
                <h5 className="font-medium text-gray-900 mb-2">What does fair-use AI mean?</h5>
                <p className="text-sm text-gray-600">
                  AI features like scoring and message generation are included in all plans. We monitor usage to ensure the system remains fast for everyone. Heavy users may be asked to upgrade or reduce usage. In practice, this only affects automated workflows, not normal daily use.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h5 className="font-medium text-gray-900 mb-2">Can I switch plans later?</h5>
                <p className="text-sm text-gray-600">
                  Yes. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle. Your data is always preserved.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h5 className="font-medium text-gray-900 mb-2">Is there a free trial?</h5>
                <p className="text-sm text-gray-600">
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

