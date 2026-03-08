import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-light text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Effective Date: March 7, 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">Our Privacy Commitment</h2>
            <p className="text-lg">
              PERSISTWORK is built with privacy-first principles. We analyze your work patterns using your
              calendar data, which is processed in real-time and never stored. We do store a minimal account
              profile and anonymized usage events solely to improve the product experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">1. Information We Collect</h2>
            <p>When you use PERSISTWORK, we collect and store the following:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Account Information:</strong> Your name, email address, and Google profile picture, stored in our database to identify your account across sessions.</li>
              <li><strong>Account Metadata:</strong> Timestamps for account creation, first login, and most recent login, and your account tier (free or premium).</li>
              <li><strong>Usage Events:</strong> Anonymized in-app interactions linked to your email, including card swipes, metric clicks, and card shares, along with associated metadata (such as the quote displayed). These are used to improve the product.</li>
              <li><strong>Calendar Data:</strong> Event titles, times, durations, and attendee counts from your Google Calendar. This data is processed in real-time only and is <strong>never stored</strong> in our database.</li>
              <li><strong>OAuth Tokens:</strong> Temporary authentication tokens to access your Google services, stored only in encrypted session memory.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p>We use your information exclusively to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Authenticate you and maintain your account across sessions</li>
              <li>Calculate your Focus, Strain, and Balance scores based on your calendar in real-time</li>
              <li>Detect your daily mood and generate a personalized daily card</li>
              <li>Track anonymized product usage events (swipes, clicks, shares) to understand how the product is being used and improve it</li>
              <li>Display your profile information within the application</li>
            </ul>
            <p className="mt-3 font-medium">
              We do not use your data for advertising, marketing, or any purpose beyond operating and improving PERSISTWORK.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">3. Data Storage and Security</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="font-medium text-blue-900">🔒 What We Store vs. What We Don&apos;t</p>
              <p className="text-blue-800 mt-2">
                Your <strong>calendar data is never stored</strong>. We do store a minimal account profile
                (name, email, profile image, login timestamps) and anonymized usage events in a secured
                database to power your account and improve the product.
              </p>
            </div>
            <p>Our security measures include:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>OAuth 2.0 secure authentication via Google</li>
              <li>Encrypted session management via NextAuth.js</li>
              <li>HTTPS encryption for all data transmission</li>
              <li>Row-level security (RLS) on all database tables</li>
              <li>Database hosted on Supabase with restricted access policies</li>
              <li>Calendar data processed in-memory only — never written to disk or database</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">4. Data Sharing</h2>
            <p className="font-medium mb-3">We do not sell or share your personal data.</p>
            <p>Specifically, we do not:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Sell your data to third parties</li>
              <li>Share your calendar information with anyone</li>
              <li>Use your data for advertising or marketing</li>
              <li>Allow any external access to your personal information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">5. Cookies and Tracking</h2>
            <p>We use minimal cookies solely for:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Session Management:</strong> Encrypted session cookies to maintain your login state</li>
              <li><strong>Preferences:</strong> Local storage for UI preferences (such as onboarding completion)</li>
            </ul>
            <p className="mt-3">
              We do not use analytics, advertising, or cross-site tracking cookies. We do not track your
              behavior across other websites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">6. Your Rights and Controls</h2>
            <p>You have control over your data. You may at any time:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Revoke Calendar Access:</strong> Remove our access anytime through your Google Account settings</li>
              <li><strong>Request Data Deletion:</strong> Email us at <a href="mailto:Persistwork1@gmail.com" className="text-blue-600 hover:underline">Persistwork1@gmail.com</a> to request deletion of your account profile and all associated usage events</li>
              <li><strong>Access Your Data:</strong> Request a copy of the data we hold about you by emailing us</li>
              <li><strong>Sign Out:</strong> Signing out immediately clears your session and calendar data from memory</li>
            </ul>
            <p className="mt-3">
              We will respond to data requests within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">7. Data Retention</h2>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Calendar Data:</strong> Never stored — processed in real-time and discarded when your session ends</li>
              <li><strong>Account Profile:</strong> Retained while your account is active. Deleted upon request.</li>
              <li><strong>Usage Events:</strong> Retained indefinitely in anonymized form to support product analytics. Deleted upon request.</li>
              <li><strong>Session Data:</strong> Cleared on logout</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">8. GDPR and CCPA</h2>
            <p>
              If you are located in the European Union or California, you have additional rights regarding
              your personal data, including the right to access, correct, port, or erase your data, and
              the right to object to or restrict certain processing. To exercise any of these rights, please
              contact us at <a href="mailto:Persistwork1@gmail.com" className="text-blue-600 hover:underline">Persistwork1@gmail.com</a>.
            </p>
            <p className="mt-3">
              We do not sell personal information as defined under the CCPA.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
            <p>
              PERSISTWORK is not intended for users under 18 years of age. We do not knowingly collect
              information from children. The service is designed for professional work analysis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">10. Third-Party Services</h2>
            <p>We integrate with the following third-party services:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Google OAuth:</strong> For authentication and calendar access</li>
              <li><strong>Supabase:</strong> For secure database hosting of account profiles and usage events</li>
              <li><strong>Vercel:</strong> For application hosting</li>
            </ul>
            <p className="mt-3">
              Each of these services maintains its own privacy policy. We recommend reviewing them for
              information about how they handle data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy to reflect changes in our practices or for legal reasons.
              We will notify users of material changes by updating the &ldquo;Effective Date&rdquo; and, when appropriate,
              through in-app notifications.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, your data, or would like to request data
              deletion or access, please contact us at{' '}
              <a href="mailto:Persistwork1@gmail.com" className="text-blue-600 hover:underline">
                Persistwork1@gmail.com
              </a>.
            </p>
          </section>

          <section className="bg-gray-50 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Privacy Summary</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Calendar data is never stored — real-time only</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Minimal account profile stored (name, email, image)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Anonymized usage events stored to improve the product</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>No data sharing or selling</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>You can request full data deletion at any time</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>GDPR and CCPA rights honored</span>
              </li>
            </ul>
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
