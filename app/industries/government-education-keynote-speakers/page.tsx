import type { Metadata } from "next"
import { getSpeakersByIndustry } from "@/lib/speakers-data"
import IndustryPageClient from "../IndustryPageClient"

export const metadata: Metadata = {
  title: "Government & Education AI Keynote Speakers | Public Sector Experts",
  description:
    "Book top government and education AI keynote speakers for public sector events. Experts in AI policy, EdTech, and digital government transformation.",
  keywords: [
    "government keynote speakers",
    "education keynote speakers",
    "public sector speakers",
    "AI policy speakers",
    "EdTech speakers",
    "digital government speakers",
    "higher education keynote speakers",
  ],
  alternates: {
    canonical: "https://speakabout.ai/industries/government-education-keynote-speakers",
  },
}

export default async function GovernmentEducationKeynoteSpeakersPage() {
  const speakers = await getSpeakersByIndustry("government")

  return (
    <IndustryPageClient
      speakers={speakers}
      industry={{
        name: "Government & Education",
        slug: "government-education",
        badge: "Government & Education AI Experts",
        headline: "Top Government & Education Keynote Speakers",
        description: "Transform your public sector event with leading government and education keynote speakers specializing in AI and digital transformation. Our experts are reshaping public services, education systems, and policy through artificial intelligence. They advise governments and institutions worldwide.",
        featuredTitle: "Featured Government & Education Keynote Speakers",
        featuredDescription: "Our government and education keynote speakers are top policy experts, EdTech innovators, and AI researchers. They lead transformation at government agencies, universities, and educational organizations. Many specialize in artificial intelligence applications in public services and learning.",
        ctaTitle: "Ready to Transform Your Public Sector Event?",
        ctaDescription: "Connect with our government and education keynote speakers. Leading government agencies, universities, and public institutions worldwide trust them to deliver cutting-edge insights on AI in the public sector.",
        bookButtonText: "Book Government & Education Keynote Speakers",
        contactSource: "government_education_keynote_speakers",
        speakingTopics: [
          { title: "AI Policy & Governance", description: "Regulatory frameworks, ethical AI, and responsible AI deployment in government." },
          { title: "Digital Government", description: "AI-powered citizen services, smart cities, and government modernization." },
          { title: "EdTech & AI in Learning", description: "Personalized learning, intelligent tutoring systems, and educational AI." },
          { title: "Higher Education Innovation", description: "AI research, university transformation, and future of academia." },
          { title: "Public Safety & Security", description: "AI applications in defense, law enforcement, and emergency response." },
          { title: "Workforce Development", description: "Preparing the public sector workforce for the AI era." },
        ],
        organizationsServed: [
          "Federal Agencies",
          "State & Local Government",
          "Universities & Colleges",
          "K-12 School Districts",
          "Defense & Intelligence",
          "Policy Think Tanks",
          "Educational Associations",
          "Government Contractors",
          "Nonprofit Organizations",
          "Research Institutions",
          "International Organizations",
          "Public Administration Conferences",
        ],
      }}
    />
  )
}
