import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar } from "lucide-react"
import { getPageContent, getFromContent } from "@/lib/website-content"

export default async function BookingCTA() {
  // Fetch content from database
  const content = await getPageContent('home')
  const title = getFromContent(content, 'home', 'booking-cta', 'title') || 'Ready to Book Your AI Keynote Speaker?'
  const subtitle = getFromContent(content, 'home', 'booking-cta', 'subtitle') || 'Connect with our expert team to find the perfect AI speaker for your event. We make the booking process seamless and efficient.'

  // Primary CTA button
  const primaryCtaText = getFromContent(content, 'home', 'booking-cta', 'primary_cta_text') || 'Get Speaker Recommendations'
  const primaryCtaLink = getFromContent(content, 'home', 'booking-cta', 'primary_cta_link') || '/contact?source=home_page_cta_main'

  // Secondary CTA button
  const secondaryCtaText = getFromContent(content, 'home', 'booking-cta', 'secondary_cta_text') || 'Explore All Speakers'
  const secondaryCtaLink = getFromContent(content, 'home', 'booking-cta', 'secondary_cta_link') || '/speakers'

  // Contact info - support both combined key and individual keys
  const contactInfoOverride = getFromContent(content, 'home', 'booking-cta', 'contact_info')
  const whatsappNumber = getFromContent(content, 'home', 'booking-cta', 'whatsapp_number') || '+1 (415) 665-2442'
  const whatsappLink = getFromContent(content, 'home', 'booking-cta', 'whatsapp_link') || 'https://wa.me/14156652442'
  const email = getFromContent(content, 'home', 'booking-cta', 'email') || 'human@speakabout.ai'

  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20 text-white">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-4xl font-bold mb-6 font-neue-haas leading-tight">{title}</h2>
        <p className="text-xl mb-10 text-blue-100 max-w-2xl mx-auto font-montserrat">
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            asChild
            variant="gold"
            size="lg"
            className="font-montserrat font-bold transition-all duration-300 ease-in-out transform hover:scale-105 group"
          >
            <Link href={primaryCtaLink} className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
              {primaryCtaText}
            </Link>
          </Button>
          <Button
            asChild
            variant="default"
            size="lg"
            className="bg-white text-blue-700 hover:bg-gray-100 transition-all duration-300 ease-in-out transform hover:scale-105 group font-montserrat"
          >
            <Link href={secondaryCtaLink} className="flex items-center">
              {secondaryCtaText}
              <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
        {contactInfoOverride ? (
          <p className="mt-8 text-sm text-blue-200 font-montserrat">{contactInfoOverride}</p>
        ) : (
          <p className="mt-8 text-sm text-blue-200 font-montserrat">
            Text or call us at{" "}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:underline"
            >
              {whatsappNumber} on WhatsApp
            </a>{" "}
            or reach out to{" "}
            <a
              href={`mailto:${email}`}
              className="font-semibold hover:underline"
            >
              {email}
            </a>{" "}
            by email
          </p>
        )}
      </div>
    </section>
  )
}
