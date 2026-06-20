import type { Metadata } from "next"
import Link from "next/link"
import { getSpeakersForIndustryPage } from "@/lib/speakers-data"
import { SpeakerCard } from "@/components/speaker-card"
import { Button } from "@/components/ui/button"
import { Sparkles, TrendingUp, Tag, MessageSquare, Eye, Package } from "lucide-react"

const PAGE_URL = "https://speakabout.ai/industries/retail-ai-speakers"

export const metadata: Metadata = {
  title: "Retail AI Speakers | E-commerce Keynote Experts",
  description:
    "Book retail & e-commerce AI keynote speakers for retail events. Experts in personalization, demand forecasting, dynamic pricing, and customer experience.",
  keywords:
    "retail AI speakers, e-commerce keynote speakers, retail technology experts, personalization speakers, customer experience AI, retail demand forecasting keynote",
  openGraph: {
    title: "Retail & E-commerce AI Keynote Speakers | Speak About AI",
    description:
      "Book retail & e-commerce AI keynote speakers for retail events. Experts in personalization, demand forecasting, dynamic pricing, and customer experience.",
    type: "website",
    url: PAGE_URL,
  },
  alternates: { canonical: PAGE_URL },
}

const TOPICS = [
  {
    icon: <Sparkles className="w-8 h-8 text-[#1E68C6]" />,
    title: "Personalization & Recommendations",
    description:
      "AI recommendation engines that tailor products, offers, and content to every shopper in real time.",
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-[#1E68C6]" />,
    title: "Demand Forecasting",
    description:
      "Machine learning that predicts demand, reduces stockouts and overstock, and sharpens merchandising decisions.",
  },
  {
    icon: <Tag className="w-8 h-8 text-[#1E68C6]" />,
    title: "Dynamic Pricing",
    description:
      "AI-driven pricing models that respond to demand, competition, and inventory to maximize margin.",
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-[#1E68C6]" />,
    title: "Conversational Commerce",
    description:
      "Chatbots, virtual shopping assistants, and generative AI that guide customers and lift conversion.",
  },
  {
    icon: <Eye className="w-8 h-8 text-[#1E68C6]" />,
    title: "Computer Vision In-Store",
    description:
      "Cashierless checkout, shelf analytics, and footfall insights powered by computer vision.",
  },
  {
    icon: <Package className="w-8 h-8 text-[#1E68C6]" />,
    title: "Inventory & Supply Chain AI",
    description:
      "Smarter replenishment, fulfillment, and logistics that keep the right products in the right place.",
  },
]

export default async function RetailAISpeakersPage() {
  const speakers = await getSpeakersForIndustryPage("sales")

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://speakabout.ai" },
          { "@type": "ListItem", position: 2, name: "Industries", item: "https://speakabout.ai/speakers" },
          { "@type": "ListItem", position: 3, name: "Retail AI Speakers", item: PAGE_URL },
        ],
      },
      {
        "@type": "CollectionPage",
        name: "Retail & E-commerce AI Keynote Speakers",
        url: PAGE_URL,
        description:
          "AI keynote speakers for the retail and e-commerce industry — experts in personalization, demand forecasting, dynamic pricing, and customer experience.",
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
            Retail & E-commerce AI
            <span className="block text-[#1E68C6]">Keynote Speakers</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            Book world-class AI keynote speakers for retail and e-commerce events — experts in personalization,
            demand forecasting, dynamic pricing, and AI-powered customer experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#1E68C6] hover:bg-[#1557A5] text-white px-8 py-4 text-lg">
              <Link href="/contact?source=retail_hero">Book a Retail AI Speaker</Link>
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

      {/* Speakers */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Featured AI Speakers for Retail Events</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI experts help retailers and e-commerce brands win on personalization, pricing, and customer
              experience. Each can tailor a keynote to your audience and event.
            </p>
          </div>

          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {speakers.map((speaker) => (
                <SpeakerCard
                  key={speaker.slug}
                  speaker={speaker}
                  contactSource="retail_industry_page"
                  maxTopicsToShow={3}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg mb-6">
                We're curating retail and e-commerce AI speakers for your event.
              </p>
              <Button asChild className="bg-[#1E68C6] hover:bg-[#1557A5] text-white">
                <Link href="/contact?source=retail_no_speakers">Request Retail AI Speakers</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Topics */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Retail AI Keynote Topics</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From hyper-personalization to AI-driven supply chains, our speakers cover the technologies redefining
              how people shop.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TOPICS.map((topic, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center mb-4">
                  {topic.icon}
                  <h3 className="text-xl font-semibold text-gray-900 ml-3">{topic.title}</h3>
                </div>
                <p className="text-gray-600">{topic.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why book */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">
            Why Book an AI Speaker for Your Retail Event?
          </h2>
          <div className="space-y-5 text-lg text-gray-600 leading-relaxed">
            <p>
              Retail runs on knowing the customer — and AI now knows them better and faster than ever. From
              personalized recommendations and dynamic pricing to demand forecasting and cashierless stores,
              artificial intelligence is reshaping every step of the shopping journey, online and in-store.
            </p>
            <p>
              A strong AI keynote speaker helps your audience see where AI drives measurable lift today and how to
              adopt it without losing the human touch that builds loyalty. Our speakers have built AI products and
              advised major brands, and turn that experience into practical strategy for merchants, marketers, and
              operators.
            </p>
            <p>
              Whether you're hosting a retail conference, an e-commerce summit, a NRF-style expo, or an internal
              strategy offsite, we'll match you with a speaker who makes AI actionable for your retail audience.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-[#1E68C6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Reinvent the Customer Experience with AI</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Book a retail or e-commerce AI keynote speaker who can help your team win on personalization, pricing,
            and customer experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-[#1E68C6] hover:bg-gray-100 px-8 py-4 text-lg">
              <Link href="/contact?source=retail_cta">Get Speaker Recommendations</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-[#1E68C6] px-8 py-4 text-lg bg-transparent"
            >
              <Link href="/speakers">Browse All Speakers</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
