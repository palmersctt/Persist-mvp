export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-light text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Effective Date: January 5, 2025</p>
        
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">Our Privacy Commitment</h2>
            <p className="text-lg">
              PERSIST is built with privacy-first principles. We analyze your work patterns without storing 
              your personal data. Your calendar information is processed in real-time and never saved to our servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">1. Information We Access</h2>
            <p>When you use PERSIST, we access:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Google Account Information:</strong> Your name, email address, and profile picture</li>
              <li><strong>Calendar Data:</strong> Event titles, times, durations, and attendee counts from your Google Calendar</li>
              <li><strong>OAuth Tokens:</strong> Temporary authentication tokens to access your Google services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p>We use your information exclusively to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Calculate your Adaptive Performance Index</li>
              <li>Measure your Cognitive Resilience score</li>
              <li>Assess your Sustainability Index</li>
              <li>Generate personalized work health insights</li>
              <li>Display your profile information in the application</li>
            </ul>
            <p className="mt-3 font-medium">
              All analysis happens in real-time during your session. We do not store historical data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">3. Data Storage and Security</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="font-medium text-green-900">🔒 Key Privacy Feature: No Permanent Storage</p>
              <p className="text-green-800 mt-2">
                We do not maintain a database of user information. Your data exists only in encrypted 
                session memory while you're logged in and is completely cleared when you sign out.
              </p>
            </div>
            <p>Our security measures include:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>OAuth 2.0 secure authentication</li>
              <li>Encrypted session management via NextAuth.js</li>
              <li>HTTPS encryption for all data transmission</li>
              <li>No permanent data storage or databases</li>
              <li>Automatic session clearing on logout</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">4. Data Sharing</h2>
            <p className="font-medium mb-3">We do not share your data. Period.</p>
            <p>Specifically, we do not:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Sell your data to third parties</li>
              <li>Share your calendar information with anyone</li>
              <li>Use your data for advertising or marketing</li>
              <li>Allow any external access to your information</li>
              <li>Store data for analysis beyond your current session</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">5. Cookies and Tracking</h2>
            <p>We use minimal cookies solely for:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Session Management:</strong> Encrypted session cookies to maintain your login state</li>
              <li><strong>Preferences:</strong> Local storage for UI preferences (like onboarding completion)</li>
            </ul>
            <p className="mt-3">
              We do not use analytics, tracking, or advertising cookies. We do not track your behavior 
              across other websites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">6. Your Rights and Controls</h2>
            <p>You have complete control over your data:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Access Control:</strong> Revoke our access anytime through Google Account settings</li>
              <li><strong>Data Deletion:</strong> Sign out to immediately clear all session data</li>
              <li><strong>Permissions:</strong> We only request read-only calendar access</li>
              <li><strong>Transparency:</strong> See exactly what we calculate in real-time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">7. Data Retention</h2>
            <p>Our data retention policy is simple:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>During Session:</strong> Data exists only in encrypted memory</li>
              <li><strong>After Logout:</strong> All data is immediately cleared</li>
              <li><strong>No Historical Storage:</strong> We don't keep any user data between sessions</li>
              <li><strong>Browser Storage:</strong> Only stores non-personal preferences (like "onboarding seen")</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">8. Children's Privacy</h2>
            <p>
              PERSIST is not intended for users under 18 years of age. We do not knowingly collect 
              information from children. The service is designed for professional work analysis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">9. Third-Party Services</h2>
            <p>We integrate with minimal third-party services:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Google OAuth:</strong> For authentication and calendar access</li>
              <li><strong>Vercel:</strong> For application hosting (they do not have access to your data)</li>
            </ul>
            <p className="mt-3">
              These services have their own privacy policies. We recommend reviewing Google's privacy 
              policy for information about how they handle your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">10. Changes to Privacy Policy</h2>
            <p>
              We may update this Privacy Policy to reflect changes in our practices or for legal reasons. 
              We will notify users of material changes by updating the "Effective Date" and, when appropriate, 
              through in-app notifications.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us 
              through the application.
            </p>
          </section>

          <section className="bg-gray-50 rounded-lg p-6 mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Privacy Summary</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>No permanent data storage</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Real-time analysis only</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>No data sharing or selling</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>You control your data</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-2">✓</span>
                <span>Clear data on logout</span>
              </li>
            </ul>
          </section>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-200">
          <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}