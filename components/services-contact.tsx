import { Button } from "@/components/ui/button"
import { Phone, Mail, Calendar } from "lucide-react"
import Link from "next/link"
import { getPageContent, getFromContent } from "@/lib/website-content"

export default async function ServicesContact() {
  // Fetch content from database
  const content = await getPageContent('services')

  const title = getFromContent(content, 'services', 'cta', 'title') || 'Ready to Elevate Your Event?'
  const subtitle = getFromContent(content, 'services', 'cta', 'subtitle') || 'Let us connect you with the perfect AI expert to inspire your audience and drive meaningful conversations about the future of artificial intelligence.'
  const buttonText = getFromContent(content, 'services', 'cta', 'button_text') || 'Book Speaker Today'
  const phoneNumber = getFromContent(content, 'services', 'cta', 'phone_number') || '+1-415-665-2442'
  const email = getFromContent(content, 'services', 'cta', 'email') || 'human@speakabout.ai'

  const stat1Value = getFromContent(content, 'services', 'cta', 'stat1_value') || '24 Hours'
  const stat1Label = getFromContent(content, 'services', 'cta', 'stat1_label') || 'Average Response Time'
  const stat2Value = getFromContent(content, 'services', 'cta', 'stat2_value') || '67+'
  const stat2Label = getFromContent(content, 'services', 'cta', 'stat2_label') || 'AI Experts Available'
  const stat3Value = getFromContent(content, 'services', 'cta', 'stat3_value') || '500+'
  const stat3Label = getFromContent(content, 'services', 'cta', 'stat3_label') || 'Successful Events'

  // Format phone for display
  const displayPhone = phoneNumber.replace('+1-', '').replace(/-/g, ' ')

  return (
    <section className="py-20 bg-[#1E68C6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6 font-neue-haas">{title}</h2>
        <p className="text-xl text-white text-opacity-90 mb-10 max-w-3xl mx-auto font-montserrat">
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-lg px-8 py-4 font-montserrat"
          >
            <Link href="/contact?source=services_page_cta">
              <Calendar className="w-5 h-5 mr-2" />
              {buttonText}
            </Link>
          </Button>
          <Button
            asChild
            variant="default"
            size="lg"
            className="bg-white text-[#1E68C6] hover:bg-gray-100 text-lg px-8 py-4 font-montserrat"
          >
            <a href={`tel:${phoneNumber}`}>
              <Phone className="w-5 h-5 mr-2" />
              Call: ({displayPhone.slice(0, 3)}) {displayPhone.slice(4)}
            </a>
          </Button>
          <Button
            asChild
            variant="default"
            size="lg"
            className="bg-white text-[#1E68C6] hover:bg-gray-100 text-lg px-8 py-4 font-montserrat"
          >
            <a href={`mailto:${email}`}>
              <Mail className="w-5 h-5 mr-2" />
              Email Us
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-white mb-2 font-neue-haas">{stat1Value}</div>
            <div className="text-white text-opacity-90 font-montserrat">{stat1Label}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-2 font-neue-haas">{stat2Value}</div>
            <div className="text-white text-opacity-90 font-montserrat">{stat2Label}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white mb-2 font-neue-haas">{stat3Value}</div>
            <div className="text-white text-opacity-90 font-montserrat">{stat3Label}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
