import type { Metadata } from "next"
import { getSpeakersByIndustry } from "@/lib/speakers-data"
import IndustryPageClient from "../IndustryPageClient"

export const metadata: Metadata = {
  title: "Industrial & Automotive AI Keynote Speakers | Manufacturing Experts",
  description:
    "Book top industrial and automotive AI keynote speakers for manufacturing conferences. Experts in Industry 4.0, autonomous vehicles, and smart manufacturing.",
  keywords: [
    "industrial keynote speakers",
    "automotive keynote speakers",
    "manufacturing speakers",
    "Industry 4.0 speakers",
    "autonomous vehicle speakers",
    "supply chain keynote speakers",
    "smart manufacturing speakers",
  ],
  alternates: {
    canonical: "https://speakabout.ai/industries/industrial-automotive-keynote-speakers",
  },
}

export default async function IndustrialAutomotiveKeynoteSpeakersPage() {
  const speakers = await getSpeakersByIndustry("industrial")

  return (
    <IndustryPageClient
      speakers={speakers}
      industry={{
        name: "Industrial & Automotive",
        slug: "industrial-automotive",
        badge: "Industrial & Automotive AI Experts",
        headline: "Top Industrial & Automotive Keynote Speakers",
        description: "Transform your industrial conference with leading automotive and manufacturing keynote speakers specializing in AI and Industry 4.0. Our experts are revolutionizing production, logistics, and autonomous systems through artificial intelligence. They work with top manufacturers and automotive companies worldwide.",
        featuredTitle: "Featured Industrial & Automotive Keynote Speakers",
        featuredDescription: "Our industrial keynote speakers are top manufacturing executives, autonomous vehicle pioneers, and AI innovators. They lead industrial transformation at major automotive companies, manufacturers, and technology firms. Many specialize in artificial intelligence applications in production and logistics.",
        ctaTitle: "Ready to Transform Your Industrial Event?",
        ctaDescription: "Connect with our industrial and automotive keynote speakers. Leading manufacturers, automotive companies, and industrial organizations worldwide trust them to deliver cutting-edge insights on AI-driven innovation.",
        bookButtonText: "Book Industrial Keynote Speakers",
        contactSource: "industrial_automotive_keynote_speakers",
        speakingTopics: [
          { title: "Industry 4.0 & Smart Manufacturing", description: "AI-powered production, IoT integration, and digital factory transformation." },
          { title: "Autonomous Vehicles & Mobility", description: "Self-driving technology, ADAS, and the future of transportation." },
          { title: "Supply Chain & Logistics AI", description: "Intelligent logistics, predictive maintenance, and supply chain optimization." },
          { title: "Robotics & Automation", description: "Industrial robots, cobots, and AI-driven manufacturing automation." },
          { title: "Energy & Sustainability", description: "AI for energy efficiency, renewable integration, and sustainable manufacturing." },
          { title: "Quality & Safety AI", description: "Machine vision, defect detection, and AI-powered quality control." },
        ],
        organizationsServed: [
          "Automotive Manufacturers",
          "Industrial Equipment Companies",
          "Logistics & Transportation Firms",
          "Energy Companies",
          "Aerospace & Defense",
          "Supply Chain Organizations",
          "Manufacturing Associations",
          "Robotics Companies",
          "Automotive Suppliers",
          "Industrial Conferences",
          "Engineering Societies",
          "Operations Summits",
        ],
      }}
    />
  )
}
