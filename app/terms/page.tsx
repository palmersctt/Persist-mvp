import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-light text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Effective Date: March 7, 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using PERSISTWORK (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">2. Service Description</h2>
            <p>
              PERSISTWORK reads your Google Calendar and scores your day across three dimensions: Focus (how much
              deep work your schedule allows), Strain (the cognitive load from meetings, context switches, and
              back-to-backs), and Balance (how sustainable and well-paced your day is). Based on these scores,
              the Service detects your daily mood and pairs it with a quote that fits. The Service:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Provides real-time Focus, Strain, and Balance scores based on your calendar</li>
              <li>Detects your daily mood — from Flow State to Survival Mode</li>
              <li>Generates a shareable daily card with humor that matches your vibe</li>
              <li>Stores a minimal account profile to support your experience across sessions</li>
              <li>Records anonymized in-app usage events to improve the product</li>
              <li>Does not store your calendar data permanently</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">3. User Accounts and Authentication</h2>
            <p>
              To use PERSISTWORK, you must authenticate using your Google account. By doing so, you:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Authorize us to access your Google Calendar data on a read-only basis</li>
              <li>Confirm you have the right to grant such access</li>
              <li>Understand that we use OAuth 2.0 for secure authentication</li>
              <li>Agree that we may store your name, email address, profile image, and login timestamps to maintain your account</li>
              <li>Can revoke calendar access at any time through your Google account settings</li>
              <li>Can request full account and data deletion by contacting us at <a href="mailto:Persistwork1@gmail.com" className="text-blue-600 hover:underline">Persistwork1@gmail.com</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">4. Data Collection and Privacy</h2>
            <p>
              Your privacy is important to us. Our data practices include:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>No permanent storage of your calendar data — it is processed in real-time only</li>
              <li>Storage of a minimal account profile (name, email, image, login timestamps) to support your account</li>
              <li>Storage of anonymized usage events (card swipes, metric clicks, card shares) linked to your email to improve the product</li>
              <li>No sharing or selling of your data with third parties</li>
              <li>No use of your data for advertising or marketing</li>
            </ul>
            <p className="mt-3">
              For full details, please review our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">5. Service Availability</h2>
            <p>
              While we strive to maintain consistent service availability, we do not guarantee:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Uninterrupted or error-free service</li>
              <li>Specific uptime percentages</li>
              <li>Compatibility with all devices or browsers</li>
            </ul>
            <p className="mt-3">
              We reserve the right to modify, suspend, or discontinue the Service at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">6. Acceptable Use</h2>
            <p>
              You agree not to:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to breach or test the security of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to reverse engineer the Service</li>
              <li>Share your account access with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">7. Intellectual Property</h2>
            <p>
              All content, features, and functionality of PERSISTWORK are owned by us and are protected by
              intellectual property laws. The scoring algorithms (Focus, Strain, Balance), mood detection system,
              analysis methods, and user interface are proprietary.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">8. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND. We specifically disclaim:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Any warranties of merchantability or fitness for a particular purpose</li>
              <li>The accuracy, reliability, or completeness of the analysis</li>
              <li>That the Service will meet your specific requirements</li>
            </ul>
            <p className="mt-3 font-medium">
              The insights provided are for informational purposes only and should not be considered medical,
              psychological, or professional advice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages resulting from your use or inability to use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">10. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. We will notify users of any material
              changes by updating the &ldquo;Effective Date&rdquo; at the top of this page. Continued use of the Service
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">11. Contact Information</h2>
            <p>
              For questions about these Terms of Service, data deletion requests, or any other inquiries,
              please contact us at{' '}
              <a href="mailto:Persistwork1@gmail.com" className="text-blue-600 hover:underline">
                Persistwork1@gmail.com
              </a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
