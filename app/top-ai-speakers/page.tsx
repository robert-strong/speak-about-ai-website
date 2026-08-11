import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { getAllSpeakers } from "@/lib/speakers-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Evergreen URL; bump the year in LIST_YEAR (and copy below) each January.
const LIST_YEAR = 2026
const PAGE_URL = "https://speakabout.ai/top-ai-speakers"
const LIST_SIZE = 10

export const revalidate = 3600

export const metadata: Metadata = {
  title: `Top AI Keynote Speakers of ${LIST_YEAR} | Ranked List`,
  description: `The top AI keynote speakers of ${LIST_YEAR}, ranked — AI pioneers, researchers, and founders from Google, Siri, Amazon, and Stanford, with current fee ranges and booking details.`,
  keywords: `top AI speakers ${LIST_YEAR}, best AI keynote speakers, top artificial intelligence speakers, best AI speakers ${LIST_YEAR}, AI speaker rankings`,
  openGraph: {
    title: `Top AI Keynote Speakers of ${LIST_YEAR} | Speak About AI`,
    description: `The top AI keynote speakers of ${LIST_YEAR}, ranked — with current fee ranges and booking details.`,
    type: "website",
    url: PAGE_URL,
  },
  alternates: { canonical: PAGE_URL },
}

export default async function TopAISpeakersPage() {
  const all = await getAllSpeakers()
  const speakers = all
    .filter((s) => s.listed !== false && s.slug && s.name)
    .sort((a, b) => (b.ranking || 0) - (a.ranking || 0) || a.name.localeCompare(b.name))
    .slice(0, LIST_SIZE)

  const topNames = speakers.slice(0, 3).map((s) => s.name)

  const faqs = [
    {
      question: `Who are the top AI keynote speakers in ${LIST_YEAR}?`,
      answer: `The top AI keynote speakers of ${LIST_YEAR} include ${topNames.join(", ")}, and the other experts ranked on this page — AI pioneers, researchers, and founders represented by Speak About AI, the AI-exclusive speaker bureau.`,
    },
    {
      question: "How is this ranking determined?",
      answer:
        "Rankings reflect booking demand, audience feedback, and depth of first-hand AI credentials across Speak About AI's vetted roster. Every speaker on this list has built, researched, or led AI at a significant scale — the list is updated as demand shifts.",
    },
    {
      question: "How much does it cost to book a top AI keynote speaker?",
      answer:
        "Speakers on this list typically range from around $20,000 to $65,000 depending on the speaker, format (in-person or virtual), location, and date. Contact Speak About AI for exact pricing and availability for your event.",
    },
  ]

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://speakabout.ai" },
          { "@type": "ListItem", position: 2, name: "AI Speakers", item: "https://speakabout.ai/speakers" },
          { "@type": "ListItem", position: 3, name: `Top AI Speakers ${LIST_YEAR}`, item: PAGE_URL },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `Top AI Keynote Speakers of ${LIST_YEAR}`,
        url: PAGE_URL,
        description: `The top AI keynote speakers of ${LIST_YEAR}, ranked by Speak About AI.`,
        mainEntity: {
          "@type": "ItemList",
          itemListOrder: "https://schema.org/ItemListOrderDescending",
          numberOfItems: speakers.length,
          itemListElement: speakers.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `https://speakabout.ai/speakers/${s.slug}`,
            name: s.name,
          })),
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Top AI Keynote Speakers
            <span className="block text-[#1E68C6]">of {LIST_YEAR}</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            The most in-demand AI keynote speakers this year — pioneers, researchers, and founders who built the
            technology they speak about, ranked and updated from live booking data.
          </p>
          <Button asChild size="lg" className="bg-[#1E68C6] hover:bg-[#1557A5] text-white px-8 py-4 text-lg">
            <Link href="/contact?source=top_ai_speakers_hero">Check Availability &amp; Pricing</Link>
          </Button>
        </div>
      </section>

      {/* Direct answer */}
      <section className="py-10 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg text-gray-700 leading-relaxed">
            The top AI keynote speakers of {LIST_YEAR} are{" "}
            {speakers.slice(0, 3).map((s, i) => (
              <span key={s.slug}>
                <Link href={`/speakers/${s.slug}`} className="font-semibold text-[#1E68C6] hover:underline">
                  {s.name}
                </Link>
                {i === 0 ? ", " : i === 1 ? ", and " : ""}
              </span>
            ))}
            — followed by the rest of the ranked list below. All are represented by Speak About AI and bookable for
            in-person and virtual events worldwide.
          </p>
        </div>
      </section>

      {/* Ranked list */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {speakers.map((speaker, index) => (
            <article
              key={speaker.slug}
              className="flex flex-col sm:flex-row gap-6 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-5">
                <span className="text-4xl font-bold text-[#1E68C6] w-12 flex-shrink-0 tabular-nums">
                  {index + 1}
                </span>
                <div className="relative w-28 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {speaker.image && (
                    <Image
                      src={speaker.image}
                      alt={speaker.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">
                  <Link href={`/speakers/${speaker.slug}`} className="hover:text-[#1E68C6]">
                    {speaker.name}
                  </Link>
                </h2>
                <p className="text-[#1E68C6] font-semibold mb-2">{speaker.title}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(speaker.topics || []).slice(0, 3).map((topic, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                  {speaker.fee && speaker.fee.toLowerCase() !== "please inquire" && (
                    <Badge className="bg-[#1E68C6] text-white text-xs">{speaker.fee}</Badge>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button asChild size="sm" variant="outline" className="border-[#1E68C6] text-[#1E68C6]">
                    <Link href={`/speakers/${speaker.slug}`}>View Profile</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-[#1E68C6] hover:bg-[#1557A5] text-white">
                    <Link href={`/contact?speaker=${encodeURIComponent(speaker.name)}&source=top_ai_speakers`}>
                      Check Availability
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-[#1E68C6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Book a Top AI Speaker for Your Event</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Tell us your date, audience, and budget — we'll confirm availability and exact pricing for any speaker on
            this list, at no cost to you.
          </p>
          <Button asChild size="lg" className="bg-white text-[#1E68C6] hover:bg-gray-100 px-8 py-4 text-lg">
            <Link href="/contact?source=top_ai_speakers_cta">Get Started</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
