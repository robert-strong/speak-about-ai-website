import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | Speak About AI",
  description:
    "Read the terms and conditions for using Speak About AI website and services. Understand your rights and obligations.", // 119 chars
  alternates: {
    canonical: "https://speakabout.ai/terms",
  },
}

export default function TermsOfServicePage() {
  return (
    <main className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">Last Updated: June 24, 2025</p>

          <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
            <p>
              Welcome to Speak About AI. These Terms of Service ("Terms") govern your access to and use of the website
              located at speakabout.ai (the "Site") and the services provided by Speak About AI ("we," "us," or "our"),
              which include connecting individuals and organizations with keynote speakers specializing in artificial
              intelligence.
            </p>
            <p>
              By accessing or using our Site and services, you agree to be bound by these Terms and our{" "}
              <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                Privacy Policy
              </Link>
              . If you do not agree to these Terms, you may not use our Site or services.
            </p>

            <h2 className="text-2xl font-bold pt-6">1. Description of Services</h2>
            <p>
              Speak About AI acts as a bureau to facilitate connections between clients seeking AI expertise ("Clients")
              and professional speakers, presenters, and consultants ("Speakers"). Our services include providing
              information about Speakers, facilitating booking inquiries, and coordinating event logistics as agreed
              upon in separate contracts. We do not employ the Speakers and act as an agent or intermediary.
            </p>

            <h2 className="text-2xl font-bold pt-6">2. User Conduct and Obligations</h2>
            <p>
              You agree to use the Site and our services for lawful purposes only. You are responsible for providing
              accurate and complete information when submitting a booking inquiry or otherwise communicating with us.
              You agree not to:
            </p>
            <ul>
              <li>Use the Site in any way that could damage, disable, overburden, or impair it.</li>
              <li>Attempt to gain unauthorized access to any part of the Site or its systems.</li>
              <li>
                Use any content from the Site, including Speaker information, for any purpose other than evaluating and
                engaging our services, without our express written consent.
              </li>
              <li>Misrepresent your identity or affiliation with any person or organization.</li>
            </ul>

            <h2 className="text-2xl font-bold pt-6">3. Intellectual Property</h2>
            <p>
              All content on this Site, including text, graphics, logos, images, audio clips, video clips, and data
              compilations, is the property of Speak About AI or its content suppliers (including Speakers) and is
              protected by international copyright laws. The compilation of all content on this site is our exclusive
              property. You may not systematically extract or re-utilize parts of the contents of the Site without our
              express written consent.
            </p>
            <p>
              Speaker materials, including presentation slides, handouts, and recordings, are the intellectual property
              of the respective Speaker unless otherwise specified in a formal agreement.
            </p>

            <h2 className="text-2xl font-bold pt-6">4. Booking and Contracts</h2>
            <p>
              Submitting an inquiry through our Site does not constitute a confirmed booking. All speaker engagements
              are subject to Speaker availability and the execution of a formal, written contract between the Client,
              Speak About AI, and/or the Speaker. This contract will outline the specific terms of the engagement,
              including fees, payment schedules, travel arrangements, and cancellation policies.
            </p>

            <h2 className="text-2xl font-bold pt-6">5. Disclaimers and Limitation of Liability</h2>
            <p>
              The Site and its content are provided on an "as is" and "as available" basis. While we strive to provide
              accurate information, we make no warranties, express or implied, regarding the accuracy, completeness, or
              reliability of any information on the Site, including Speaker biographies, topics, or availability.
            </p>
            <p>
              To the fullest extent permitted by law, Speak About AI shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly
              or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your
              access to or use of or inability to access or use the services; (b) any conduct or content of any third
              party on the services, including without limitation, any defamatory, offensive or illegal conduct of other
              users or third parties; (c) any content obtained from the services; or (d) unauthorized access, use or
              alteration of your transmissions or content.
            </p>
            <p>
              Our liability for any and all claims arising from a specific speaker engagement is limited to the amount
              of the commission or fee received by Speak About AI for that engagement.
            </p>

            <h2 className="text-2xl font-bold pt-6">6. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Speak About AI, its affiliates, and their respective
              officers, directors, employees, and agents, from and against any claims, liabilities, damages, losses, and
              expenses, including, without limitation, reasonable legal and accounting fees, arising out of or in any
              way connected with your access to or use of the Site or your violation of these Terms.
            </p>

            <h2 className="text-2xl font-bold pt-6">7. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of California,
              United States, without regard to its conflict of law principles.
            </p>

            <h2 className="text-2xl font-bold pt-6">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the
              new Terms on this page and updating the "Last Updated" date. Your continued use of the Site after any such
              change constitutes your acceptance of the new Terms.
            </p>

            <h2 className="text-2xl font-bold pt-6">9. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <ul>
              <li>
                Email:{" "}
                <a href="mailto:human@speakabout.ai" className="text-blue-600 dark:text-blue-400 hover:underline">
                  human@speakabout.ai
                </a>
              </li>
              <li>
                Phone:{" "}
                <a href="tel:+14156652442" className="text-blue-600 dark:text-blue-400 hover:underline">
                  +1 (415) 665-2442
                </a>
              </li>
            </ul>
            <p className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <em className="text-sm text-gray-500 dark:text-gray-400">
                Disclaimer: This Terms of Service document is a template and is not a substitute for legal advice. You
                should consult with a legal professional to ensure it meets the specific needs and legal requirements of
                your business.
              </em>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
