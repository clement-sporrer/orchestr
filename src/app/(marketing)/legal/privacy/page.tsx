import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - ORCHESTR',
  description: 'Privacy policy for ORCHESTR recruitment platform.',
}

export default function PrivacyPage() {
  return (
    <div className="pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              ORCHESTR (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our recruitment orchestration platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
            <p className="text-gray-600 mb-4">
              When you create an account, we collect your name, email address, and organization details. This information is necessary to provide our services.
            </p>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">Candidate Data</h3>
            <p className="text-gray-600 mb-4">
              Our platform stores candidate information that you upload or enter, including names, contact details, work history, and other recruitment-related data. You are the data controller for this information.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mb-2">Usage Data</h3>
            <p className="text-gray-600 mb-4">
              We collect information about how you use our platform, including pages visited, features used, and actions taken. This helps us improve our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>To provide and maintain our platform</li>
              <li>To communicate with you about your account</li>
              <li>To improve and personalize your experience</li>
              <li>To ensure security and prevent fraud</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Sharing</h2>
            <p className="text-gray-600 mb-4">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Service providers who help us operate our platform</li>
              <li>Legal authorities when required by law</li>
              <li>Third parties with your explicit consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement industry-standard security measures including encryption at rest and in transit, access controls, and regular security audits. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 mb-4">
              Under GDPR and other applicable laws, you have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Object to certain processing activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-600 mb-4">
              We retain your data for as long as your account is active or as needed to provide services. You can configure retention policies for candidate data within your organization settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              For privacy-related questions or to exercise your rights, contact us at:
            </p>
            <p className="text-gray-600">
              <strong>Email:</strong>{' '}
              <a href="mailto:privacy@orchestr.io" className="text-blue-600 hover:underline">
                privacy@orchestr.io
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

