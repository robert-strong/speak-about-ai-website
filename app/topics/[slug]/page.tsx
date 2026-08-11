import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SpeakerCard } from "@/components/speaker-card"
import { TOPIC_PAGES, getTopicPageConfig, getSpeakersForTopicPage } from "@/lib/topic-pages"

interface TopicPageProps {
  params: Promise<{ slug: string }>
}

export const revalidate = 3600

export async function generateStaticParams() {
  return TOPIC_PAGES.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params
  const config = getTopicPageConfig(slug)
  if (!config) return { title: "Page Not Found" }
  const url = `https://speakabout.ai/topics/${config.slug}`
  return {
    title: config.metaTitle,
    description: config.metaDescription,
    keywords: config.keywords,
    openGraph: {
      title: config.metaTitle,
      description: config.metaDescription,
      type: "website",
      url,
    },
    alternates: { canonical: url },
  }
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params
  const config = getTopicPageConfig(slug)
  if (!config) notFound()

  const speakers = await getSpeakersForTopicPage(config)
  const pageUrl = `https://speakabout.ai/topics/${config.slug}`
  const topNames = speakers.slice(0, 4).map((s) => s.name)

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://speakabout.ai" },
          { "@type": "ListItem", position: 2, name: "AI Speakers", item: "https://speakabout.ai/speakers" },
          { "@type": "ListItem", position: 3, name: config.metaTitle, item: pageUrl },
        ],
      },
      {
        "@type": "CollectionPage",
        name: config.metaTitle,
        url: pageUrl,
        description: config.metaDescription,
        mainEntity: {
          "@type": "ItemList",
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
        mainEntity: config.faqs.map((faq) => ({
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
          <p className="text-sm font-semibold tracking-wide uppercase text-[#1E68C6] mb-4">{config.eyebrow}</p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            {config.h1Line1}
            <span className="block text-[#1E68C6]">{config.h1Line2}</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            {config.heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#1E68C6] hover:bg-[#1557A5] text-white px-8 py-4 text-lg">
              <Link href={`/contact?source=topic_${config.slug.replace(/-/g, "_")}`}>Get Speaker Recommendations</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-[#1E68C6] text-[#1E68C6] hover:bg-[#1E68C6] hover:text-white px-8 py-4 text-lg bg-transparent"
            >
              <Link href="/speakers">Browse All Speakers</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Direct answer - the citable paragraph */}
      {speakers.length > 0 && (
        <section className="py-10 border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-lg text-gray-700 leading-relaxed">
              {config.answerLead}{" "}
              {topNames.map((name, i) => (
                <span key={name}>
                  <Link
                    href={`/speakers/${speakers[i].slug}`}
                    className="font-semibold text-[#1E68C6] hover:underline"
                  >
                    {name}
                  </Link>
                  {i < topNames.length - 2 ? ", " : i === topNames.length - 2 ? ", and " : ""}
                </span>
              ))}
              {" — "}all vetted and bookable through Speak About AI, with exact quotes and availability confirmed at
              no cost. The full list of {speakers.length} matching speakers is below.
            </p>
          </div>
        </section>
      )}

      {/* Speakers */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {speakers.map((speaker) => (
                <SpeakerCard
                  key={speaker.slug}
                  speaker={speaker}
                  contactSource={`topic_${config.slug.replace(/-/g, "_")}`}
                  maxTopicsToShow={3}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-6">
                We'll match you with the right speaker for this topic and budget.
              </p>
              <Button asChild className="bg-[#1E68C6] hover:bg-[#1557A5] text-white">
                <Link href={`/contact?source=topic_${config.slug.replace(/-/g, "_")}_empty`}>Request Speakers</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">{config.bodyHeading}</h2>
          <div className="space-y-5 text-lg text-gray-600 leading-relaxed">
            {config.bodyParagraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs - matches the FAQPage schema above */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {config.faqs.map((faq, i) => (
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
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Find the Right Speaker for Your Event</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Tell us your date, audience, and budget — we'll confirm availability and exact pricing for any speaker on
            this page.
          </p>
          <Button asChild size="lg" className="bg-white text-[#1E68C6] hover:bg-gray-100 px-8 py-4 text-lg">
            <Link href={`/contact?source=topic_${config.slug.replace(/-/g, "_")}_cta`}>Check Availability</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
