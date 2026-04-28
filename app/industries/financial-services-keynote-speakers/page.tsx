import type { Metadata } from "next"
import { getSpeakersByIndustry } from "@/lib/speakers-data"
import IndustryPageClient from "../IndustryPageClient"

export const metadata: Metadata = {
  title: "Financial Services AI Keynote Speakers | Finance Experts",
  description:
    "Book top financial services AI keynote speakers for banking and finance conferences. Experts in fintech, AI in finance, and digital transformation.",
  keywords: [
    "financial services keynote speakers",
    "banking keynote speakers",
    "fintech speakers",
    "finance conference speakers",
    "AI in finance speakers",
    "investment keynote speakers",
    "financial technology speakers",
  ],
  alternates: {
    canonical: "https://speakabout.ai/industries/financial-services-keynote-speakers",
  },
}

export default async function FinancialServicesKeynoteSpeakersPage() {
  const speakers = await getSpeakersByIndustry("finance")

  return (
    <IndustryPageClient
      speakers={speakers}
      industry={{
        name: "Financial Services",
        slug: "financial-services",
        badge: "Financial Services AI Experts",
        headline: "Top Financial Services Keynote Speakers",
        description: "Transform your finance conference with leading financial services keynote speakers specializing in AI and fintech innovation. Our experts are reshaping banking, investment, and financial technology through artificial intelligence. They work across top banks, investment firms, and fintech companies worldwide.",
        featuredTitle: "Featured Financial Services Keynote Speakers",
        featuredDescription: "Our financial services keynote speakers are top finance professionals, fintech innovators, and AI thought leaders. They lead financial innovation at top banks, investment firms, and technology companies. Many specialize in artificial intelligence applications in finance and digital banking transformation.",
        ctaTitle: "Ready to Transform Your Finance Event?",
        ctaDescription: "Connect with our financial services keynote speakers. Leading banks, investment firms, and fintech companies worldwide trust them to deliver cutting-edge insights on the future of finance.",
        bookButtonText: "Book Financial Services Keynote Speakers",
        contactSource: "financial_services_keynote_speakers",
        speakingTopics: [
          { title: "AI in Banking & Finance", description: "Artificial intelligence for fraud detection, risk assessment, and automated trading strategies." },
          { title: "Digital Banking Transformation", description: "Modernizing financial services and AI-powered customer experiences." },
          { title: "Fintech Innovation", description: "Emerging trends in financial technology, blockchain, and digital payments." },
          { title: "AI-Powered Risk Management", description: "Machine learning for credit scoring, compliance, and regulatory technology." },
          { title: "Investment & Wealth Tech", description: "AI-driven portfolio management, robo-advisors, and algorithmic trading." },
          { title: "Future of Finance", description: "Cryptocurrency, DeFi, and the evolution of financial services." },
        ],
        organizationsServed: [
          "Investment Banks",
          "Commercial Banks",
          "Asset Management Firms",
          "Insurance Companies",
          "Fintech Startups",
          "Hedge Funds",
          "Private Equity Firms",
          "Payment Processors",
          "Credit Unions",
          "Financial Regulators",
          "Wealth Management Firms",
          "Cryptocurrency Exchanges",
        ],
      }}
    />
  )
}
