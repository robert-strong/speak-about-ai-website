import type { Metadata } from "next"
import ServicesHero from "@/components/services-hero"
import ServiceOfferings from "@/components/service-offerings"
import ClientCaseStudies from "@/components/client-case-studies"
import ServiceProcess from "@/components/service-process"
import EventsSection from "@/components/events-section"
import FAQSection from "@/components/faq-section"
import ServicesContact from "@/components/services-contact"
import { getPageContent, getFromContent } from "@/lib/website-content"

export const metadata: Metadata = {
  title: "AI Speaker Services & Event Solutions | Speak About AI",
  description:
    "Discover AI speaker services from Speak About AI: keynotes, panels, workshops, fireside chats, and custom presentations. Connect with world-class AI experts for your event.",
  keywords:
    "AI speaker services, AI keynote speakers, AI panel discussions, AI fireside chats, AI workshops, artificial intelligence speaking bureau, virtual AI presentations",
  alternates: {
    canonical: "https://speakabout.ai/our-services",
  },
}

export default async function OurServicesPage() {
  // Fetch content for client components
  const content = await getPageContent('services')

  // Events section props
  const eventsProps = {
    sectionTitle: getFromContent(content, 'services', 'events', 'section_title'),
    sectionSubtitle: getFromContent(content, 'services', 'events', 'section_subtitle'),
    latestEventTitle: getFromContent(content, 'services', 'events', 'latest_event_title'),
    latestEventDescription: getFromContent(content, 'services', 'events', 'latest_event_description'),
    latestEventCta: getFromContent(content, 'services', 'events', 'latest_event_cta'),
    newsletterTitle: getFromContent(content, 'services', 'events', 'newsletter_title'),
    newsletterDescription: getFromContent(content, 'services', 'events', 'newsletter_description'),
    eventImage: getFromContent(content, 'services', 'events', 'event_image'),
  }

  // FAQ section props
  const faqProps = {
    sectionTitle: getFromContent(content, 'services', 'faq', 'section_title'),
    faq1Question: getFromContent(content, 'services', 'faq', 'faq1_question'),
    faq1Answer: getFromContent(content, 'services', 'faq', 'faq1_answer'),
    faq2Question: getFromContent(content, 'services', 'faq', 'faq2_question'),
    faq2Answer: getFromContent(content, 'services', 'faq', 'faq2_answer'),
    faq3Question: getFromContent(content, 'services', 'faq', 'faq3_question'),
    faq3Answer: getFromContent(content, 'services', 'faq', 'faq3_answer'),
    faq4Question: getFromContent(content, 'services', 'faq', 'faq4_question'),
    faq4Answer: getFromContent(content, 'services', 'faq', 'faq4_answer'),
  }

  return (
    <div className="min-h-screen bg-white">
      <ServicesHero />
      <ServiceOfferings />
      <ClientCaseStudies />
      <ServiceProcess />
      <EventsSection {...eventsProps} />
      <FAQSection {...faqProps} />
      <ServicesContact />
    </div>
  )
}
