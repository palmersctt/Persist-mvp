export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-light text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Effective Date: January 5, 2025</p>
        
        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using PERSIST ("Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">2. Service Description</h2>
            <p>
              PERSIST is a work health intelligence platform that analyzes your Google Calendar data to provide 
              insights about your cognitive performance, work patterns, and schedule sustainability. The Service:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Provides real-time analysis of your calendar patterns</li>
              <li>Calculates performance metrics based on meeting density and schedule</li>
              <li>Offers recommendations for sustainable work practices</li>
              <li>Does not store your calendar data permanently</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">3. User Accounts and Authentication</h2>
            <p>
              To use PERSIST, you must authenticate using your Google account. By doing so, you:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Authorize us to access your Google Calendar data on a read-only basis</li>
              <li>Confirm you have the right to grant such access</li>
              <li>Understand that we use OAuth 2.0 for secure authentication</li>
              <li>Can revoke access at any time through your Google account settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">4. Data Usage and Privacy</h2>
            <p>
              Your privacy is important to us. Our data practices include:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>No permanent storage of your calendar data</li>
              <li>Real-time analysis with session-based temporary storage only</li>
              <li>No sharing of your data with third parties</li>
              <li>No use of your data for advertising or marketing</li>
              <li>Automatic data clearing when you sign out</li>
            </ul>
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
              All content, features, and functionality of PERSIST are owned by us and are protected by 
              intellectual property laws. The performance algorithms, analysis methods, and user interface 
              are proprietary.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">8. Disclaimers</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We specifically disclaim:
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
              changes by updating the "Effective Date" at the top of this page. Continued use of the Service 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light text-gray-900 mb-4">11. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us through the application.
            </p>
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