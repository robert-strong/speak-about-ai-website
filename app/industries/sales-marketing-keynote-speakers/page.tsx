import type { Metadata } from "next"
import { getSpeakersByIndustry } from "@/lib/speakers-data"
import IndustryPageClient from "../IndustryPageClient"

export const metadata: Metadata = {
  title: "Sales, Marketing & Retail AI Keynote Speakers | Commerce Experts",
  description:
    "Book top sales, marketing, and retail AI keynote speakers for commerce conferences. Experts in AI-powered marketing, e-commerce, and customer experience.",
  keywords: [
    "sales keynote speakers",
    "marketing keynote speakers",
    "retail keynote speakers",
    "e-commerce speakers",
    "AI marketing speakers",
    "customer experience speakers",
    "digital marketing keynote speakers",
  ],
  alternates: {
    canonical: "https://speakabout.ai/industries/sales-marketing-keynote-speakers",
  },
}

export default async function SalesMarketingKeynoteSpeakersPage() {
  const speakers = await getSpeakersByIndustry("sales")

  return (
    <IndustryPageClient
      speakers={speakers}
      industry={{
        name: "Sales, Marketing & Retail",
        slug: "sales-marketing",
        badge: "Sales & Marketing AI Experts",
        headline: "Top Sales, Marketing & Retail Keynote Speakers",
        description: "Transform your commerce event with leading sales, marketing, and retail keynote speakers specializing in AI and digital innovation. Our experts are revolutionizing customer engagement, e-commerce, and brand strategy through artificial intelligence. They work with top brands and retailers worldwide.",
        featuredTitle: "Featured Sales, Marketing & Retail Keynote Speakers",
        featuredDescription: "Our sales and marketing keynote speakers are top CMOs, growth experts, and AI innovators. They lead marketing transformation at global brands, e-commerce giants, and innovative agencies. Many specialize in artificial intelligence applications in customer engagement and personalization.",
        ctaTitle: "Ready to Transform Your Commerce Event?",
        ctaDescription: "Connect with our sales, marketing, and retail keynote speakers. Leading brands, retailers, and marketing teams worldwide trust them to deliver cutting-edge insights on AI-powered growth.",
        bookButtonText: "Book Sales & Marketing Keynote Speakers",
        contactSource: "sales_marketing_keynote_speakers",
        speakingTopics: [
          { title: "AI-Powered Marketing", description: "Machine learning for personalization, targeting, and campaign optimization." },
          { title: "Customer Experience & AI", description: "Transforming customer journeys with intelligent automation and insights." },
          { title: "E-Commerce Innovation", description: "AI-driven retail, recommendation engines, and digital commerce trends." },
          { title: "Sales Automation & AI", description: "Intelligent CRM, predictive analytics, and AI-powered sales enablement." },
          { title: "Brand Strategy & AI", description: "Building brands in the age of artificial intelligence and automation." },
          { title: "Digital Advertising", description: "Programmatic advertising, AI creative, and performance marketing." },
        ],
        organizationsServed: [
          "Global Brands",
          "Retail Chains",
          "E-Commerce Companies",
          "Marketing Agencies",
          "CPG Companies",
          "Sales Organizations",
          "Advertising Agencies",
          "MarTech Companies",
          "Retail Associations",
          "Commerce Conferences",
          "Brand Summits",
          "CMO Forums",
        ],
      }}
    />
  )
}
