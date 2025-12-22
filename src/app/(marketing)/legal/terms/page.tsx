import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - ORCHESTR',
  description: 'Terms of service for ORCHESTR recruitment platform.',
}

export default function TermsPage() {
  return (
    <div className="pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-4">
              By accessing or using ORCHESTR (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              ORCHESTR is a recruitment orchestration platform that helps recruitment agencies manage clients, candidates, missions, and hiring processes. The Service includes web-based tools, portals, and related features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must provide accurate information when creating an account and keep it updated.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Upload malicious code or attempt to breach security</li>
              <li>Interfere with other users&apos; access to the Service</li>
              <li>Scrape or harvest data without authorization</li>
              <li>Resell access to the Service without permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Ownership</h2>
            <p className="text-muted-foreground mb-4">
              You retain ownership of all data you upload to the Service. By using the Service, you grant us a limited license to store, process, and display your data as necessary to provide the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Privacy and Data Protection</h2>
            <p className="text-muted-foreground mb-4">
              Our collection and use of personal information is governed by our{' '}
              <a href="/legal/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              . You are responsible for ensuring your use of the Service complies with applicable data protection laws, including GDPR.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Subscription and Payment</h2>
            <p className="text-muted-foreground mb-4">
              Paid plans are billed in advance on a monthly or annual basis. You may cancel at any time, with access continuing until the end of your billing period. Refunds are provided at our discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Service Availability</h2>
            <p className="text-muted-foreground mb-4">
              We strive to maintain high availability but do not guarantee uninterrupted access. We may modify, suspend, or discontinue features with reasonable notice when possible.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              To the maximum extent permitted by law, ORCHESTR shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Termination</h2>
            <p className="text-muted-foreground mb-4">
              We may terminate or suspend your account for violations of these terms. Upon termination, you may export your data for a reasonable period. After that, we may delete your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Changes to Terms</h2>
            <p className="text-muted-foreground mb-4">
              We may update these terms from time to time. We will notify you of significant changes via email or in-app notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Governing Law</h2>
            <p className="text-muted-foreground mb-4">
              These terms are governed by the laws of France. Any disputes shall be resolved in the courts of Paris, France.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact</h2>
            <p className="text-muted-foreground">
              Questions about these terms? Contact us at{' '}
              <a href="mailto:legal@orchestr.io" className="text-primary hover:underline">
                legal@orchestr.io
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
