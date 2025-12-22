import { HeroSection } from '@/components/marketing/hero-section'
import { FeatureSection } from '@/components/marketing/feature-section'
import { CTASection } from '@/components/marketing/cta-section'
import {
  FileText,
  Users,
  Kanban,
  UserCircle,
  Building2,
  Sparkles,
} from 'lucide-react'

export const metadata = {
  title: 'Product - ORCHESTR',
  description: 'Discover how ORCHESTR helps recruitment agencies work smarter with structured job posts, candidate management, and client collaboration.',
}

export default function ProductPage() {
  return (
    <>
      <HeroSection
        title="Everything you need to run your agency"
        subtitle="ORCHESTR combines the tools you already use into one coherent system. No more switching between apps, no more lost information."
      />

      <FeatureSection
        id="job-builder"
        badge="Job Builder"
        title="Structured job posts for every audience"
        description="Create once, share everywhere. Our multi-audience system lets you control exactly what clients and candidates see, while keeping internal notes private."
        bullets={[
          'Context and responsibilities with visibility controls',
          'Must-have and nice-to-have requirements clearly separated',
          'Internal red flags visible only to your team',
          'Process steps shared with clients, not candidates',
          'Salary ranges shown or hidden per audience',
        ]}
        icon={FileText}
        imagePosition="right"
      />

      <div className="bg-gray-50">
        <FeatureSection
          id="candidates"
          badge="Candidate Database"
          title="Your talent pool, always growing"
          description="Every candidate you interact with becomes part of your searchable database. Import from any source, find duplicates automatically, and reuse profiles across missions."
          bullets={[
            'CSV import to vivier, pool, or mission',
            'Automatic deduplication by email, phone, or profile URL',
            'Tags and status tracking across all interactions',
            'Full history of every touchpoint',
            'GDPR-compliant export and deletion',
          ]}
          icon={Users}
          imagePosition="left"
        />
      </div>

      <FeatureSection
        id="pipeline"
        badge="Pipeline Management"
        title="Visual tracking, real-time updates"
        description="Move candidates through your process with drag-and-drop simplicity. See exactly where every candidate stands, for every mission."
        bullets={[
          'Kanban board with customizable stages',
          'List view for bulk actions',
          'Contact status and response tracking',
          'Notes and interactions logged per candidate',
          'Score and ranking to prioritize outreach',
        ]}
        icon={Kanban}
        imagePosition="right"
      />

      <div className="bg-gray-50">
        <FeatureSection
          id="candidate-portal"
          badge="Candidate Portal"
          title="A guided experience for every candidate"
          description="Candidates receive a simple link to complete their profile, review the job, book interviews, and answer questionnaires. Mobile-friendly and jargon-free."
          bullets={[
            'Profile completion with progress indicator',
            'Job post view tailored to candidate audience',
            'Calendly integration for self-service booking',
            'Custom questionnaires per mission',
            'Consent capture for GDPR compliance',
          ]}
          icon={UserCircle}
          imagePosition="left"
        />
      </div>

      <FeatureSection
        id="client-portal"
        badge="Client Portal"
        title="Shortlists that get feedback"
        description="Share curated candidate lists with clients through secure links. Collect structured feedback without endless email chains."
        bullets={[
          'Professional shortlist presentation',
          'Candidate summaries customized for each client',
          'Three-option feedback: OK, To discuss, No',
          'Comments captured and linked to pipeline',
          'Automatic status updates when feedback is received',
        ]}
        icon={Building2}
        imagePosition="right"
      />

      <div className="bg-gray-50">
        <FeatureSection
          id="ai"
          badge="AI Assistance"
          title="Smart features that save time"
          description="ORCHESTR uses AI to help with repetitive tasks. Structure profiles from raw text, score candidates against requirements, and draft personalized messages."
          bullets={[
            'Profile structuring from LinkedIn or CV text',
            'Candidate scoring based on must-have criteria',
            'Message generation for initial outreach',
            'Suggested follow-ups based on interaction history',
            'Fair-use AI with transparent limits',
          ]}
          icon={Sparkles}
          imagePosition="left"
        />
      </div>

      <CTASection
        title="Ready to try ORCHESTR?"
        subtitle="Start your 14-day free trial. No credit card required."
        primaryCta={{ label: 'Start free trial', href: '/signup' }}
        secondaryCta={{ label: 'View pricing', href: '/pricing' }}
      />
    </>
  )
}

