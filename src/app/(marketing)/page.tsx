import { HeroSection } from '@/components/marketing/hero-section'
import { TestimonialStrip } from '@/components/marketing/testimonial-strip'
import { Steps } from '@/components/marketing/steps'
import { FeatureGrid } from '@/components/marketing/feature-grid'
import { CTASection } from '@/components/marketing/cta-section'
import {
  Briefcase,
  Search,
  Calendar,
  CheckCircle,
  Zap,
  RefreshCw,
  Database,
  Smile,
} from 'lucide-react'

export default function HomePage() {
  return (
    <>
      <HeroSection
        title="The recruitment platform that works like you do"
        subtitle="ORCHESTR brings together your clients, candidates, and processes in one simple system. No more scattered tools, no more lost data. Just focused, efficient recruiting."
        primaryCta={{ label: 'Request access', href: '/contact?reason=demo' }}
        secondaryCta={{ label: 'Log in', href: '/login' }}
      />

      <TestimonialStrip
        logos={[
          { name: 'Talent Partners' },
          { name: 'SearchPro' },
          { name: 'HireFirst' },
          { name: 'RecruteursPro' },
          { name: 'TopSearch' },
        ]}
      />

      <Steps
        title="How ORCHESTR works"
        subtitle="Four simple steps to transform your recruitment process"
        steps={[
          {
            number: 1,
            title: 'Create your mission',
            description: 'Build structured job posts with visibility controls for clients and candidates. Everything in one place.',
            icon: Briefcase,
          },
          {
            number: 2,
            title: 'Source candidates',
            description: 'Import from CSV, search your talent pool, or add profiles manually. Automatic deduplication keeps your data clean.',
            icon: Search,
          },
          {
            number: 3,
            title: 'Interview with ease',
            description: 'Candidates book their own interviews through integrated Calendly. Complete questionnaires before meetings.',
            icon: Calendar,
          },
          {
            number: 4,
            title: 'Present and close',
            description: 'Share polished shortlists with clients. Collect structured feedback and move to offer faster.',
            icon: CheckCircle,
          },
        ]}
      />

      <FeatureGrid
        title="Why agencies choose ORCHESTR"
        subtitle="Built for recruiters who value their time and their candidates"
        features={[
          {
            title: 'Move faster',
            description: 'Every frequent action is 1 to 3 clicks away. No training needed, no complex menus. Just get work done.',
            icon: Zap,
          },
          {
            title: 'Stay consistent',
            description: 'Standardized job posts and shortlists mean professional deliverables every time. Your brand, elevated.',
            icon: RefreshCw,
          },
          {
            title: 'Build your talent pool',
            description: 'Every candidate you touch becomes part of your searchable database. Import anytime, reuse forever.',
            icon: Database,
          },
          {
            title: 'Delight candidates',
            description: 'Mobile-friendly portals guide candidates through profile completion, job details, and interview booking.',
            icon: Smile,
          },
        ]}
        columns={4}
      />

      {/* Screenshot section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              A clean interface for focused work
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need, nothing you do not. ORCHESTR is designed for recruiters who want to spend time on candidates, not on software.
            </p>
          </div>
          
          {/* Screenshot placeholder */}
          <div className="relative aspect-[16/9] max-w-5xl mx-auto bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-400">Dashboard screenshot</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to simplify your recruiting?"
        subtitle="Request a demo and see how ORCHESTR can work for your agency."
        primaryCta={{ label: 'Request access', href: '/contact?reason=demo' }}
        secondaryCta={{ label: 'Learn more', href: '/product' }}
      />
    </>
  )
}

