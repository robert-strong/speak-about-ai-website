import { getPageContent, getFromContent } from "@/lib/website-content"
import ClientLogosCarousel from "./client-logos-carousel"

// Default client logos (used as fallback if database doesn't have logos)
const defaultClients = [
  {
    name: "Stanford University",
    src: "/logos/stanford-university-logo-1024x335-1.png",
    alt: "Stanford University - Academic institution partnering with AI speaker bureau for tech conferences",
    size: "small",
  },
  {
    name: "Google",
    src: "/logos/Google_2015_logo.svg.png",
    alt: "Google - Technology leader using AI keynote speakers for corporate events",
    size: "small",
  },
  {
    name: "Amazon",
    src: "/logos/Amazon-Logo-2000.png",
    alt: "Amazon - E-commerce and cloud computing company booking AI expert speakers",
    size: "default",
  },
  {
    name: "Visa",
    src: "/logos/Visa_Inc._logo.svg",
    alt: "Visa - Global payments company using AI speakers for fintech conferences",
    size: "small",
  },
  {
    name: "Rio Innovation Week",
    src: "/logos/rio-innovation-week-new.png",
    alt: "Rio Innovation Week - Leading innovation conference in Brazil",
    size: "extra-large",
  },
  {
    name: "NICE",
    src: "/logos/nice-logo.png",
    alt: "NICE - Cloud platform for customer experience and financial crime solutions",
    size: "extra-large",
  },
  {
    name: "ST Engineering",
    src: "/logos/st-engineering-logo.png",
    alt: "ST Engineering - Global technology, defense and engineering group",
    size: "super-large",
  },
  {
    name: "Government of Korea",
    src: "/logos/korea-government-logo.png",
    alt: "Government of the Republic of Korea - Official government emblem",
    size: "extra-large",
  },
  {
    name: "Juniper Networks",
    src: "/logos/juniper-networks-logo.svg",
    alt: "Juniper Networks - AI-driven enterprise networking solutions",
    size: "extra-large",
  },
  {
    name: "KPMG",
    src: "/logos/KPMG_logo.svg.png",
    alt: "KPMG - Professional services firm booking AI speakers for business conferences",
    size: "default",
  },
]

export default async function ClientLogos() {
  // Fetch content from database
  const content = await getPageContent('home')
  const title = getFromContent(content, 'home', 'client-logos', 'title') || 'Trusted by Industry Leaders'
  const subtitle = getFromContent(content, 'home', 'client-logos', 'subtitle') || 'Our speakers have worked with leading organizations around the world for their most important events.'
  const ctaText = getFromContent(content, 'home', 'client-logos', 'cta_text') || 'View Past Clients & Events'
  const ctaLink = getFromContent(content, 'home', 'client-logos', 'cta_link') || '/our-services#testimonials'

  // Try to get logos from database, otherwise use defaults
  const logosJson = getFromContent(content, 'home', 'client-logos', 'logos')
  let clients = defaultClients
  if (logosJson) {
    try {
      const parsed = JSON.parse(logosJson)
      // Ensure every client has all required properties to prevent hydration mismatch
      clients = parsed.map((client: { name?: string; src?: string; alt?: string; size?: string }) => ({
        name: client.name || 'Client',
        src: client.src || '/placeholder.svg',
        alt: client.alt || `${client.name || 'Client'} logo`,
        size: client.size || 'default',
      }))
    } catch (e) {
      // Use defaults if JSON parsing fails
    }
  }

  return (
    <ClientLogosCarousel
      title={title}
      subtitle={subtitle}
      clients={clients}
      ctaText={ctaText}
      ctaLink={ctaLink}
    />
  )
}
