import type { Metadata } from "next"
import { getSpeakersByIndustry } from "@/lib/speakers-data"
import IndustryPageClient from "../IndustryPageClient"

export const metadata: Metadata = {
  title: "Leadership & Business AI Keynote Speakers | Strategy Experts",
  description:
    "Book top leadership and business AI keynote speakers for corporate events. Experts in AI strategy, digital transformation, and executive leadership.",
  keywords: [
    "leadership keynote speakers",
    "business keynote speakers",
    "executive speakers",
    "corporate conference speakers",
    "AI strategy speakers",
    "digital transformation speakers",
    "management keynote speakers",
  ],
  alternates: {
    canonical: "https://speakabout.ai/industries/leadership-business-keynote-speakers",
  },
}

export default async function LeadershipBusinessKeynoteSpeakersPage() {
  const speakers = await getSpeakersByIndustry("leadership")

  return (
    <IndustryPageClient
      speakers={speakers}
      industry={{
        name: "Leadership & Business",
        slug: "leadership-business",
        badge: "Leadership & Business AI Experts",
        headline: "Top Leadership & Business Keynote Speakers",
        description: "Transform your corporate event with leading leadership and business keynote speakers specializing in AI strategy and digital transformation. Our experts are reshaping how organizations lead, innovate, and compete in the AI era. They advise top executives and boards worldwide.",
        featuredTitle: "Featured Leadership & Business Keynote Speakers",
        featuredDescription: "Our leadership keynote speakers are top executives, strategy consultants, and AI thought leaders. They lead business transformation at Fortune 500 companies, top consulting firms, and innovative startups. Many specialize in artificial intelligence strategy and organizational change.",
        ctaTitle: "Ready to Transform Your Corporate Event?",
        ctaDescription: "Connect with our leadership and business keynote speakers. Leading corporations, consulting firms, and executive teams worldwide trust them to deliver cutting-edge insights on AI-driven leadership.",
        bookButtonText: "Book Leadership Keynote Speakers",
        contactSource: "leadership_business_keynote_speakers",
        speakingTopics: [
          { title: "AI Leadership & Strategy", description: "Leading organizations through AI adoption and digital transformation initiatives." },
          { title: "Executive Decision Making", description: "AI-powered insights for strategic planning and competitive advantage." },
          { title: "Organizational Transformation", description: "Change management and building AI-ready cultures." },
          { title: "Innovation & Disruption", description: "Leveraging emerging technologies to drive business growth." },
          { title: "Future of Work", description: "AI's impact on workforce, skills, and organizational structures." },
          { title: "Strategic Consulting", description: "Best practices for AI implementation and digital strategy." },
        ],
        organizationsServed: [
          "Fortune 500 Companies",
          "Management Consulting Firms",
          "Executive Leadership Teams",
          "Corporate Boards",
          "Business Schools",
          "Private Equity Firms",
          "Venture Capital Firms",
          "Professional Associations",
          "Industry Conferences",
          "C-Suite Retreats",
          "Strategy Summits",
          "Leadership Development Programs",
        ],
      }}
    />
  )
}
