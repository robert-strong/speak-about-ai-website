import type { Metadata } from "next"
import Link from "next/link"
import { Linkedin, Mail, Phone } from "lucide-react"

export const metadata: Metadata = {
  title: "Thank You for Your Inquiry | Speak About AI",
  description: "Your submission has been successfully received. We will be in touch shortly.",
  robots: {
    index: false, // Typically, thank you pages are not indexed
    follow: false,
  },
}

export default function ThankYouPage() {
  const brandBlue = "#1E68C6" // Your brand blue

  return (
    <div className="min-h-screen bg-gray-50 font-montserrat">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto bg-white p-8 sm:p-12 rounded-lg shadow-xl">
          <header className="text-center mb-10">
            <h1 className={`text-4xl sm:text-5xl font-bold text-gray-800`}>Thank You for Your Inquiry</h1>
            <p className="mt-4 text-xl text-gray-600">Your Submission Has Been Successfully Received</p>
          </header>

          <section className="text-gray-700 space-y-6">
            <p className="text-lg">
              We are excited to work with you! Your interest in Speak About AI and our roster of distinguished AI
              speakers is greatly appreciated. We understand the significance of every event and the unique impact a
              knowledgeable and engaging speaker can bring.
            </p>

            <div>
              <h2 className={`text-2xl font-semibold text-gray-800 mb-3`}>What Happens Next?</h2>
              <ul className="list-disc list-outside space-y-3 pl-5 text-gray-700">
                <li>
                  <span className="font-medium">Personalized Response:</span> Within the next 24 hours, our team will
                  carefully review your submission. We will then reach out to you to confirm additional details,
                  ensuring that we align the perfect speaker with the specific needs and vision of your event.
                </li>
                <li>
                  <span className="font-medium">Consultation:</span> If required, we'll arrange a consultation call.
                  This will be an opportunity to delve deeper into your event's objectives, explore speaker options, and
                  discuss how we can elevate your event experience.
                </li>
                <li>
                  <span className="font-medium">Tailored Options:</span> Based on our discussion, we'll provide you with
                  a curated selection of AI speakers, each chosen for their ability to resonate with your audience and
                  deliver insightful, impactful presentations.
                </li>
              </ul>
            </div>

            <div>
              <h2 className={`text-2xl font-semibold text-gray-800 mb-3`}>In the Meantime...</h2>
              <p>
                Feel free to explore our website for more information about our services and the notable AI experts we
                represent. You can start by visiting our{" "}
                <Link href="/" className="text-[#1E68C6] hover:underline font-medium">
                  homepage
                </Link>{" "}
                or browsing our{" "}
                <Link href="/speakers" className="text-[#1E68C6] hover:underline font-medium">
                  speaker directory
                </Link>
                .
              </p>
            </div>

            <div>
              <h2 className={`text-2xl font-semibold text-gray-800 mb-3`}>Stay Connected</h2>
              <p className="mb-3">
                We also invite you to follow us on LinkedIn where we share regular updates, event highlights, and
                thought leadership in the field of AI.
              </p>
              <Link
                href="https://www.linkedin.com/company/speakabout-ai/"
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[${brandBlue}] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${brandBlue}] transition-colors`}
              >
                <Linkedin size={20} className="mr-2" />
                Follow us on LinkedIn
              </Link>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="mb-4">
                Should you have any immediate questions or additional information to share about your event, please do
                not hesitate to contact us directly:
              </p>
              <div className="space-y-3">
                <p className="flex items-center">
                  <Mail size={20} className={`mr-3 text-[${brandBlue}]`} />
                  <a href="mailto:human@speakabout.ai" className={`text-[${brandBlue}] hover:underline`}>
                    human@speakabout.ai
                  </a>
                </p>
                <p className="flex items-center">
                  <Phone size={20} className={`mr-3 text-[${brandBlue}]`} />
                  <a href="tel:+1-415-665-2442" className={`text-[${brandBlue}] hover:underline`}>
                    +1 (415) 665-2442
                  </a>
                </p>
              </div>
            </div>

            <p className="pt-6 text-lg">
              We are committed to ensuring that your event is nothing short of remarkable and look forward to the
              opportunity to contribute to its success.
            </p>

            <p className="text-lg">
              Warm regards,
              <br />
              The Speak About AI Team
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
