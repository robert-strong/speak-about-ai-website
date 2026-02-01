import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Speak About AI", // 33 chars
  description:
    "Learn how Speak About AI collects, uses, and protects your personal information. Our privacy policy explains our data practices and your rights.",
  alternates: {
    canonical: "https://speakabout.ai/privacy",
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

          <p className="text-lg text-gray-600 mb-8">
            <strong>Last updated:</strong> January 2025
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Speak About AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you visit our website
                speakabout.ai (the "Service") or engage with our AI keynote speaker bureau services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may collect personal information that you voluntarily provide to us when you:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Fill out contact forms or request speaker information</li>
                <li>Subscribe to our newsletter or blog updates</li>
                <li>Register for events or webinars</li>
                <li>Communicate with us via email, phone, or chat</li>
                <li>Apply to join our speaker roster</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                This information may include: name, email address, phone number, company name, job title, event details,
                and any other information you choose to provide.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Automatically Collected Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you visit our Service, we may automatically collect certain information about your device,
                including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>IP address and location data</li>
                <li>Browser type and version</li>
                <li>Operating system</li>
                <li>Referring website</li>
                <li>Pages viewed and time spent on our site</li>
                <li>Device identifiers and usage data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect for various purposes, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Providing and maintaining our speaker bureau services</li>
                <li>Processing and responding to your inquiries and requests</li>
                <li>Matching you with appropriate AI keynote speakers</li>
                <li>Sending you newsletters, updates, and marketing communications (with your consent)</li>
                <li>Improving our website and services</li>
                <li>Analyzing usage patterns and trends</li>
                <li>Preventing fraud and ensuring security</li>
                <li>Complying with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information
                in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>
                  <strong>With Speakers:</strong> We may share relevant event and contact information with our speakers
                  to facilitate bookings
                </li>
                <li>
                  <strong>Service Providers:</strong> We may share information with trusted third-party service
                  providers who assist us in operating our website and conducting our business
                </li>
                <li>
                  <strong>Legal Requirements:</strong> We may disclose information if required by law or in response to
                  valid legal requests
                </li>
                <li>
                  <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your
                  information may be transferred
                </li>
                <li>
                  <strong>Consent:</strong> We may share information with your explicit consent
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction. However, no method of
                transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute
                security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your experience on our website. We respect your 
                privacy choices and provide clear options for managing your cookie preferences.
              </p>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Types of Cookies We Use</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Necessary Cookies (Required)</h4>
                  <p className="text-gray-700 leading-relaxed">
                    These cookies are essential for the website to function properly. They enable basic functionality 
                    such as page navigation, authentication, and security features. These cookies cannot be disabled 
                    as they are necessary for the service to work.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Analytics Cookies (Optional)</h4>
                  <p className="text-gray-700 leading-relaxed">
                    With your consent, we use analytics cookies to understand how visitors interact with our website. 
                    This helps us improve user experience and website performance. We collect data such as:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                    <li>Page views and session duration</li>
                    <li>Device type, browser, and operating system</li>
                    <li>General location (country/city level)</li>
                    <li>Referrer information and traffic sources</li>
                    <li>User interactions and behavior patterns</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Marketing Cookies (Optional)</h4>
                  <p className="text-gray-700 leading-relaxed">
                    These cookies track visitors across websites to provide relevant advertising and measure campaign 
                    effectiveness. You can opt out of these cookies without affecting core website functionality.
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-medium text-gray-900 mb-3">Managing Your Cookie Preferences</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We provide you with clear choices about cookies:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>A cookie consent banner appears when you first visit our site</li>
                <li>You can accept all cookies, necessary cookies only, or customize your preferences</li>
                <li>You can change your preferences at any time by clearing your browser cookies</li>
                <li>Your consent is stored locally and respected across your browsing session</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                You can also control cookies through your browser settings, but disabling necessary cookies may affect 
                your ability to use certain features of our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our website may contain links to third-party websites or integrate with third-party services (such as
                Google Analytics, social media platforms, or chat services). We are not responsible for the privacy
                practices of these third parties. We encourage you to review their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have certain rights regarding your personal information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>
                  <strong>Access:</strong> Request access to your personal information
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate or incomplete information
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal information
                </li>
                <li>
                  <strong>Portability:</strong> Request a copy of your information in a portable format
                </li>
                <li>
                  <strong>Opt-out:</strong> Unsubscribe from marketing communications
                </li>
                <li>
                  <strong>Restriction:</strong> Request restriction of processing in certain circumstances
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in
                this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer
                need your information, we will securely delete or anonymize it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure that
                such transfers comply with applicable data protection laws and implement appropriate safeguards to
                protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our Service is not intended for children under the age of 13. We do not knowingly collect personal
                information from children under 13. If we become aware that we have collected personal information from
                a child under 13, we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this
                Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Speak About AI</strong>
                </p>
                <p className="text-gray-700 mb-2">Email: human@speakabout.ai</p>
                <p className="text-gray-700 mb-2">Phone: +1 (415) 665-2442</p>
                <p className="text-gray-700">Address: Palo Alto, CA</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
