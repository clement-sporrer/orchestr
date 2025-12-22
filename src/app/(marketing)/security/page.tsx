import { HeroSection } from '@/components/marketing/hero-section'
import { FeatureGrid } from '@/components/marketing/feature-grid'
import { CTASection } from '@/components/marketing/cta-section'
import {
  Shield,
  Lock,
  Key,
  Eye,
  FileText,
  Clock,
  Link2,
  AlertTriangle,
} from 'lucide-react'

export const metadata = {
  title: 'Security - ORCHESTR',
  description: 'Learn how ORCHESTR protects your data with encryption, access controls, and GDPR compliance.',
}

export default function SecurityPage() {
  return (
    <>
      <HeroSection
        title="Security you can trust"
        subtitle="Your data and your candidates' data deserve the highest protection. Here is how we keep everything safe."
      />

      <FeatureGrid
        title="Data protection"
        subtitle="Built on industry-standard security practices"
        features={[
          {
            title: 'Encrypted storage',
            description: 'All data is stored in PostgreSQL with encryption at rest. Your information is protected even at the database level.',
            icon: Shield,
          },
          {
            title: 'Secure transit',
            description: 'All connections use TLS 1.3 encryption. Data in motion is protected from interception.',
            icon: Lock,
          },
          {
            title: 'Access controls',
            description: 'Role-based permissions ensure users only see what they need. Admin controls for sensitive operations.',
            icon: Key,
          },
          {
            title: 'Audit logging',
            description: 'Key actions are logged for compliance and troubleshooting. Know who did what and when.',
            icon: Eye,
          },
        ]}
        columns={4}
      />

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                GDPR compliance
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We take privacy seriously. ORCHESTR is designed to help you meet your GDPR obligations.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-muted/50 rounded-2xl p-6 border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Data export</h3>
                    <p className="text-muted-foreground">
                      Candidates can request a complete export of their data. You can generate exports in standard formats (JSON, CSV) with one click.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-2xl p-6 border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Right to deletion</h3>
                    <p className="text-muted-foreground">
                      Honor deletion requests easily. Soft-delete preserves audit trails while removing personal data. Full purge available when needed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-2xl p-6 border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Data retention</h3>
                    <p className="text-muted-foreground">
                      Configure retention policies per organization. Automatic flagging of candidates approaching retention limits. Clear workflow for re-consent or deletion.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Portal security
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Candidate and client portals are designed with security in mind.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Tokenized access</h3>
                    <p className="text-muted-foreground">
                      Each portal link contains a unique, cryptographically secure token. No passwords to remember, no accounts to create.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Automatic expiration</h3>
                    <p className="text-muted-foreground">
                      Portal links expire after a configurable period. Old links stop working automatically, reducing risk of unauthorized access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Key className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Manual revocation</h3>
                    <p className="text-muted-foreground">
                      Revoke any portal link instantly from your dashboard. If a link is shared incorrectly, you can disable it immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Report a vulnerability
          </h2>
          <p className="text-muted-foreground mb-6">
            Found a security issue? We appreciate responsible disclosure. Please reach out to our security team.
          </p>
          <a
            href="mailto:security@orchestr.io"
            className="text-primary hover:text-primary/80 font-medium"
          >
            security@orchestr.io
          </a>
        </div>
      </section>

      <CTASection
        title="Questions about security?"
        subtitle="Our team is happy to discuss your specific requirements and compliance needs."
        primaryCta={{ label: 'Contact us', href: '/contact?reason=support' }}
      />
    </>
  )
}
